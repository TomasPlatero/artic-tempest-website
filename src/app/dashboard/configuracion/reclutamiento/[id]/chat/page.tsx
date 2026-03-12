import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { notFound, redirect } from "next/navigation";
import { ApplicationChat } from "@/domains/recruitment/components/application-chat";
import { Button } from "@/shared/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function ApplicationChatPage({
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

  const { data: application } = await supabaseAdmin
    .from("recruitment_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) notFound();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-6 lg:p-8 w-full">
      <div className="flex items-center gap-6 mb-6 shrink-0">
        <Link href={`/dashboard/configuracion/reclutamiento/${id}`}>
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
            CHAT DE RECLUTAMIENTO
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
            Coordina con{" "}
            <span className="text-blue-400 font-bold">
              {application.character_name}
            </span>{" "}
            los detalles de su ingreso.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ApplicationChat
          applicationId={id}
          otherPartyName={application.character_name}
        />
      </div>
    </div>
  );
}
