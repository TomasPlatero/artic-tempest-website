
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkVisibility() {
    console.log("Checking guild_rank_visibility...")
    const { data: visibility, error: vError } = await supabase.from("guild_rank_visibility").select("*")
    if (vError) console.error("Visibility Error:", vError)
    else console.log("Visibility Settings:", JSON.stringify(visibility, null, 2))

    console.log("Checking guild_members rank distribution...")
    const { data: members, error: mError } = await supabase.from("guild_members").select("rank").limit(100)
    if (mError) console.error("Members Error:", mError)
    else {
        const counts = {}
        members.forEach(m => counts[m.rank] = (counts[m.rank] || 0) + 1)
        console.log("Member Rank Counts (sample 100):", counts)
    }
}

checkVisibility()
