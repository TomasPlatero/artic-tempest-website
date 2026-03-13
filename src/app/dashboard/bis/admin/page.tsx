import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";

import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { BisAdminClient } from "@/domains/bis/components/bis-admin-client";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { Download } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function BisAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const roleLevel = session.user?.roleLevel ?? "member";
  const { canView } = await getAppPermission(roleLevel, "bis-admin");

  if (!canView) redirect("/dashboard/bis");

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
      <AdminPageHeader
        title="LISTA DE DESEOS"
        description="Panel de oficiales para revisar y exportar las listas de deseo de la hermandad."
        action={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-2 uppercase font-bold tracking-widest text-[10px] border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all active:scale-95"
          >
            <Link href="/dashboard/configuracion/aplicaciones/bis/exportar">
              <Download className="w-3.5 h-3.5" />
              Exportar para Addon
            </Link>
          </Button>
        }
      />
      <BisAdminClient />
    </div>
  );
}
