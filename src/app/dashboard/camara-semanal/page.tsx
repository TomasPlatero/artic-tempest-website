import { ensureAppPermission } from '@/shared/auth/permissions';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { WeeklyVaultUploader } from './components/weekly-vault-uploader';
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar";
import React from 'react';

export default async function WeeklyVaultPage() {
  const session = await ensureAppPermission('weekly-vault', 'view');

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

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
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
      </SidebarInset>
    </SidebarProvider>
  );
}
