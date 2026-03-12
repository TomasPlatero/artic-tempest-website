import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";
import { redirect } from "next/navigation";
import { SettingsDiscordClient } from "@/domains/settings/components/settings-discord";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function DiscordSettingsPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings-discord");

  if (!session) {
    redirect("/");
  }

  if (!canEdit) {
    return <Forbidden />;
  }

  const credentials = await getGuildCredentials();

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: commands } = await sb
    .from("discord_commands")
    .select("*")
    .order("name");

  return (
    <SettingsDiscordClient
      initialCredentials={credentials}
      initialCommands={commands || []}
    />
  );
}
