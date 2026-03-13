import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { getAppPermission } from '@/shared/auth/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const roleLevel = session.user.roleLevel ?? 'member';
    const { canView } = await getAppPermission(roleLevel, 'bis');

    if (!canView) {
      return new NextResponse('No autorizado para ver la lista BiS', {
        status: 403,
      });
    }

    const url = new URL(req.url);
    const instanceId = url.searchParams.get('instance_id');
    const difficulty = url.searchParams.get('difficulty');

    // 1. Fetch visible ranks
    let { data: rawRanks, error: ranksError } = await supabaseAdmin
      .from('guild_ranks')
      .select('rank, is_visible');

    if (
      ranksError &&
      (ranksError.code === 'PGRST204' ||
        ranksError.message.includes('schema cache'))
    ) {
      const { data: fallbackRanks } = await supabaseAdmin
        .from('guild_rank_visibility')
        .select('rank_id, is_visible');

      if (fallbackRanks) {
        rawRanks = fallbackRanks.map((r) => ({
          rank: (r as any).rank_id,
          is_visible: r.is_visible,
        }));
      }
    }

    const visibilityMap: Record<number, boolean> = {};
    for (let i = 0; i <= 9; i++) visibilityMap[i] = true;
    rawRanks?.forEach((r) => {
      visibilityMap[Number(r.rank)] = r.is_visible;
    });

    // Filter valid ranks
    const validRanks = Object.keys(visibilityMap)
      .filter((r) => visibilityMap[Number(r)] !== false)
      .map(Number);

    // 2. Fetch guild members from valid ranks
    const { data: validMembers, error: membersError } = await supabaseAdmin
      .from('guild_members')
      .select('id, character_name, class_id')
      .in('rank', validRanks);

    if (membersError || !validMembers)
      throw membersError || new Error('No members found');

    const validMemberIds = validMembers.map((m) => m.id);

    // 3. Fetch BiS selections
    let query = supabaseAdmin
      .from('bis_selections')
      .select(
        `
                *,
                guild_members!inner(id, character_name, class_id, role)
            `,
      )
      .in('member_id', validMemberIds);

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    if (instanceId) {
      const normalizedId = instanceId === 'voidspire' ? 1307 : instanceId;
      const numericInstanceId = parseInt(String(normalizedId), 10);
      if (!isNaN(numericInstanceId) && numericInstanceId !== 0) {
        query = query.eq('instance_id', numericInstanceId);
      }
    }

    const { data: selections, error: selectionsError } = await query;

    if (selectionsError) throw selectionsError;

    return NextResponse.json(selections || []);
  } catch (e: any) {
    console.error('BiS Overview GET error:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}
