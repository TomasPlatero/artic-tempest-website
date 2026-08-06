import { Metadata } from "next";
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { redirect } from "next/navigation";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { AccountClient } from "@/domains/account/components/account-client";
import { cookies } from "next/headers";

const pageTitle = "Mis Personajes | Artic Tempest";
const pageDescription =
  "Gestiona tus personajes de World of Warcraft vinculados a Artic Tempest mediante Battle.net.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: pageTitle,
    description: pageDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: { canonical: "/mis-personajes" },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: "website",
      url: "https://artictempest.es/mis-personajes",
      siteName: "Artic Tempest",
      images: ["/assets/images/artic-tempest-og.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: ["/assets/images/artic-tempest-og.webp"],
    },
  };
}

const MAIN_CHARACTER_COOKIE = "artic-tempest-main-character-id";

export default async function MisPersonajesPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [searchParams, session] = await Promise.all([
    props.searchParams,
    auth(),
  ]);

  if (!session) {
    redirect("/");
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
    <div className="min-h-dvh bg-zinc-950 animate-fade-in animate-duration-slow motion-reduce:animate-none">
      <LandingNavigation />
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-semibold text-white uppercase tracking-tight">
            Mis Personajes
          </h1>
          <p className="text-white/50 mt-2">
            Gestiona tu vinculación con Battle.net y sincroniza tus personajes.
          </p>
        </div>

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

        <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
          <AccountClient
            battletag={profile?.battlenet_battletag || null}
            isBnetLinked={Boolean(
              profile?.battlenet_id || profile?.battlenet_battletag,
            )}
            characters={characters || []}
            mainCharacterId={
              profile?.main_character_id || cookieMainCharacterId
            }
            returnTo="/mis-personajes"
          />
        </div>
      </div>
    </div>
  );
}
