import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { resolveExportItemMetadata } from '@/domains/bis/lib/export-item-metadata';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role_level')
      .eq('user_id', session.user.id)
      .single();

    const isOfficer =
      profile?.role_level === 'officer' || profile?.role_level === 'gm';
    if (!isOfficer) {
      return new NextResponse('Prohibido', { status: 403 });
    }

    const { data: selections, error } = await supabaseAdmin
      .from('bis_selections')
      .select('id, difficulty, ilvl, bonus_ids, upgrade_track');

    if (error) throw error;

    const updates = (selections || [])
      .map((selection) => {
        const metadata = resolveExportItemMetadata({
          difficulty: selection.difficulty,
          ilvl: selection.ilvl,
          bonusIds: selection.bonus_ids,
          upgradeTrack: selection.upgrade_track,
        });

        const currentBonusIds = Array.isArray(selection.bonus_ids)
          ? selection.bonus_ids
          : [];
        const hasBonusChange =
          JSON.stringify(currentBonusIds) !== JSON.stringify(metadata.bonusIds);
        const hasIlvlChange = (selection.ilvl || 0) !== metadata.ilvl;
        const expectedTrack = metadata.upgradeTrack
          ? metadata.upgradeCurrent !== null && metadata.upgradeMax !== null
            ? `${metadata.upgradeTrack} ${metadata.upgradeCurrent}/${metadata.upgradeMax}`
            : metadata.upgradeTrack
          : null;
        const hasTrackChange =
          (selection.upgrade_track || null) !== expectedTrack;

        if (!hasBonusChange && !hasIlvlChange && !hasTrackChange) {
          return null;
        }

        return {
          id: selection.id,
          ilvl: metadata.ilvl,
          bonus_ids: metadata.bonusIds,
          upgrade_track: expectedTrack,
        };
      })
      .filter(Boolean);

    if (updates.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    await Promise.all(
      updates.map((update) =>
        supabaseAdmin
          .from('bis_selections')
          .update({
            ilvl: update!.ilvl,
            bonus_ids: update!.bonus_ids,
            upgrade_track: update!.upgrade_track,
          })
          .eq('id', update!.id),
      ),
    );

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (e: any) {
    console.error('BiS backfill error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
