import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { redirect } from "next/navigation";
import { ScheduleFormClient } from "@/domains/calendar/components/schedule-form-client";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import React from "react";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export const dynamic = "force-dynamic";

export default async function CalendarSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const roleLevel = session.user?.roleLevel;
  const { canEdit } = await getAppPermission(
    roleLevel ?? "invitado",
    "calendar",
  );
  if (!canEdit) {
    return <Forbidden />;
  }

  // Fetch current schedule and raids from constants
  const { data: guildData } = await supabaseAdmin
    .from("guilds_managed")
    .select("guild_id")
    .limit(1)
    .single();

  const { data: constantRows } = await supabaseAdmin
    .from("game_constants")
    .select("key, value, metadata")
    .eq("category", "wow_raid");

  const raids =
    constantRows?.map((c) => ({
      id: c.key,
      name: c.value,
      background: c.metadata?.background,
      bosses: c.metadata?.bosses || [],
    })) || [];

  let initialSchedule: any[] = [];
  if (guildData) {
    const { data } = await supabaseAdmin
      .from("guild_raid_schedule")
      .select("*")
      .eq("guild_id", guildData.guild_id)
      .order("day_of_week", { ascending: true });
    if (data) initialSchedule = data;
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-4">
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
            AJUSTES DE CALENDARIO
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
            Configura los días y horas de raids recurrentes de la hermandad.
          </p>
        </div>
      </div>

      <div className="w-full max-w-full">
        <ScheduleFormClient initialSchedule={initialSchedule} raids={raids} />
      </div>
    </div>
  );
}
