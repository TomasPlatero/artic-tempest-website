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
  const recruitmentPermission = await getAppPermission(
    roleLevel,
    "settings-recruitment",
  );
  const canReviewRecruitment = recruitmentPermission.canView;

  // Get guild metrics base - We try to select everything but handle fails gracefully
  const { data: guild, error: guildError } = await supabaseAdmin
    .from("guilds_managed")
    .select(
      "name, region, realm, faction, last_bnet_sync, wcl_client_id, wcl_client_secret",
    )
    .maybeSingle();

  if (guildError) {
    console.error(
      "Dashboard: Error fetching guild data (this is likely a missing column last_bnet_sync):",
      {
        code: (guildError as any).code,
        message: (guildError as any).message,
        details: (guildError as any).details,
      },
    );
  }

  const { count: rosterCount } = await supabaseAdmin
    .from("guild_members")
    .select("*", { count: "exact", head: true });

  const { data: upcomingEvents } = await supabaseAdmin
    .from("guild_events")
    .select("id, title, destination, event_date")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(5);

  // Just picking the absolute next one
  const nextRaid = upcomingEvents?.[0] || null;

  // User specific data
  let myCharacters: BnetCharacter[] = [];
  let isBnetLinked = false;
  let myBisSelections: any[] = [];
  let recruitmentApplications: any[] = [];
  let recentLogs: any[] = [];
  let recentDonations: any[] = [];
  let donationGoal: any = null;
  let donationGoals: any[] = [];
  let sessionUser: any = null;

  if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id, battlenet_battletag")
        .eq("user_id", userId)
        .single();
  
      isBnetLinked = !!profile?.battlenet_battletag;
      sessionUser = profile;

    if (isBnetLinked) {
      const { data: chars } = await supabaseAdmin
        .from("bnet_characters")
        .select("id, name, realm, realm_slug, class_id, level")
        .eq("user_id", userId)
        .order("level", { ascending: false });
      myCharacters = (chars || []).slice(0, 5);

      // Fetch BiS selections by linking character names/realms to guild_members
      if (chars && chars.length > 0) {
        // Find if any of our bnet characters are in the guild roster
        const names = chars.map((c) => c.name);
        const realms = chars.map((c) => c.realm_slug);

        const { data: members } = await supabaseAdmin
          .from("guild_members")
          .select("id, profile_id")
          .in("character_name", names)
          .in("realm_slug", realms);

        if (members && members.length > 0) {
          const memberIds = members.map((m) => m.id);

          // Fetch BiS selections for all characters found in the guild
          const { data: bis } = await supabaseAdmin
            .from("bis_selections")
            .select("item_name, item_icon, slot, boss_name, ilvl")
            .in("member_id", memberIds)
            .order("created_at", { ascending: false })
            .limit(5);
          myBisSelections = bis || [];

          // Proactive sync: If the member doesn't have a profile_id, link it now
          for (const m of members) {
            if (!m.profile_id) {
              await supabaseAdmin
                .from("guild_members")
                .update({ profile_id: userId })
                .eq("id", m.id);
            }
          }
        }
      }
    }
  }

  // Fetch Recruitment Applications for Officers
  if (canReviewRecruitment) {
    const { data: apps, count: pendingCount } = await supabaseAdmin
      .from("recruitment_applications")
      .select(
        "character_name, character_spec, character_class, created_at, status",
        { count: "exact" },
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(3);
    recruitmentApplications = apps || [];
    // Add the pending count to recruitment data
    (recruitmentApplications as any).pendingCount = pendingCount || 0;
  }

  // Fetch WarcraftLogs (Recent Reports)
  if (guild?.wcl_client_id && guild?.wcl_client_secret) {
    try {
      const authString = Buffer.from(
        `${guild.wcl_client_id}:${guild.wcl_client_secret}`,
      ).toString("base64");
      const tokenRes = await fetch("https://www.warcraftlogs.com/oauth/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        next: { revalidate: 3600 },
      });

      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json();
        const query = `
          query {
            reportData {
              reports(guildID: 743623, limit: 5) {
                data {
                  code
                  title
                  startTime
                  zone { name }
                }
              }
            }
          }`;

        const gqlRes = await fetch(
          "https://www.warcraftlogs.com/api/v2/client",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
            next: { revalidate: 300 },
          },
        );

        if (gqlRes.ok) {
          const wclData = await gqlRes.json();
          recentLogs = wclData.data?.reportData?.reports?.data || [];
        }
      }
    } catch (e) {
      console.error("Dashboard: Error fetching WCL logs:", e);
    }
  }
  
  // Fetch Recent Donations
  const { data: donations } = await supabaseAdmin
    .from("guild_donations")
    .select("character_name, amount, description, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  recentDonations = donations || [];

  // Fetch Active Donation Goals and their current amounts
  const { data: activeGoals } = await supabaseAdmin
    .from("guild_goals")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  
  const goalsWithAmounts = [];
  if (activeGoals && activeGoals.length > 0) {
    for (const goal of activeGoals) {
      const { data: goalDonations } = await supabaseAdmin
        .from("guild_donations")
        .select("amount")
        .eq("description", goal.name) // Linking by goal name as it's used in description
        .gte("created_at", goal.created_at);
      
      const currentAmount = goalDonations?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      goalsWithAmounts.push({ ...goal, current_amount: currentAmount });
    }
  }
  
  donationGoals = goalsWithAmounts;
  donationGoal = donationGoals[0] || null;

  // Fetch true last sync from members table
  const { data: lastSyncedRecord } = await supabaseAdmin
    .from("guild_members")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch guild settings (Bizum, PayPal)
  const { data: guildSettings } = await supabaseAdmin
    .from("guilds_managed")
    .select("bizum_number, paypal_link")
    .limit(1)
    .maybeSingle();

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
    donationGoal,
    donationGoals,
    sessionUser,
    roleLevel,
    guildSettings: guildSettings || { bizum_number: "", paypal_link: "" },
    blocks: [], // Placeholder, will fetch below
  };
}

async function getDashboardBlocks(roleLevel: string) {
  const { data: blocks } = await supabaseAdmin
    .from("dashboard_blocks")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (!blocks) return [];

  const filtered = [];
  for (const block of blocks) {
    // 1. Filter by roleLevel
    if (block.role_levels && block.role_levels.length > 0) {
      if (!block.role_levels.includes(roleLevel)) continue;
    }

    // 2. Filter by App Permission Matrix
    if (block.app_id) {
      const perm = await getAppPermission(roleLevel, block.app_id);
      if (!perm.canView) continue;
    }

    filtered.push(block);
  }

  return filtered;
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
