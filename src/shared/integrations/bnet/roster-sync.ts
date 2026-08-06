import { supabaseAdmin } from '@/shared/lib/supabase-admin';
type ExistingGuildMember = {
  id: string;
  character_name: string;
  realm_slug: string;
};

function makeRosterMemberKey(characterName: string, realmSlug: string) {
  return `${characterName.trim().toLowerCase()}:${realmSlug.trim().toLowerCase()}`;
}

async function deleteByIds(table: string, column: string, values: string[]) {
  if (!values.length) return;

  const { error } = await supabaseAdmin.from(table).delete().in(column, values);
  if (error) throw error;
}

export async function reconcileRemovedGuildMembers(params: {
  existingMembers: ExistingGuildMember[];
  activeMembers: Array<{ character_name: string; realm_slug: string }>;
}) {
  const activeKeys = new Set(
    params.activeMembers.map((member) =>
      makeRosterMemberKey(member.character_name, member.realm_slug),
    ),
  );

  const staleMembers = params.existingMembers.filter(
    (member) =>
      !activeKeys.has(
        makeRosterMemberKey(member.character_name, member.realm_slug),
      ),
  );

  if (!staleMembers.length) {
    return { removed: 0 };
  }

  const staleIds = staleMembers.map((member) => member.id);

  await deleteByIds('guild_members', 'id', staleIds);

  return { removed: staleMembers.length };
}
