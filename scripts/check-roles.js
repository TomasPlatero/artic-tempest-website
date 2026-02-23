
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkRoles() {
    console.log("Checking distinct roles in guild_members...")
    const { data: members, error } = await supabase.from("guild_members").select("role")
    if (error) console.error(error)
    else {
        const roles = new Set(members.map(m => m.role))
        console.log("Distinct Roles:", Array.from(roles))
    }
}

checkRoles()
