const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20260313180554_create_weekly_vault.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log("Attempting to run migration via Supabase RPC...");
    
    // We try to call a generic 'exec' function if it exists, otherwise we just log it.
    const { data, error } = await supabase.rpc('exec_sql', { query: sqlScript });

    if (error) {
        console.error("RPC exec_sql failed (it might not exist). Error:", error.message);
        console.log("\n=======================================================");
        console.log("PLEASE EXECUTE THIS SQL MANUALLY IN SUPABASE DASHBOARD:");
        console.log("=======================================================\n");
        console.log(sqlScript);
        console.log("\n=======================================================");
    } else {
        console.log("Migration executed successfully via RPC!");
    }
}

runSQL();
