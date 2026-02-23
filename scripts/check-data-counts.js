
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkData() {
    const { data: visibleRanks } = await supabase
        .from("guild_rank_visibility")
        .select("rank_id")
        .eq("is_visible", true)

    const rankIds = (visibleRanks || []).map(r => r.rank_id)
    console.log("Visible Rank IDs:", rankIds)

    if (rankIds.length > 0) {
        const { count, error } = await supabase
            .from("guild_members")
            .select('*', { count: 'exact', head: true })
            .in("rank", rankIds)

        console.log("Members in visible ranks count:", count)
        if (error) console.error("Error fetching members:", error)
    } else {
        console.log("No ranks are marked as visible.")
    }
}

checkData()
