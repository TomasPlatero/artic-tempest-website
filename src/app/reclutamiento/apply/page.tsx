import type { Metadata } from "next";
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { redirect } from "next/navigation";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import { ApplyClient } from "@/domains/recruitment/components/apply-client";
import { IconShieldCheck } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { toSlug } from "@/shared/integrations/bnet/bnet-client";
import { ACTIVE_RECRUITMENT_STATUSES } from "@/domains/recruitment/lib/application-status";
import { getAuthzSnapshot } from "@/shared/auth/authz";

export const metadata: Metadata = {
  title: "Solicitar ingreso | Artic Tempest",
  description: "Formulario para unirte al proceso de reclutamiento de Artic Tempest.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ simulate?: string }>;
}) {
  const [{ simulate }, session] = await Promise.all([
    searchParams,
    auth(),
  ]);

  if (!session) {
    redirect(
      `/login?redirectPath=${encodeURIComponent("/reclutamiento/apply")}`,
    );
  }

  const [
    { data: existingApps },
    { data: bnetCharacters },
    { data: questions },
    { data: classConstants },
  ] = await Promise.all([
    supabaseAdmin
      .from("recruitment_applications")
      .select("id, status, created_at")
      .eq("user_id", session.user.id)
      .in("status", [...ACTIVE_RECRUITMENT_STATUSES])
      .limit(1),
    supabaseAdmin
      .from("bnet_characters")
      .select("id, name, realm, realm_slug, class_id, level, spec")
      .eq("user_id", session.user.id)
      .order("level", { ascending: false }),
    supabaseAdmin
      .from("recruitment_questions")
      .select("*")
      .order("order_index", { ascending: true }),
    supabaseAdmin
      .from("game_constants")
      .select("key, value")
      .eq("category", "wow_class"),
  ]);

  const existingApp =
    existingApps && existingApps.length > 0 ? existingApps[0] : null;

  const authz = await getAuthzSnapshot(session);

  // 4. Verificar si alguno de sus personajes ya está vinculado al roster
  const canSimulate = authz.route.internalAdmin;

  const characterKeys = new Set(
    (bnetCharacters || []).map((character) => {
      const realmSlug =
        character.realm_slug ||
        (typeof character.realm === "string" ? toSlug(character.realm) : "");

      return `${character.name?.trim().toLowerCase()}::${realmSlug.trim().toLowerCase()}`;
    }),
  );

  const characterIds: string[] = [];
  const characterNameSet = new Set<string>();
  for (const character of bnetCharacters || []) {
    if (character.id) {
      characterIds.push(character.id);
    }
    const trimmedName = character.name?.trim();
    if (trimmedName) {
      characterNameSet.add(trimmedName);
    }
  }
  const characterNames = [...characterNameSet];

  const [guildProfileMatch, guildCharacterIdMatch, guildNameMatch] =
    await Promise.all([
      supabaseAdmin
        .from("guild_members")
        .select("id")
        .eq("profile_id", session.user.id)
        .limit(1),
      characterIds.length > 0
        ? supabaseAdmin
            .from("guild_members")
            .select("id")
            .in("bnet_character_id", characterIds)
            .limit(1)
        : Promise.resolve({ data: null }),
      characterNames.length > 0
        ? supabaseAdmin
            .from("guild_members")
            .select("character_name, realm_slug")
            .in("character_name", characterNames)
        : Promise.resolve({ data: null }),
    ]);

  const hasGuildCharacter =
    Boolean(guildProfileMatch.data?.length) ||
    Boolean(guildCharacterIdMatch.data?.length) ||
    Boolean(
      guildNameMatch.data?.some((member) => {
        const key = `${member.character_name?.trim().toLowerCase()}::${member.realm_slug?.trim().toLowerCase()}`;
        return characterKeys.has(key);
      }),
    );

  // Permitir saltar la comprobación solo si tiene permiso para simular Y viene con ?simulate=true
  const isMember = hasGuildCharacter && !(canSimulate && simulate === "true");

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col animate-fade-in animate-duration-slow motion-reduce:animate-none">
      <LandingNavigation />
      <main id="main-content" className="flex-1">
        <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-semibold text-white uppercase tracking-tight">
              Formulario de Aplicación
            </h1>
            <p className="text-white/60 mt-2">
              Completa todos los campos para enviar tu solicitud a los oficiales
              de Artic Tempest.
            </p>
          </div>

          {isMember ? (
            <div className="bg-card/20 border border-white/5 rounded-3xl p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="size-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <IconShieldCheck className="size-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-semibold text-white uppercase tracking-tight mb-4">
                Ya formas parte de nosotros
              </h2>
              <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed mb-10">
                Detectamos que ya tienes un rango activo en Artic Tempest. No es
                necesario que envíes una solicitud de reclutamiento.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/">
                  <Button
                    size="lg"
                    className="rounded-full font-bold px-10 h-14 active:scale-95 "
                  >
                    Volver a la web
                  </Button>
                </Link>
                {canSimulate && (
                  <Link href="/reclutamiento/apply?simulate=true">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full font-bold px-10 h-14 border-white/10 hover:bg-white/5 active:scale-95 "
                    >
                      Simular Apply
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : existingApp ? (
            redirect("/reclutamiento/apply-en-curso")
          ) : (
            <ApplyClient
              user={session.user}
              characters={bnetCharacters || []}
              questions={questions || []}
              classConstants={classConstants || []}
            />
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
