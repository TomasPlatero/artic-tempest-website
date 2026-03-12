// src/app/dashboard/configuracion/cuentas/page.tsx
import { supabaseAdmin } from "@/shared/auth/auth-options";
import { AccountsClient } from "@/domains/settings/components/accounts-client";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { getServerSession } from "next-auth";

import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export const dynamic = "force-dynamic";

export default async function AccountsSettingsPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings-accounts");

  if (!canEdit) {
    return <Forbidden />;
  }

  // Fetch all profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("discord_username", { ascending: true });

  // Fetch character counts per user
  const { data: charCounts } = await supabaseAdmin
    .from("bnet_characters")
    .select("user_id");

  const countMap: Record<string, number> = {};
  charCounts?.forEach((c) => {
    countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
  });

  const profilesWithCounts =
    profiles?.map((p) => ({
      ...p,
      character_count: countMap[p.user_id] || 0,
    })) || [];

  return (
    <div className="flex flex-col gap-6 p-6 lg:px-8 w-full max-w-full">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/configuracion">
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
            GESTIÓN DE CUENTAS
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
            Control de identidades, vinculación de APIs y salud de tokens OAuth.
          </p>
        </div>
      </div>

      <AccountsClient initialProfiles={profilesWithCounts} />
    </div>
  );
}
