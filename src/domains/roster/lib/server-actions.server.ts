"use server";

import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { revalidatePath } from "next/cache";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { fetchAppRoles } from "@/shared/auth/roles";
import {
  deleteWowauditCharacter,
  findWowauditCharacter,
  toWowauditRole,
  updateWowauditCharacter,
} from "@/shared/integrations/wowaudit/wowaudit-client";
import {
  getWowauditRankName,
} from "@/shared/integrations/wowaudit/wowaudit-ranks";
import { fetchWowauditRanks } from "@/shared/integrations/wowaudit/wowaudit-ranks.server";

const MAX_NOTE_LENGTH = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateMemberId(memberId: string) {
  if (!memberId || !UUID_RE.test(memberId)) {
    throw new Error("Invalid member ID format");
  }
}

async function getValidRoles(): Promise<Set<string>> {
  const roles = await fetchAppRoles();
  return new Set(roles.map((r) => r.level));
}

async function getRosterMember(memberId: string) {
  const { data } = await supabaseAdmin
    .from('guild_members')
    .select('id, wowaudit_character_id, wowaudit_rank_name, character_name, realm_slug, rank, role, note')
    .eq('id', memberId)
    .maybeSingle();

  return data;
}

async function resolveWowauditCharacterId(member: {
  wowaudit_character_id?: string | number | null;
  wowaudit_rank_name?: string | null;
  character_name: string;
  realm_slug: string;
}) {
  if (member.wowaudit_character_id != null) {
    return member.wowaudit_character_id;
  }

  const found = await findWowauditCharacter(member.character_name, member.realm_slug);
  if (!found) {
    throw new Error('No se pudo resolver el ID del personaje en WoWAudit');
  }

  return found.id;
}

async function syncWowauditMemberUpdate(memberId: string, patch: {
  role?: string;
  rank?: string | number;
  note?: string | null;
}, wowauditRanks?: Awaited<ReturnType<typeof fetchWowauditRanks>>) {
  const member = await getRosterMember(memberId);
  if (!member) {
    throw new Error('Member not found');
  }

  const wowauditId = await resolveWowauditCharacterId(member);
  const resolvedRanks = wowauditRanks ?? await fetchWowauditRanks();
  const payload = {
    role: toWowauditRole(patch.role ?? member.role ?? undefined),
    rank: getWowauditRankName(
      patch.rank !== undefined ? Number(patch.rank) : Number(member.rank),
      resolvedRanks,
    ),
    note: patch.note !== undefined ? patch.note : member.note,
  };

  await updateWowauditCharacter(wowauditId, payload);
}

export async function updateMemberRole(memberId: string, role: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const authz = await getAuthzSnapshot(session);
    const permissions = await getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? '', 'roster');
    if (!permissions.canEdit) throw new Error('Unauthorized: Role cannot edit roster');

    validateMemberId(memberId);

    if (!role || typeof role !== 'string') {
      throw new Error("Role is required");
    }

    const validRoles = await getValidRoles();
    const normalizedRole = role.toLowerCase();
    if (!validRoles.has(normalizedRole)) {
      throw new Error(`Invalid role. Allowed: ${[...validRoles].join(', ')}`);
    }

    await syncWowauditMemberUpdate(memberId, { role: normalizedRole });

    const { error } = await supabaseAdmin.from('guild_members')
        .update({ role: normalizedRole })
        .eq('id', memberId);

    if (error) throw new Error("Error interno del servidor");
    revalidatePath("/zona-raider/roster");
}

export async function updateMemberRank(memberId: string, rank: string | number) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const authz = await getAuthzSnapshot(session);
    const permissions = await getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? '', 'roster');
    if (!permissions.canEdit) throw new Error('Unauthorized: Role cannot edit roster');

    validateMemberId(memberId);

    const numRank = Number(rank);
    if (Number.isNaN(numRank) || numRank < 0 || numRank > 99 || !Number.isInteger(numRank)) {
      throw new Error("Invalid rank value");
    }

    const wowauditRanks = await fetchWowauditRanks();
    await syncWowauditMemberUpdate(memberId, { rank: numRank }, wowauditRanks);

    const { error } = await supabaseAdmin.from('guild_members')
        .update({ rank: numRank, wowaudit_rank_name: getWowauditRankName(numRank, wowauditRanks) })
        .eq('id', memberId);

    if (error) throw new Error("Error interno del servidor");
    revalidatePath("/zona-raider/roster");
}

export async function updateMemberNote(memberId: string, note: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const authz = await getAuthzSnapshot(session);
    const permissions = await getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? '', 'roster');
    if (!permissions.canEdit) throw new Error('Unauthorized: Role cannot edit roster');

    validateMemberId(memberId);

    if (typeof note !== 'string') {
      throw new Error("Note must be a string");
    }

    const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);

    await syncWowauditMemberUpdate(memberId, { note: trimmed || null });

    const { error } = await supabaseAdmin.from('guild_members')
        .update({ note: trimmed })
        .eq('id', memberId);

    if (error) throw new Error("Error interno del servidor");
    revalidatePath("/zona-raider/roster");
}

export async function deleteMember(memberId: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    const authz = await getAuthzSnapshot(session);
    const permissions = await getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? '', 'roster');
    if (!permissions.canEdit) throw new Error('Unauthorized: Role cannot edit roster');

    validateMemberId(memberId);

    const member = await getRosterMember(memberId);
    if (!member) throw new Error('Member not found');

    const wowauditId = await resolveWowauditCharacterId(member);
    await deleteWowauditCharacter(wowauditId);

    const { error } = await supabaseAdmin.from('guild_members')
        .delete()
        .eq('id', memberId);

    if (error) throw new Error("Error interno del servidor");
    revalidatePath("/zona-raider/roster");
}
