import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';

export const dynamic = 'force-dynamic';

type AdminSelectionRow = {
  id?: string;
  member_id: string;
  item_id: number;
  difficulty: string | null;
  instance_id: number | null;
  spec_id?: number | null;
};

function dedupeSelections<T extends AdminSelectionRow>(rows: T[]) {
  const deduped = new Map<string, T>();

  for (const row of rows) {
    const key = [
      row.member_id,
      row.item_id,
      String(row.difficulty || ''),
      String(row.instance_id || 0),
    ].join(':');

    const current = deduped.get(key);
    if (!current) {
      deduped.set(key, row);
      continue;
    }

    const currentHasSpec =
      current.spec_id !== null && current.spec_id !== undefined;
    const rowHasSpec = row.spec_id !== null && row.spec_id !== undefined;

    if (!currentHasSpec && rowHasSpec) {
      deduped.set(key, row);
    }
  }

  return Array.from(deduped.values());
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const member_id = searchParams.get('member_id');
  const instance_id = searchParams.get('instance_id');
  const difficulty = searchParams.get('difficulty');

  try {
    if (member_id) {
      // Fetch specific member selections
      let query = supabaseAdmin
        .from('bis_selections')
        .select('*')
        .eq('member_id', member_id);

      if (difficulty) query = query.eq('difficulty', difficulty);

      const normalizedInstanceId =
        instance_id === 'voidspire' ? '1307' : instance_id || '0';
      const numericInstanceId = parseInt(normalizedInstanceId, 10);
      if (!isNaN(numericInstanceId) && numericInstanceId !== 0) {
        query = query.eq('instance_id', numericInstanceId);
      }

      const { data, error } = await query.order('slot');
      if (error) throw error;
      return NextResponse.json(
        dedupeSelections((data || []) as AdminSelectionRow[]),
      );
    }

    // Fetch rank visibility configurations to match Roster app behavior
    const { data: rawRanks } = await supabaseAdmin
      .from('guild_ranks')
      .select('rank, is_visible');

    const visibilityMap: Record<number, boolean> = {};
    // Default to true for all ranks if not configured
    for (let i = 0; i <= 9; i++) visibilityMap[i] = true;
    rawRanks?.forEach((r) => {
      visibilityMap[r.rank] = r.is_visible;
    });

    // Fetch summary for all members with a character in guild_members
    const { data: members, error } = await supabaseAdmin
      .from('guild_members')
      .select('id, character_name, class_id, rank, realm_slug')
      .lte('rank', 9)
      .order('character_name');

    if (error) throw error;

    // Filter members based on rank visibility
    const visibleMembers = (members || []).filter(
      (m) => visibilityMap[Number(m.rank)] !== false,
    );

    const { data: selectionsCount } = await supabaseAdmin
      .from('bis_selections')
      .select('member_id,item_id,difficulty,instance_id,spec_id');

    const selectionMap = new Map();
    dedupeSelections((selectionsCount || []) as AdminSelectionRow[]).forEach(
      (s) => {
        selectionMap.set(s.member_id, (selectionMap.get(s.member_id) || 0) + 1);
      },
    );

    const processed = visibleMembers.map((m: any) => ({
      ...m,
      selection_count: selectionMap.get(m.id) || 0,
    }));

    return NextResponse.json({
      members: processed,
      ranks: rawRanks || [],
    });
  } catch (error: any) {
    console.error('BiS Admin API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
