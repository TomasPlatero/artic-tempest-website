import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { notFound, redirect } from "next/navigation";
import { RecruitmentDetailClient } from "@/domains/recruitment/components/recruitment-detail-client";
import { Button } from "@/shared/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { fetchCharacterRIO } from "@/shared/integrations/raiderio/raiderio-client";
import {
  fetchCharacterItemLevel,
  toSlug,
} from "@/shared/integrations/bnet/bnet-client";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const { canEdit } = await getAppPermission(
    session.user.roleLevel ?? "invitado",
    "settings-recruitment",
  );
  if (!canEdit) {
    return <Forbidden />;
  }

  // Fetch the application
  const { data: application } = await supabaseAdmin
    .from("recruitment_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) notFound();

  // Fetch answers
  const { data: answers } = await supabaseAdmin
    .from("application_answers")
    .select("*, recruitment_questions(*)")
    .eq("application_id", id);

  // Fetch class constants
  const { data: classConstants } = await supabaseAdmin
    .from("game_constants")
    .select("*")
    .eq("category", "wow_class");

  // Fetch Raider.io data on the server to avoid CORS
  const charName = application.character_name.trim();
  const charRealm = application.character_realm.trim();

  console.log(`[Server] Fetching RIO for ${charName} - ${charRealm}`);
  const rioData = await fetchCharacterRIO(charName, charRealm);
  console.log(
    `[Server] RIO Data ${rioData ? "FOUND" : "NOT FOUND (404/Error)"}`,
  );

  console.log(`[Server] Fetching BNET iLvl for ${charName} - ${charRealm}`);
  const bnetData = await fetchCharacterItemLevel(
    toSlug(charRealm),
    toSlug(charName),
  );
  console.log(`[Server] BNET Data ${bnetData ? "FOUND" : "NOT FOUND"}`);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/configuracion/reclutamiento?tab=inbox">
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl"
          >
            <IconArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black font-heading italic tracking-tight uppercase flex items-center gap-3">
            DETALLE DE SOLICITUD
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest">
            Revisa la información del aplicante y gestiona su estado.
          </p>
        </div>
      </div>

      <RecruitmentDetailClient
        application={application}
        answers={answers || []}
        classConstants={classConstants || []}
        initialRioData={rioData}
        initialBnetData={bnetData}
      />
    </div>
  );
}
