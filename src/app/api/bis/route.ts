// src/app/api/bis/route.ts
// BiS selections CRUD for the current user

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { resolveExportItemMetadata } from '@/domains/bis/lib/export-item-metadata';
import { bnet } from '@/shared/integrations/bnet/client';

async function ensureBnetItemCached(itemId: number) {
  const { data: existingItem } = await supabaseAdmin
    .from('bnet_items')
    .select('id')
    .eq('id', itemId)
    .maybeSingle();

  if (existingItem) return;

  try {
    const itemData = await bnet.getItem(itemId);
    let iconUrl = null;

    try {
      const mediaData = await bnet.getItemMedia(itemId);
      if (mediaData.assets && mediaData.assets.length > 0) {
        iconUrl = mediaData.assets[0].value;
      }
    } catch {
      // Ignore media failures, item data is enough for cache
    }

    const itemName =
      typeof itemData.name === 'string'
        ? itemData.name
        : itemData.name?.es_ES || itemData.name?.en_US;

    await supabaseAdmin.from('bnet_items').upsert({
      id: itemData.id,
      name: itemName,
      quality: itemData.quality?.type || null,
      item_level: itemData.level || null,
      required_level: itemData.required_level || null,
      icon: iconUrl,
      item_class_id: itemData.item_class?.id || null,
      item_subclass_id: itemData.item_subclass?.id || null,
      inventory_type: itemData.inventory_type?.type || null,
    });
  } catch (error) {
    console.error(`BiS Battle.net cache error for item ${itemId}:`, error);
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const url = new URL(req.url);
    const memberId = url.searchParams.get('member_id');
    const instanceId = url.searchParams.get('instance_id');
    const diffId = url.searchParams.get('diff');
    const difficulty = diffId || url.searchParams.get('difficulty');
    const specId = url.searchParams.get('spec_id');

    // Authentication and Permission Check
    const permissions = await ensureAppPermission('bis', 'view');
    const userRole = session.user.roleLevel;

    // If not GM/Officer, verify character ownership
    if (userRole !== 'gm' && userRole !== 'officer') {
      const { data: member } = await supabaseAdmin
        .from('guild_members')
        .select('id, character_name')
        .eq('id', memberId)
        .single();

      if (!member) {
        return NextResponse.json(
          { error: 'Personaje no encontrado' },
          { status: 404 },
        );
      }

      const { data: bnetChar } = await supabaseAdmin
        .from('bnet_characters')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', member.character_name)
        .limit(1)
        .single();

      if (!bnetChar) {
        return NextResponse.json(
          { error: 'No autorizado para este personaje' },
          { status: 403 },
        );
      }
    }

    let query = supabaseAdmin
      .from('bis_selections')
      .select('*')
      .eq('member_id', memberId);

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
    if (specId) {
      if (specId === 'null') {
        query = query.is('spec_id', null);
      } else {
        query = query.eq('spec_id', parseInt(specId, 10));
      }
    }

    const { data } = await query.order('slot');

    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('BiS GET error:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const body = await req.json();
    const {
      member_id,
      item_id,
      item_name,
      item_icon,
      slot,
      boss_name,
      priority,
      difficulty,
      instance_id,
      ilvl,
      dps_gain,
      percent_gain,
      bonus_ids,
      gems,
      enchant,
      upgrade_track,
      spec_id,
    } = body;

    if (!member_id || !item_id || !item_name || !slot) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 },
      );
    }

    const resolvedMetadata = resolveExportItemMetadata({
      difficulty,
      ilvl,
      bonusIds: bonus_ids,
      upgradeTrack: upgrade_track,
    });

    const formattedUpgradeTrack = resolvedMetadata.upgradeTrack
      ? resolvedMetadata.upgradeCurrent !== null &&
        resolvedMetadata.upgradeMax !== null
        ? `${resolvedMetadata.upgradeTrack} ${resolvedMetadata.upgradeCurrent}/${resolvedMetadata.upgradeMax}`
        : resolvedMetadata.upgradeTrack
      : null;

    // Check permissions
    await ensureAppPermission('bis', 'edit');
    const userRole = session.user.roleLevel;

    // If not GM/Officer, verify character ownership
    if (userRole !== 'gm' && userRole !== 'officer') {
      const { data: member } = await supabaseAdmin
        .from('guild_members')
        .select('id, character_name')
        .eq('id', member_id)
        .single();

      if (!member) {
        return NextResponse.json(
          { error: 'Personaje no encontrado' },
          { status: 404 },
        );
      }

      const { data: bnetChar } = await supabaseAdmin
        .from('bnet_characters')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', member.character_name)
        .limit(1)
        .single();

      if (!bnetChar) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    await ensureBnetItemCached(Number(item_id));

    const { data, error } = await supabaseAdmin
      .from('bis_selections')
      .upsert(
        {
          member_id,
          item_id,
          item_name,
          item_icon: item_icon || null,
          slot,
          boss_name: boss_name || null,
          priority: priority || 2,
          difficulty: difficulty || 'heroic',
          instance_id: (() => {
            if (instance_id === 'voidspire') return 1307;
            return parseInt(String(instance_id), 10) || 0;
          })(),
          dps_gain: dps_gain || null,
          percent_gain: percent_gain || null,
          ilvl: resolvedMetadata.ilvl,
          bonus_ids: resolvedMetadata.bonusIds,
          gems: gems || [],
          enchant: enchant || null,
          upgrade_track: formattedUpgradeTrack,
          spec_id: spec_id || null,
        },
        { onConflict: 'member_id,item_id,difficulty,spec_id' },
      )
      .select()
      .single();

    if (error) {
      console.error('BiS upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('BiS POST error:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const url = new URL(req.url);
    const selectionId = url.searchParams.get('id');

    if (!selectionId) {
      return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
    }

    // Get the selection to verify ownership
    const { data: selection } = await supabaseAdmin
      .from('bis_selections')
      .select('id, member_id')
      .eq('id', selectionId)
      .single();

    if (!selection) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    // Permission check
    await ensureAppPermission('bis', 'edit');
    const userRole = session.user.roleLevel;

    // If not GM/Officer, verify character ownership
    if (userRole !== 'gm' && userRole !== 'officer') {
      const { data: member } = await supabaseAdmin
        .from('guild_members')
        .select('character_name')
        .eq('id', selection.member_id)
        .single();

      if (!member) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      const { data: bnetChar } = await supabaseAdmin
        .from('bnet_characters')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', member.character_name)
        .limit(1)
        .single();

      if (!bnetChar) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    await supabaseAdmin.from('bis_selections').delete().eq('id', selectionId);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('BiS DELETE error:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureAppPermission('bis', 'edit');
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return new NextResponse('No autorizado', { status: 401 });

    const body = await req.json();
    const { member_id, dps_gain, pct_gain } = body;

    if (!member_id) {
      return NextResponse.json(
        { error: 'Falta el member_id' },
        { status: 400 },
      );
    }

    // Verify ownership
    const { data: member } = await supabaseAdmin
      .from('guild_members')
      .select('character_name')
      .eq('id', member_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: bnetChar } = await supabaseAdmin
      .from('bnet_characters')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('name', member.character_name)
      .limit(1)
      .single();

    if (!bnetChar) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('guild_members')
      .update({
        bis_dps_gain: dps_gain,
        bis_pct_gain: pct_gain,
      })
      .eq('id', member_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('BiS PATCH error:', e.message);
    return new NextResponse('Error interno', { status: 500 });
  }
}
