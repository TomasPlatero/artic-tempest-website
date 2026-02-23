
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkMembers() {
    console.log("Checking some members...")
    const { data: members, error } = await supabase.from("guild_members").select("*").limit(5)
    if (error) console.error(error)
    else console.log("Members Sample:", JSON.stringify(members, null, 2))
}

checkMembers()
