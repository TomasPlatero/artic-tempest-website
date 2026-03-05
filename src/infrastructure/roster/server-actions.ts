import { supabaseAdmin } from "@/infrastructure/auth/auth-options";
import { revalidatePath } from "next/cache";
import { ensureAppPermission } from "@/infrastructure/auth/permissions";

export async function updateMemberRole(memberId: string, role: string) {
    await ensureAppPermission('roster', 'edit');
    const { error } = await supabaseAdmin.from('guild_members')
        .update({ role: role.toLowerCase() })
        .eq('id', memberId);

    if (error) throw error;
    revalidatePath("/dashboard/roster");
}

export async function updateMemberRank(memberId: string, rank: string | number) {
    await ensureAppPermission('roster', 'edit');
    const { error } = await supabaseAdmin.from('guild_members')
        .update({ rank: Number(rank) })
        .eq('id', memberId);

    if (error) throw error;
    revalidatePath("/dashboard/roster");
}

export async function updateMemberNote(memberId: string, note: string) {
    await ensureAppPermission('roster', 'edit');
    const { error } = await supabaseAdmin.from('guild_members')
        .update({ note: note.trim() })
        .eq('id', memberId);

    if (error) throw error;
    revalidatePath("/dashboard/roster");
}

export async function deleteMember(memberId: string) {
    await ensureAppPermission('roster', 'edit');
    const { error } = await supabaseAdmin.from('guild_members')
        .delete()
        .eq('id', memberId);

    if (error) throw error;
    revalidatePath("/dashboard/roster");
}
