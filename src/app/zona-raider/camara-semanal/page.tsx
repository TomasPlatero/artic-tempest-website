import { cookies } from "next/headers";
import type { Metadata } from "next";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { WeeklyVaultUploader } from "./components/weekly-vault-uploader";
import { redirect } from "next/navigation";
import React from "react";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";

export const metadata: Metadata = {
  title: "Cámara Semanal | Zona Raider",
  description: "Sube las capturas de tu Cámara Semanal de WoW en Artic Tempest.",
  robots: { index: false, follow: false },
};

const MAIN_CHARACTER_COOKIE = "artic-tempest-main-character-id";

export default async function WeeklyVaultPage() {
  const session = await ensureAppPermission("weekly-vault", "view").catch(
    () => null,
  );
  if (!session) redirect("/zona-raider");

  const cookieStore = await cookies();
  const cookieMainCharacterId =
    cookieStore.get(MAIN_CHARACTER_COOKIE)?.value ?? null;

  const [
    { data: characters, error: charsError },
    { data: guildData },
    { data: uploads },
    { data: guildMember },
    { data: profile },
  ] = await Promise.all([
    supabaseAdmin
      .from("bnet_characters")
      .select("id, name, realm_slug, char_class:class_id")
      .eq("user_id", session.user.id)
      .order("name", { ascending: true }),
    supabaseAdmin.from("settings").select("guild_id").eq("id", 1).maybeSingle(),
    supabaseAdmin
      .from("weekly_vault_screenshots")
      .select(
        `
      id, created_at, week_start, image_url,
      bnet_characters(name, class_id)
    `,
      )
      .eq("profile_id", session.user.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("guild_members")
      .select("bnet_character_id")
      .eq("profile_id", session.user.id)
      .order("rank", { ascending: true })
      .limit(1)
      .single(),
    supabaseAdmin
      .from("profiles")
      .select("main_character_id")
      .eq("user_id", session.user.id)
      .maybeSingle(),
  ]);

  if (charsError) console.error("Error fetching characters:", charsError);

  const guildId = guildData?.guild_id;

  const resolvedMainCharacterId =
    profile?.main_character_id || cookieMainCharacterId || null;

  const rosteredCharacterId = guildMember?.bnet_character_id;
  const activeCharacterId =
    resolvedMainCharacterId || rosteredCharacterId || undefined;

  return (
    <div
      className={`flex w-full flex-1 flex-col gap-6 p-4 md:p-6 ${RAIDER_PAGE_FADE_IN_CLASSES}`}
      data-tour-step="weekly-vault-page"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cámara Semanal
        </h1>
        <p className="text-muted-foreground mt-2">
          Sube una captura de tu Gran Cámara (Vault) para ayudar a los ofis a
          repartir el loot.
        </p>
      </div>
      <div className="max-w-4xl">
        <WeeklyVaultUploader
          characters={characters || []}
          guildId={guildId}
          uploads={uploads || []}
          activeCharacterId={activeCharacterId}
          mainCharacterId={resolvedMainCharacterId ?? undefined}
        />
      </div>
    </div>
  );
}
