import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { userCanAccessBisMember } from '@/shared/auth/bis-access';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    await ensureAppPermission('bis', 'view');

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('member_id');
    const difficulty = searchParams.get('difficulty') || 'heroic';
    const specId = searchParams.get('spec_id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Falta el member_id' },
        { status: 400 },
      );
    }

    const canAccess = await userCanAccessBisMember(
      session.user.id,
      session.user.roleLevel,
      memberId,
    );
    if (!canAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let query = supabaseAdmin
      .from('bis_selections')
      .select('*')
      .eq('member_id', memberId)
      .eq('difficulty', difficulty)
      .order('slot');

    if (specId) {
      query =
        specId === 'null'
          ? query.is('spec_id', null)
          : query.eq('spec_id', parseInt(specId, 10));
    }

    const [{ data: selections, error }, { data: member }] = await Promise.all([
      query,
      supabaseAdmin
        .from('guild_members')
        .select('id, bis_dps_gain, bis_pct_gain')
        .eq('id', memberId)
        .maybeSingle(),
    ]);

    if (error) throw error;

    return NextResponse.json({
      memberId,
      totalDpsGain: member?.bis_dps_gain || 0,
      totalPercentGain: member?.bis_pct_gain || 0,
      items: (selections || []).map((item) => ({
        id: item.id,
        slot: item.slot,
        dpsGain: item.dps_gain,
        percentGain: item.percent_gain,
        lootSource: item.boss_name,
        priority: item.priority,
        wish: {
          id: item.item_id,
          name: item.item_name,
          icon: item.item_icon,
          itemLevel: item.ilvl,
          bonusIds: item.bonus_ids || [],
          upgradeTrack: item.upgrade_track,
        },
      })),
      source: 'bis_selections',
    });
  } catch (e: any) {
    console.error('Wishlist GET error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

