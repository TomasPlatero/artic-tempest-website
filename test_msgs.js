require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const applicationId = '76e8b71a-ca51-4a87-bba8-8e8fd5bff119';
    const { data: msgs, error } = await sb
        .from("application_messages")
        .select("*")
        .eq("application_id", applicationId);
    console.log("Messages in db:", msgs);
    if (error) console.error(error);
})();
