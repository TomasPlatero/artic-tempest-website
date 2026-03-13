import { supabaseAdmin } from '@/shared/auth/auth-options';

export async function userCanAccessBisMember(
  userId: string,
  roleLevel: string,
  memberId: string,
) {
  if (roleLevel === 'gm' || roleLevel === 'officer') {
    return true;
  }

  const { data: member } = await supabaseAdmin
    .from('guild_members')
    .select('character_name, realm_slug, profile_id, bnet_character_id')
    .eq('id', memberId)
    .single();

  if (!member) {
    return false;
  }

  if (member.profile_id === userId) {
    return true;
  }

  if (member.bnet_character_id) {
    const { data: linkedCharacter } = await supabaseAdmin
      .from('bnet_characters')
      .select('id')
      .eq('id', member.bnet_character_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (linkedCharacter) {
      return true;
    }
  }

  const { data: bnetChar } = await supabaseAdmin
    .from('bnet_characters')
    .select('id')
    .eq('user_id', userId)
    .eq('name', member.character_name)
    .eq('realm_slug', member.realm_slug)
    .maybeSingle();

  return Boolean(bnetChar);
}
