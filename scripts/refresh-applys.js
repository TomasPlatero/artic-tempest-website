
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vrniyndhfaawwqzcrqng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybml5bmRoZmFhd3dxemNycW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY4NzY3NSwiZXhwIjoyMDg3MjYzNjc1fQ._Wp8mTD5fxtDmXEfEb74_u4WysGA7HHCQi4brCF3y34';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchCharacterRIO(name, realm, region = "eu") {
    const realmSlug = realm.toLowerCase().trim().replace(/\s+/g, '-');
    const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(name.trim())}&fields=active_spec_name`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error(`Error RIO for ${name}:`, err.message);
        return null;
    }
}

async function startRefresh() {
    console.log("=== REFRESHING ALL APPLICATIONS ===");

    const { data: apps, error } = await supabase
        .from('recruitment_applications')
        .select('*');

    if (error) {
        console.error("Error fetching apps:", error);
        return;
    }

    console.log(`Found ${apps.length} applications.`);

    for (const app of apps) {
        console.log(`Checking ${app.character_name} (${app.character_class})...`);

        // Try Raider.io
        const rio = await fetchCharacterRIO(app.character_name, app.character_realm);
        let betterSpec = rio?.active_spec_name;

        // Try synced characters as well
        if (!betterSpec || betterSpec === "Unknown") {
            const { data: synced } = await supabase
                .from("bnet_characters")
                .select("spec")
                .eq("name", app.character_name)
                .eq("realm", app.character_realm)
                .single();
            betterSpec = synced?.spec;
        }

        if (betterSpec && betterSpec !== "Unknown" && app.character_spec !== betterSpec) {
            console.log(`Updating ${app.character_name}: ${app.character_spec} -> ${betterSpec}`);
            await supabase
                .from('recruitment_applications')
                .update({ character_spec: betterSpec })
                .eq('id', app.id);
        } else if (app.character_spec === "Unknown") {
            console.log(`Skipping ${app.character_name} - Spec still unknown (RIO: ${rio?.active_spec_name || 'N/A'})`);
        }
    }

    console.log("=== REFRESH COMPLETED ===");
}

startRefresh();
