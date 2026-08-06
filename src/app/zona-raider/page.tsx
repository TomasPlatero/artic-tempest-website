import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { fetchCharacterRIO } from "@/shared/integrations/raiderio/raiderio-client";
import { getRaidProgression } from "@/domains/landing/lib/progression";
import { getGuildCredentials } from "@/shared/auth/credentials";
import {
  DISCORD_RAIDER_ANNOUNCEMENTS_CHANNEL_ID,
  getDiscordChannelMessages,
} from "@/shared/discord/channel-messages";
import { cookies } from "next/headers";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";

export const metadata: Metadata = {
  title: "Zona Raider | Artic Tempest",
  description: "Hub central de la Zona Raider de Artic Tempest.",
  robots: { index: false, follow: false },
};

import { ZonaRaiderClient } from "@/domains/zona-raider/raider-hub/zona-raider-client";
import type {
  ZonaRaiderCharacter,
  ZonaRaiderData,
  ZonaRaiderLog,
} from "@/domains/zona-raider/raider-hub/zona-raider.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAIN_CHARACTER_COOKIE = "artic-tempest-main-character-id";

async function getZonaRaiderData(
  userId: string,
  userName: string | null,
  roleLevel: string,
): Promise<ZonaRaiderData> {
  const recruitmentPermissionPromise = getAppPermission(
    roleLevel,
    "settings-recruitment",
  );

  const [
    recruitmentPermission,
    guildRes,
    bnetRes,
    wclRes,
    rosterCountRes,
    lastSyncedRes,
    profileRes,
    raidProgression,
    discordMessagesRes,
    guildCredsRes,
  ] = await Promise.all([
    recruitmentPermissionPromise,
    supabaseAdmin
      .from("settings")
      .select(
        "name, region, realm, faction",
      )
      .eq("id", 1)
      .maybeSingle() as any,
    supabaseAdmin
      .from("app_battlenet")
      .select("last_bnet_sync")
      .eq("id", 1)
      .maybeSingle() as any,
    supabaseAdmin
      .from("app_wcl")
      .select("wcl_client_id, wcl_client_secret")
      .eq("id", 1)
      .maybeSingle() as any,
    supabaseAdmin
      .from("guild_members")
      .select("*", { count: "exact", head: true }) as any,
    supabaseAdmin
      .from("guild_members")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle() as any,
    supabaseAdmin
      .from("profiles")
      .select("user_id, battlenet_battletag, battlenet_id, main_character_id")
      .eq("user_id", userId)
      .maybeSingle() as any,
    getRaidProgression(),
    getDiscordChannelMessages(DISCORD_RAIDER_ANNOUNCEMENTS_CHANNEL_ID, 50),
    getGuildCredentials(),
  ]);

  const guild = guildRes.data;
  const bnetSettings = bnetRes.data;
  const wclSettings = wclRes.data;
  const rosterCount = rosterCountRes.count ?? 0;
  const profile = profileRes.data;
  const cookieStore = await cookies();
  const cookieMainCharacterId =
    cookieStore.get(MAIN_CHARACTER_COOKIE)?.value ?? null;

  const charactersQuery = supabaseAdmin
    .from("bnet_characters")
    .select("*")
    .eq("user_id", userId)
    .order("level", { ascending: false })
    .order("name", { ascending: true }) as any;

  const charactersRes = await charactersQuery;

  if (charactersRes.error) {
    console.error(
      "[DASHBOARD] Error loading bnet_characters:",
      charactersRes.error,
    );
  }

  const myCharacters = ((charactersRes.data ?? []) as any[]).map(
    (character): ZonaRaiderCharacter => ({
      id: character.id,
      name: character.name,
      realm: character.realm,
      realm_slug: character.realm_slug ?? null,
      class_id: character.class_id,
      level: character.level,
      spec: character.spec ?? character.spec_name ?? null,
      item_level:
        typeof character.item_level === "number" ? character.item_level : null,
      thumbnail_url: character.thumbnail_url ?? null,
    }),
  );
  const preferredMainCharacterId =
    profile?.main_character_id || cookieMainCharacterId || null;
  const mainCharacter =
    myCharacters.find(
      (character) => character.id === preferredMainCharacterId,
    ) ??
    myCharacters.find(
      (character) => character.id === profile?.main_character_id,
    ) ??
    null;
  const activeCharacter = mainCharacter ?? myCharacters[0] ?? null;

  const activeCharacterRio =
    activeCharacter && guild
      ? await fetchCharacterRIO(
          activeCharacter.name,
          activeCharacter.realm_slug || activeCharacter.realm,
          guild.region?.toLowerCase() ?? "eu",
        )
      : null;

  const activeCharacterScore =
    activeCharacterRio?.mythic_plus_scores_by_season?.[0]?.scores?.all ?? null;
  const activeCharacterSpec =
    activeCharacterRio?.active_spec_name || activeCharacter?.spec || null;
  const activeCharacterRaidProgress = (() => {
    const entries = Object.entries(activeCharacterRio?.raid_progression ?? {});
    if (!entries.length) return null;

    const selectedEntry =
      entries.find(([key]) => key.includes("tier-mn") || key === "current") ??
      entries.find(([, value]: any) => typeof value?.summary === "string") ??
      entries[0];

    const summary = (selectedEntry?.[1] as any)?.summary;
    return typeof summary === "string" && summary.trim() ? summary : null;
  })();
  const activeCharacterRioUrl = activeCharacter
    ? `https://raider.io/characters/${guild?.region?.toLowerCase() ?? "eu"}/${activeCharacter.realm_slug ?? activeCharacter.realm.toLowerCase().replace(/\s+/g, "-")}/${encodeURIComponent(activeCharacter.name)}`
    : null;

  const recentLogs: ZonaRaiderLog[] = [];
  if (wclSettings?.wcl_client_id && wclSettings?.wcl_client_secret) {
    try {
      const authString = Buffer.from(
        `${wclSettings.wcl_client_id}:${wclSettings.wcl_client_secret}`,
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
        const tokenData = await tokenRes.json();

        const gqlRes = await fetch(
          "https://www.warcraftlogs.com/api/v2/client",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
                query {
                  reportData {
                    reports(guildID: 743623, limit: 6) {
                      data {
                        code
                        title
                        startTime
                        zone { name }
                      }
                    }
                  }
                }
              `,
            }),
            next: { revalidate: 0 },
          },
        );

        if (gqlRes.ok) {
          const reportsData = await gqlRes.json();
          const logs = reportsData?.data?.reportData?.reports?.data ?? [];

          recentLogs.push(
            ...logs.map((log: any) => ({
              code: log.code,
              title: log.title,
              startTime: log.startTime,
              zone: log.zone ?? null,
            })),
          );
        }
      }
    } catch (error) {
      console.error("[DASHBOARD] Error loading WCL reports:", error);
    }
  }

  const recruitmentApplicationsRes = recruitmentPermission.canView
    ? ((await supabaseAdmin
        .from("recruitment_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")) as any)
    : { count: 0 };

  const raidProgress = raidProgression?.[0]?.progress ?? "0/0";

  return {
    guildName: guild?.name ?? "Artic Tempest",
    userName: userName ?? profile?.battlenet_battletag ?? "Raider",
    roleLevel,
    myCharacters,
    mainCharacter,
    activeCharacter,
    activeCharacterScore,
    activeCharacterSpec,
    activeCharacterRaidProgress,
    activeCharacterRioUrl,
    recentLogs,
    rosterCount,
    raidProgress,
    canReviewRecruitment: recruitmentPermission.canView,
    recruitmentPendingCount: recruitmentApplicationsRes.count ?? 0,
    lastBnetSync:
      bnetSettings?.last_bnet_sync ?? lastSyncedRes.data?.synced_at ?? null,
    isBnetLinked: Boolean(
      profile?.battlenet_id || profile?.battlenet_battletag,
    ),
    discordMessages: discordMessagesRes,
    discordGuildId: guildCredsRes.discord_guild_id || null,
    discordChannelId: DISCORD_RAIDER_ANNOUNCEMENTS_CHANNEL_ID,
  };
}

export default async function ZonaRaiderPage() {
  const session = await getCachedServerSession();

  if (!session) redirect("/");

  const authz = await getAuthzSnapshot(session);
  const roleLevel = (authz.roleSlug ?? session.user?.roleLevel ?? "raider").toLowerCase();
  if (roleLevel === "invitado") redirect("/mis-personajes");

  const zonaRaiderData = await getZonaRaiderData(
    session.user.id,
    session.user.username ?? session.user.email ?? null,
    roleLevel,
  );

  return (
    <div className={`flex w-full flex-1 flex-col ${RAIDER_PAGE_FADE_IN_CLASSES}`}>
      <ZonaRaiderClient data={zonaRaiderData} />
    </div>
  );
}
