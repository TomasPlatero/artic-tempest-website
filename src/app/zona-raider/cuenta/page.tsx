import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AccountClient } from "@/domains/account/components/account-client";
import { cookies } from "next/headers";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";
import { getAuthzSnapshot } from "@/shared/auth/authz";

export const metadata: Metadata = {
  title: "Mi Cuenta | Zona Raider",
  description: "Gestiona tu cuenta y personajes en la Zona Raider de Artic Tempest.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
const MAIN_CHARACTER_COOKIE = "artic-tempest-main-character-id";

export default async function CuentaPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [searchParams, session] = await Promise.all([
    props.searchParams,
    getCachedServerSession(),
  ]);
  if (!session) {
    redirect("/");
  }

  const authz = await getAuthzSnapshot(session);
  if ((authz.roleSlug ?? session.user?.roleLevel)?.toLowerCase() === "invitado") {
    redirect("/mis-personajes");
  }

  const cookieStore = await cookies();
  const cookieMainCharacterId =
    cookieStore.get(MAIN_CHARACTER_COOKIE)?.value ?? null;

  const [{ data: profile }, { data: characters }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("battlenet_battletag, battlenet_id, main_character_id")
      .eq("user_id", session.user.id)
      .single(),
    supabaseAdmin
      .from("bnet_characters")
      .select("*")
      .eq("user_id", session.user.id)
      .order("level", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  return (
    <div
      className={`relative z-10 flex w-full flex-col gap-2 px-4 py-6 lg:px-6 ${RAIDER_PAGE_FADE_IN_CLASSES}`}
      data-tour-step="account-page"
    >
      {searchParams.error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-4 mb-4 text-sm font-medium">
          {searchParams.error === "auth_failed" &&
            "El inicio de sesión de Battle.net fue cancelado o falló."}
          {searchParams.error === "token_exchange" &&
            "No pudimos intercambiar tus credenciales en los servidores de Blizzard."}
          {searchParams.error === "invalid_state" &&
            "Sesión caducada por seguridad. Inténtalo de nuevo."}
          {searchParams.error === "unknown" &&
            "Ha ocurrido un error inesperado al vincular tu cuenta de WoW."}
        </div>
      )}
      {searchParams.success === "linked" && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 rounded-md p-4 mb-4 text-sm font-medium">
          ¡Cuenta de Battle.net vinculada correctamente y personajes
          actualizados!
        </div>
      )}

      <AccountClient
        battletag={profile?.battlenet_battletag || null}
        isBnetLinked={Boolean(
          profile?.battlenet_id || profile?.battlenet_battletag,
        )}
        characters={characters || []}
        mainCharacterId={profile?.main_character_id || cookieMainCharacterId}
        returnTo="/zona-raider/cuenta"
      />
    </div>
  );
}
