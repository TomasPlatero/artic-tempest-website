import { ensureAppPermission } from '@/shared/auth/permissions';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import * as flags from "@/flags"
import { WeeklyVaultUploader } from './components/weekly-vault-uploader';
import React from 'react';

export default async function WeeklyVaultPage() {
  const session = await ensureAppPermission('weekly-vault', 'view');

  if (!(await flags.enableWeeklyVault())) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }

  // Fetch the user's characters 
  const { data: characters, error: charsError } = await supabaseAdmin
    .from('bnet_characters')
    .select('id, name, realm_slug, char_class:class_id')
    .eq('user_id', session.user.id)
    .order('name', { ascending: true });

  if (charsError) console.error('Error fetching characters:', charsError);

  // Fetch the active guild. Since this is a single guild application MVP, 
  // we just fetch the first one from guilds_managed.
  const { data: guildData } = await supabaseAdmin
    .from('guilds_managed')
    .select('guild_id')
    .limit(1)
    .single();

  const guildId = guildData?.guild_id;

  // Fetch existing uploads for the user to display history or status
  const { data: uploads } = await supabaseAdmin
    .from('weekly_vault_screenshots')
    .select(`
      id, created_at, week_start, image_url,
      bnet_characters(name, class_id)
    `)
    .eq('profile_id', session.user.id)
    .order('created_at', { ascending: false });

  // Fetch user's active roster character to prioritize it in the selector
  const { data: guildMember } = await supabaseAdmin
    .from('guild_members')
    .select('bnet_character_id')
    .eq('profile_id', session.user.id)
    .order('rank', { ascending: true })
    .limit(1)
    .single();

  const activeCharacterId = guildMember?.bnet_character_id;


  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cámara Semanal</h1>
        <p className="text-muted-foreground mt-2">
          Sube una captura de tu Gran Cámara (Vault) para ayudar a los ofis a repartir el loot.
        </p>
      </div>
      <div className="max-w-4xl">
        <WeeklyVaultUploader 
          characters={characters || []} 
          guildId={guildId} 
          uploads={uploads || []}
          activeCharacterId={activeCharacterId}
        />
      </div>
    </div>
  );
}
