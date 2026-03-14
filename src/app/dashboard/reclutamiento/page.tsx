import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { redirect } from "next/navigation";
import { getAppPermission } from "@/shared/auth/permissions";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { RecruitmentListClient } from "@/domains/recruitment/components/recruitment-list-client";
import React from "react";

export default async function RecruitmentListPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const roleLevel = session.user?.roleLevel ?? "member";
  const { canView } = await getAppPermission(roleLevel, "recruitment");

  if (!canView) {
    redirect("/dashboard");
  }

  // Fetch applications
  const { data: applications } = await supabaseAdmin
    .from("recruitment_applications")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch class constants for mapping
  const { data: classConstants } = await supabaseAdmin
    .from("game_constants")
    .select("key, value, metadata")
    .eq("category", "wow_class");


  return (
    <div className="flex flex-1 flex-col py-6 gap-6 px-4 lg:px-6 w-full">
      <AdminPageHeader
        title="GESTION DE RECLUTAMIENTO"
        description="Revisa y gestiona las solicitudes de ingreso a la hermandad."
      />

      <RecruitmentListClient
        initialApplications={applications || []}
        classConstants={classConstants || []}
      />
    </div>
  );
}
