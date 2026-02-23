import { SettingsRolesClient } from "@/components/settings/settings-roles";
import { sb } from "@/infrastructure/auth/auth-options";

export const runtime = "nodejs";

export default async function SettingsRolesPage() {
    const { data: profiles, error } = await sb
        .from("profiles")
        .select("user_id, discord_username, discord_avatar, role_level")
        .order("created_at", { ascending: true }); // We'll sort via client to ensure stable React keys initially

    if (error) {
        console.error("Error fetching profiles:", error);
    }

    const { data: discordRoles } = await sb
        .from("discord_roles")
        .select("role_id, name, level");

    return <SettingsRolesClient initialProfiles={profiles ?? []} initialDiscordRoles={discordRoles ?? []} />;
}
