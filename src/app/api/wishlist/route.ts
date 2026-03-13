import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { RaidbotsParserService } from '@/domains/bis/lib/raidbots-parser-service';
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    await ensureAppPermission('bis', 'edit');

    const { member_id, raidbots_url } = await req.json();

    if (!member_id || !raidbots_url) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 },
      );
    }

    const canAccess = await userCanAccessBisMember(
      session.user.id,
      session.user.roleLevel,
      member_id,
    );
    if (!canAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const reportId = raidbots_url.match(/report\/([a-zA-Z0-9]+)/)?.[1];
    if (!reportId) {
      return NextResponse.json(
        { error: 'URL de Raidbots no válida' },
        { status: 400 },
      );
    }

    const [reportRes, memberRes] = await Promise.all([
      fetch(`https://www.raidbots.com/simbot/report/${reportId}/data.json`, {
        headers: { 'User-Agent': 'GuildBoard-Bot/1.0' },
      }),
      supabaseAdmin
        .from('guild_members')
        .select('id, spec_id')
        .eq('id', member_id)
        .single(),
    ]);

    if (!reportRes.ok) {
      return NextResponse.json(
        { error: 'No se pudo obtener datos de Raidbots' },
        { status: reportRes.status },
      );
    }

    if (memberRes.error || !memberRes.data) {
      return NextResponse.json(
        { error: 'Personaje no encontrado' },
        { status: 404 },
      );
    }

    const parsed = RaidbotsParserService.parseReport(await reportRes.json());
    const specId = memberRes.data.spec_id || null;

    const rows = parsed.items
      .filter((item) => item.wish?.id && item.wish?.name)
      .map((item) => ({
        member_id,
        item_id: item.wish!.id,
        item_name: item.wish!.name,
        item_icon: item.wish!.icon || null,
        slot: item.slot.toLowerCase(),
        boss_name: item.lootSource || null,
        priority: 1,
        difficulty: 'heroic',
        instance_id: 0,
        dps_gain: item.dpsGain || 0,
        percent_gain: String(item.percentGain || 0),
        ilvl: item.wish!.itemLevel || 0,
        bonus_ids: item.wish!.bonusIds || [],
        gems: item.wish!.gems || [],
        enchant: item.wish!.enchant || null,
        upgrade_track: item.wish!.upgradeTrack || null,
        spec_id: specId,
      }));

    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from('bis_selections')
        .upsert(rows, { onConflict: 'member_id,item_id,difficulty,spec_id' });

      if (error) throw error;
    }

    await supabaseAdmin
      .from('guild_members')
      .update({
        bis_dps_gain: parsed.dpsGain,
        bis_pct_gain: parsed.percentGain,
      })
      .eq('id', member_id);

    return NextResponse.json({
      success: true,
      imported: rows.length,
      totalDpsGain: parsed.dpsGain,
      totalPercentGain: parsed.percentGain,
      source: 'bis_selections',
    });
  } catch (e: any) {
    console.error('Wishlist POST error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
