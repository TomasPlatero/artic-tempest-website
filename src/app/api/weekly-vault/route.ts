import { ensureAppPermission } from '@/shared/auth/permissions';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await ensureAppPermission('weekly-vault', 'view');

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'user'; // 'user' or 'admin'
    const weekStart = searchParams.get('week'); // Optional filter by explicit week (YYYY-MM-DD)
    const guildId = searchParams.get('guildId');

    if (mode === 'admin') {
      // Must have admin permissions
      await ensureAppPermission('weekly-vault-admin', 'view');
      
      const query = supabaseAdmin
        .from('weekly_vault_screenshots')
        .select(`
          id, created_at, week_start, image_url,
          profiles(discord_username, character_name, discord_avatar),
          bnet_characters(name, realm_slug, class_id)
        `);
      
      if (guildId) query.eq('guild_id', guildId);
      if (weekStart) query.eq('week_start', weekStart);

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // User mode: fetch only their own screenshots
      const query = supabaseAdmin
        .from('weekly_vault_screenshots')
        .select(`
          id, created_at, week_start, image_url, guild_id,
          bnet_characters(name, realm_slug, class_id)
        `)
        .eq('profile_id', session.user.id);
      
      if (weekStart) query.eq('week_start', weekStart);
      
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error in GET /api/weekly-vault:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { subDays, format } from 'date-fns';

function getCurrentWowResetWeek(date: Date = new Date()): string {
  // WoW EU Reset is Wednesday (day 3)
  const day = date.getDay();
  // If it's Sunday (0), Monday (1), or Tuesday (2), the reset week started the *previous* Wednesday.
  // Otherwise, it started *this* Wednesday.
  const diffToWednesday = day >= 3 ? day - 3 : day + 4;
  const resetDate = subDays(date, diffToWednesday);
  return format(resetDate, 'yyyy-MM-dd');
}

export async function POST(request: Request) {
  try {
    const session = await ensureAppPermission('weekly-vault', 'edit');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const guild_id = formData.get('guild_id') as string;
    const character_id = formData.get('character_id') as string;

    if (!file || !guild_id || !character_id) {
      return NextResponse.json(
        { error: 'Missing required parameters (file, guild_id, character_id)' },
        { status: 400 }
      );
    }

    const week_start = getCurrentWowResetWeek();
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename: guild_id/week_start/character_id-timestamp.ext
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${guild_id}/${week_start}/${character_id}-${Date.now()}.${extension}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('weekly-vault')
      .upload(filename, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (storageError) throw storageError;

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('weekly-vault')
      .getPublicUrl(filename);
      
    const image_url = publicUrlData.publicUrl;

    // Insert database record
    const { data, error } = await supabaseAdmin
      .from('weekly_vault_screenshots')
      .insert({
        guild_id,
        profile_id: session.user.id,
        character_id,
        image_url,
        week_start,
      })
      .select(`
        id, created_at, week_start, image_url, guild_id,
        bnet_characters(name, realm_slug, class_id)
      `)
      .single();

    if (error) {
      // Cleanup uploaded file on DB error
      await supabaseAdmin.storage.from('weekly-vault').remove([filename]);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in POST /api/weekly-vault:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await ensureAppPermission('weekly-vault', 'edit');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
       return NextResponse.json({ error: 'Missing screenshot ID' }, { status: 400 });
    }

    // Try deleting as normal user first (RLS handles ownership)
    const { error: userError } = await supabaseAdmin
      .from('weekly_vault_screenshots')
      .delete()
      .eq('id', id)
      .eq('profile_id', session.user.id);

    // If there's an error, it might be an admin trying to delete. 
    // They would need `weekly-vault-admin` manage permission.
    if (userError) {
       const adminSession = await ensureAppPermission('weekly-vault-admin', 'manage').catch(() => null);
       if (adminSession) {
          const { error: adminError } = await supabaseAdmin.from('weekly_vault_screenshots').delete().eq('id', id);
          if (adminError) throw adminError;
       } else {
         throw userError;
       }
    }

    // Also need to delete the object from Storage. 
    // This is commonly done via another call or we can leave it to a cron depending on the architecture. 
    // Here we'll return success on the DB delete.
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in DELETE /api/weekly-vault:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
