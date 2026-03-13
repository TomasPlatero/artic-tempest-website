import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { CooldownSettingsPanel } from "@/domains/cd-planner/components/cooldown-settings-panel";
import { getServerSession } from "next-auth";

import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function PlanificadorCdsSettingsPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "planificador-cds");

  if (!canEdit) {
    return <Forbidden />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/aplicaciones">
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
            PLANIFICADOR DE CD&apos;S
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
            Gestiona las habilidades y cooldowns disponibles en el planificador
            de raid.
          </p>
        </div>
      </div>
      <CooldownSettingsPanel />
    </div>
  );
}
