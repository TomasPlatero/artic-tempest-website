// scripts/sync-boss-abilities.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Polyfill fetch for node environments without it (though Node 20+ has it)
if (!global.fetch) {
  global.fetch = fetch;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bnetClientId = process.env.BNET_CLIENT_ID;
const bnetClientSecret = process.env.BNET_CLIENT_SECRET;

if (!supabaseUrl || !supabaseKey || !bnetClientId || !bnetClientSecret) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: bnetClientId,
    client_secret: bnetClientSecret,
  });

  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error('Bnet Auth failed');
  const data = await res.json();
  return data.access_token;
}

async function fetchEncounter(id, token, locale = 'en_US') {
  try {
    const url = `https://eu.api.blizzard.com/data/wow/journal-encounter/${id}?namespace=static-eu&locale=${locale}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Error fetching encounter ${id}:`, error.message);
    return null;
  }
}

async function fetchSpellMedia(spellId, token) {
  try {
    const url = `https://eu.api.blizzard.com/data/wow/media/spell/${spellId}?namespace=static-eu`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    const iconAsset = data.assets?.find(a => a.key === 'icon');
    return iconAsset?.value || null;
  } catch (error) {
    console.error(`Error fetching spell media for ${spellId}:`, error.message);
    return null;
  }
}

async function run() {
  const token = await getAccessToken();
  console.log('Obtained Bnet token');

  const { data: bosses } = await supabase.from('bosses').select('id, name, bnet_encounter_id').not('bnet_encounter_id', 'is', null);
  
  if (!bosses) {
    console.error('No bosses found');
    return;
  }

  for (const boss of bosses) {
    console.log(`Syncing ${boss.name}...`);
    const dataEn = await fetchEncounter(boss.bnet_encounter_id, token, 'en_US');
    const dataEs = await fetchEncounter(boss.bnet_encounter_id, token, 'es_ES');

    if (!dataEn || !dataEn.sections) continue;

    const seenSpells = new Set();
    const abilities = [];
    
    for (const section of dataEn.sections) {
      const spellId = section.spell?.id || section.id;
      if (seenSpells.has(spellId)) continue;
      seenSpells.add(spellId);

      const sectionEs = dataEs?.sections?.find(s => s.id === section.id);

      // Fetch official icon
      console.log(`  Fetching icon for ${section.title} (Spell: ${spellId})...`);
      const iconUrl = await fetchSpellMedia(spellId, token);

      abilities.push({
        boss_id: boss.id,
        bnet_spell_id: spellId,
        name_en: section.title,
        name_es: sectionEs?.title || section.title,
        description_en: section.body_text || '',
        description_es: sectionEs?.body_text || section.body_text || '',
        icon_url: iconUrl,
        updated_at: new Date().toISOString()
      });
    }

    if (abilities.length === 0) continue;

    const { error } = await supabase.from('boss_abilities').upsert(abilities, { onConflict: 'boss_id,bnet_spell_id' });
    if (error) console.error(`Error for ${boss.name}:`, error);
    else console.log(`Synced ${abilities.length} abilities for ${boss.name} (with official icons)`);
  }
}

run();
