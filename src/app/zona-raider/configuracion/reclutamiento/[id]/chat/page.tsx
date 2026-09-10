import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { notFound, redirect } from "next/navigation";
import { ApplicationChat } from "@/domains/recruitment/components/application-chat";
import { Button } from "@/shared/ui/button";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import Link from "next/link";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { Forbidden } from "@/shared/components/forbidden";
import { isResolvedRecruitmentStatus } from "@/domains/recruitment/lib/application-status";

export default async function ApplicationChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, getCachedServerSession()]);

  if (!session) {
    redirect("/");
  }

  const authz = await getAuthzSnapshot(session);
  const { canEdit } = await getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? "invitado", "settings-recruitment");
  if (!canEdit) {
    return <Forbidden />;
  }

  const { data: application } = await supabaseAdmin
    .from("recruitment_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) notFound();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-6 lg:p-8 w-full">
      <div className="flex items-center gap-6 mb-6 shrink-0">
        <Link href={`/zona-raider/configuracion/reclutamiento/${id}`}>
          <Button
            variant="outline"
            size="icon"
            aria-label="Volver a la candidatura"
            className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
          >
            <IconArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold font-heading italic tracking-tight uppercase flex items-center gap-3">
            CHAT DE RECLUTAMIENTO
          </h1>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ApplicationChat
          applicationId={id}
          otherPartyName={application.character_name}
          readOnly={isResolvedRecruitmentStatus(application.status)}
        />
      </div>
    </div>
  );
}
