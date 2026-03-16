// src/app/dashboard/page.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import fs from 'fs';
import path from 'path';

import { DashboardClient } from "@/domains/dashboard/components/dashboard-client";
import { getAppPermission } from "@/shared/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BnetCharacter {
  id: string;
  name: string;
  realm: string;
  class_id: number;
  level: number;
}

async function getDashboardData(userId: string | undefined, roleLevel: string) {
  const recruitmentPermissionPromise = getAppPermission(roleLevel, "settings-recruitment");

  // Parallelize basic guild data, roster count, and events
  const [
    recruitmentPermission,
    guildRes,
    rosterCountRes,
    upcomingEventsRes,
    lastSyncedRes,
    guildSettingsRes,
  ] = await Promise.all([
    recruitmentPermissionPromise,
    supabaseAdmin
      .from("guilds_managed")
      .select("name, region, realm, faction, last_bnet_sync, wcl_client_id, wcl_client_secret")
      .maybeSingle() as any,
    supabaseAdmin
      .from("guild_members")
      .select("*", { count: "exact", head: true }) as any,
    supabaseAdmin
      .from("guild_events")
      .select("id, title, destination, event_date")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(5) as any,
    supabaseAdmin
      .from("guild_members")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .single() as any,
    supabaseAdmin
      .from("guilds_managed")
      .select("bizum_number, paypal_link")
      .limit(1)
      .maybeSingle() as any,
  ]);

  const canReviewRecruitment = recruitmentPermission.canView;
  const guild = guildRes.data;
  const rosterCount = rosterCountRes.count;
  const upcomingEvents = upcomingEventsRes.data;
  const lastSyncedRecord = lastSyncedRes.data;
  const guildSettings = guildSettingsRes.data;

  if (guildRes.error) {
    console.error("Dashboard: Error fetching guild data:", guildRes.error);
  }

  const nextRaid = upcomingEvents?.[0] || null;

  // Initialize data variables
  let myCharacters: BnetCharacter[] = [];
  let isBnetLinked = false;
  let myBisSelections: any[] = [];
  let recruitmentApplications: any[] = [];
  let recentLogs: any[] = [];
  let recentDonations: any[] = [];
  let donationGoals: any[] = [];
  let sessionUser: any = null;

  // Secondary parallel batch for user-specific data and public lists
  const secondaryPromises: Promise<any>[] = [];

  // 1. User Profile & Recruitment Applications (if authorized)
  const profilePromise = userId 
    ? (supabaseAdmin.from("profiles").select("user_id, battlenet_battletag").eq("user_id", userId).single() as any)
    : Promise.resolve({ data: null });
  secondaryPromises.push(profilePromise);

  if (canReviewRecruitment) {
    secondaryPromises.push(
      supabaseAdmin
        .from("recruitment_applications")
        .select("character_name, character_spec, character_class, created_at, status", { count: "exact" })
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3) as any
    );
  } else {
    secondaryPromises.push(Promise.resolve({ data: [], count: 0 }));
  }

  // 2. Public Lists (Donations, Active Goals)
  secondaryPromises.push(
    supabaseAdmin
      .from("guild_donations")
      .select("character_name, amount, description, created_at")
      .order("created_at", { ascending: false })
      .limit(5) as any
  );

  secondaryPromises.push(
    supabaseAdmin
      .from("guild_goals")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }) as any
  );

  const [profileRes, recruitmentRes, donationsRes, goalsRes] = await Promise.all(secondaryPromises);

  // Process User Data
  sessionUser = profileRes.data;
  isBnetLinked = !!sessionUser?.battlenet_battletag;
  recruitmentApplications = recruitmentRes.data || [];
  (recruitmentApplications as any).pendingCount = recruitmentRes.count || 0;
  recentDonations = donationsRes.data || [];
  const activeGoals = goalsRes.data || [];

  // 3. Conditional Batch (WCL & User Characters/BiS)
  const thirdBatch: Promise<any>[] = [];

  // WCL Logs
  if (guild?.wcl_client_id && guild?.wcl_client_secret) {
    thirdBatch.push((async () => {
      try {
        const authString = Buffer.from(`${guild.wcl_client_id}:${guild.wcl_client_secret}`).toString("base64");
        const tokenRes = await fetch("https://www.warcraftlogs.com/oauth/token", {
          method: "POST",
          headers: { Authorization: `Basic ${authString}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials",
          next: { revalidate: 3600 },
        });
        if (!tokenRes.ok) return [];
        const { access_token } = await tokenRes.json();
        const query = `query { reportData { reports(guildID: 743623, limit: 5) { data { code title startTime zone { name } } } } }`;
        const gqlRes = await fetch("https://www.warcraftlogs.com/api/v2/client", {
          method: "POST",
          headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          next: { revalidate: 300 },
        });
        if (!gqlRes.ok) return [];
        const wclData = await gqlRes.json();
        return wclData.data?.reportData?.reports?.data || [];
      } catch (e) {
        console.error("Dashboard: WCL Error", e);
        return [];
      }
    })());
  } else {
    thirdBatch.push(Promise.resolve([]));
  }

  // Characters & BiS
  if (isBnetLinked && userId) {
    thirdBatch.push((async () => {
      const { data: chars } = await supabaseAdmin
        .from("bnet_characters")
        .select("id, name, realm, realm_slug, class_id, level")
        .eq("user_id", userId)
        .order("level", { ascending: false });
      
      const limitedChars = (chars || []).slice(0, 5);
      
      if (chars && chars.length > 0) {
        const names = chars.map((c: any) => c.name);
        const realms = chars.map((c: any) => c.realm_slug);

        const { data: members } = await supabaseAdmin
          .from("guild_members")
          .select("id, profile_id")
          .in("character_name", names)
          .in("realm_slug", realms);

        if (members && members.length > 0) {
          const memberIds = members.map((m: any) => m.id);
          const { data: bis } = await supabaseAdmin
            .from("bis_selections")
            .select("item_name, item_icon, slot, boss_name, ilvl")
            .in("member_id", memberIds)
            .order("created_at", { ascending: false })
            .limit(5);

          // FIRE AND FORGET: Update profile_id for unlinked members
          const unlinkedMembers = members.filter((m: any) => !m.profile_id);
          if (unlinkedMembers.length > 0) {
             Promise.all(unlinkedMembers.map((m: any) => 
                supabaseAdmin.from("guild_members").update({ profile_id: userId }).eq("id", m.id)
             )).catch(e => console.error("Proactive link error", e));
          }

          return { myCharacters: limitedChars, myBisSelections: bis || [] };
        }
      }
      return { myCharacters: limitedChars, myBisSelections: [] };
    })());
  } else {
    thirdBatch.push(Promise.resolve({ myCharacters: [], myBisSelections: [] }));
  }

  // OPTIMIZATION: Get current amounts for ALL active goals in ONE query
  if (activeGoals.length > 0) {
    const goalNames = activeGoals.map((g: any) => g.name);
    thirdBatch.push(
      supabaseAdmin
        .from("guild_donations")
        .select("amount, description")
        .in("description", goalNames) as any
    );
  } else {
    thirdBatch.push(Promise.resolve({ data: [] }));
  }

  const [wclLogs, userAccountRes, goalsDonationsRes] = await Promise.all(thirdBatch);
  
  recentLogs = wclLogs;
  myCharacters = userAccountRes.myCharacters;
  myBisSelections = userAccountRes.myBisSelections;

  // Process Optimized Goals
  const allDonations = goalsDonationsRes.data || [];
  donationGoals = activeGoals.map((goal: any) => {
    const currentAmount = allDonations
      .filter((d: any) => d.description === goal.name)
      .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
    return { ...goal, current_amount: currentAmount };
  });

  return {
    guildName: guild?.name ?? "Artic Tempest",
    realm: guild?.realm ?? "—",
    region: guild?.region ?? "eu",
    faction: guild?.faction ?? "horde",
    rosterCount: rosterCount ?? 0,
    lastBnetSync: lastSyncedRecord?.synced_at ?? guild?.last_bnet_sync ?? null,
    nextRaid,
    upcomingEvents: upcomingEvents || [],
    myCharacters,
    isBnetLinked,
    myBisSelections,
    recruitmentApplications,
    recentLogs,
    recentDonations,
    donationGoal: donationGoals[0] || null,
    donationGoals,
    sessionUser,
    roleLevel,
    guildSettings: guildSettings || { bizum_number: "", paypal_link: "" },
    blocks: [],
  };
}

async function getDashboardBlocks(roleLevel: string) {
  const { data: blocks } = await supabaseAdmin
    .from("dashboard_blocks")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (!blocks) return [];

  // Parallelize block filtering and permission checks
  const results = await Promise.all(
    blocks.map(async (block) => {
      // 1. Filter by roleLevel (static check)
      if (block.role_levels && block.role_levels.length > 0) {
        if (!block.role_levels.includes(roleLevel)) return null;
      }

      // 2. Filter by App Permission Matrix (async check)
      if (block.app_id) {
        const perm = await getAppPermission(roleLevel, block.app_id);
        if (!perm.canView) return null;
      }

      return block;
    })
  );

  return results.filter((b): b is any => b !== null);
}

import { DashboardTopNav } from "@/shared/layout/dashboard-top-nav";



export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const roleLevel = session.user?.roleLevel?.toLowerCase() ?? "raider";
  const isGuest = roleLevel === "invitado";

  if (isGuest) {
    redirect("/mis-personajes");
  }

  const dashboardData = await getDashboardData(session.user?.id, roleLevel);

  const blocks = await getDashboardBlocks(roleLevel)

  return (
    <div className="flex flex-1 flex-col w-full animate-in fade-in duration-500">
      <DashboardClient
        data={dashboardData}
        blocks={blocks}
        roleLevel={roleLevel}
      />
    </div>
  )
}
