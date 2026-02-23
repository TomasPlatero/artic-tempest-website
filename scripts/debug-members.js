const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vrniyndhfaawwqzcrqng.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybml5bmRoZmFhd3dxemNycW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY4NzY3NSwiZXhwIjoyMDg3MjYzNjc1fQ._Wp8mTD5fxtDmXEfEb74_u4WysGA7HHCQi4brCF3y34"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMembers() {
    const { data, count, error } = await supabase
        .from('guild_members')
        .select('*', { count: 'exact' })
        .eq('is_plannable', true);

    if (error) {
        console.error('Error fetching members:', error);
        return;
    }

    console.log('Plannable members count:', count);
    if (data && data.length > 0) {
        process.stdout.write('Names: ' + data.map(m => m.character_name).join(', ') + '\n');
    } else {
        console.log('No plannable members found.');

        // Let's check total members count to see if we're connected right
        const { count: total } = await supabase.from('guild_members').select('*', { count: 'exact', head: true });
        console.log('Total members in DB:', total);
    }
}

checkMembers();
