import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seedWeeklyVaultPermissions() {
  console.log('Seeding weekly-vault and weekly-vault-admin permissions...');

  const roles = ['gm', 'officer', 'raider', 'member', 'invitado'];
  const permissionsToInsert = [];

  for (const roleLevel of roles) {
    // weekly-vault (User Dashboard)
    // gm, officer, raider, member can view and edit (upload)
    // invitado cannot
    const isGuildMember = roleLevel !== 'invitado';

    permissionsToInsert.push({
      role_level: roleLevel,
      app_id: 'weekly-vault',
      can_view: isGuildMember,
      can_edit: isGuildMember,
      can_manage: false,
    });

    // weekly-vault-admin (Officer Dashboard)
    // gm, officer can view and edit and manage
    const isAdmin = roleLevel === 'gm' || roleLevel === 'officer';

    permissionsToInsert.push({
      role_level: roleLevel,
      app_id: 'weekly-vault-admin',
      can_view: isAdmin,
      can_edit: isAdmin,
      can_manage: isAdmin,
    });
  }

  // Upsert the permissions
  for (const perm of permissionsToInsert) {
    const { error } = await supabaseAdmin
      .from('app_permissions')
      .upsert(perm, { onConflict: 'role_level, app_id' });

    if (error) {
      console.error(`Failed to insert permission for ${perm.app_id} - ${perm.role_level}:`, error);
    }
  }

  console.log('Finished seeding weekly-vault permissions.');
}

seedWeeklyVaultPermissions();
