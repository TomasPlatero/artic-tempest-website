import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
    const { data, error } = await sb
        .from('cooldown_definitions')
        .select('name, duration')
        .ilike('name', '%Avenging Wrath%')

    if (error) {
        console.error(error)
        return
    }

    console.log('Cooldowns found:', JSON.stringify(data, null, 2))
}

check()
