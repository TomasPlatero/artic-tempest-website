const { createClient } = require('@supabase/supabase-js');
const { addDays, getDay, startOfDay, format, isAfter } = require('date-fns');

const sb = createClient('https://vrniyndhfaawwqzcrqng.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybml5bmRoZmFhd3dxemNycW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY4NzY3NSwiZXhwIjoyMDg3MjYzNjc1fQ._Wp8mTD5fxtDmXEfEb74_u4WysGA7HHCQi4brCF3y34');

async function testSync() {
    const guildId = 'a0000000-0000-4000-8000-000000000001';
    const { data: schedules } = await sb.from("guild_raid_schedule").select("*").eq("guild_id", guildId).eq("is_active", true);

    console.log(`Active schedules: ${schedules.length}`);

    const schedMap = new Map();
    schedules.forEach(s => schedMap.set(s.day_of_week, s));

    const eventsToInsert = [];
    const now = new Date();
    const today = startOfDay(now);

    for (let i = 0; i < 60; i++) {
        const targetDate = addDays(today, i);
        const dDay = getDay(targetDate);
        const dbDayOfWeek = dDay === 0 ? 7 : dDay;

        if (schedMap.has(dbDayOfWeek)) {
            const config = schedMap.get(dbDayOfWeek);
            const [startH, startM] = config.start_time.split(':');
            const [endH, endM] = config.end_time.split(':');

            const eventStart = new Date(targetDate);
            eventStart.setHours(parseInt(startH, 10), parseInt(startM, 10), 0);

            const eventEnd = new Date(targetDate);
            eventEnd.setHours(parseInt(endH, 10), parseInt(endM, 10), 0);

            if (isAfter(eventStart, eventEnd)) {
                eventEnd.setDate(eventEnd.getDate() + 1);
            }

            if (isAfter(eventStart, now)) {
                eventsToInsert.push({
                    guild_id: guildId,
                    destination: config.destination,
                    event_date: eventStart.toISOString(),
                });
            } else {
                console.log('Skipping past event:', eventStart.toISOString());
            }
        }
    }

    console.log(`Generated ${eventsToInsert.length} events`);

    if (eventsToInsert.length > 0) {
        const startRange = today.toISOString();
        const endRange = addDays(today, 60).toISOString();

        const { data: existingEvents } = await sb
            .from("guild_events")
            .select("event_date, destination")
            .eq("guild_id", guildId)
            .gte("event_date", startRange)
            .lte("event_date", endRange);

        console.log(`Found ${existingEvents.length} existing events`);

        const finalInsertBatch = eventsToInsert.filter(evt => {
            const evtDay = format(new Date(evt.event_date), 'yyyy-MM-dd');
            const duplicate = existingEvents?.find(ex => {
                const exDay = format(new Date(ex.event_date), 'yyyy-MM-dd');
                return exDay === evtDay && ex.destination === evt.destination;
            });
            return !duplicate;
        });

        console.log(`Final batch to insert: ${finalInsertBatch.length}`);
    }
}

testSync().catch(console.error);
