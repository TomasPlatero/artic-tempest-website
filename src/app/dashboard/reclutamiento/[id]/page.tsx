import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { redirect, notFound } from "next/navigation";
import { RecruitmentDetailClient } from "@/domains/recruitment/components/recruitment-detail-client";
import React from "react";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function RecruitmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const { canEdit } = await getAppPermission(
    session.user.roleLevel ?? "invitado",
    "recruitment",
  );
  if (!canEdit) {
    return <Forbidden />;
  }

  const { id } = params;

  // Fetch application details
  const { data: application } = await supabaseAdmin
    .from("recruitment_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) notFound();

  // Fetch answers and questions
  const { data: answers } = await supabaseAdmin
    .from("application_answers")
    .select(
      `
            answer_text,
            recruitment_questions (
                label,
                order_index
            )
        `,
    )
    .eq("application_id", id);

  // Fetch class constants
  const { data: classConstants } = await supabaseAdmin
    .from("game_constants")
    .select("key, value, metadata")
    .eq("category", "wow_class");


  return (
    <div className="flex flex-1 flex-col py-6 gap-6 px-4 lg:px-6 w-full">
      <RecruitmentDetailClient
        application={application}
        answers={answers || []}
        classConstants={classConstants || []}
      />
    </div>
  );
}
