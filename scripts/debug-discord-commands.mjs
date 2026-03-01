// scripts/debug-discord-commands.mjs
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const {
    DISCORD_CLIENT_ID, // OAuth
    DISCORD_APP_ID,    // Bot
    DISCORD_BOT_TOKEN,
    DISCORD_GUILD_ID
} = process.env;

const headers = {
    "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
};

async function listCommands(appId, guildId = null) {
    const type = guildId ? "GUILD" : "GLOBAL";
    const url = guildId
        ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
        : `https://discord.com/api/v10/applications/${appId}/commands`;

    console.log(`Checking ${type} commands for App ID: ${appId}...`);
    try {
        const res = await fetch(url, { headers });
        const data = await res.json();
        if (res.ok) {
            console.log(`✅ found ${data.length} ${type} commands for ${appId}:`);
            data.forEach(c => console.log(`   - /${c.name} (ID: ${c.id})`));
        } else {
            console.log(`❌ Error for ${appId} (${type}): ${res.status} ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.error(`❌ Fetch error for ${appId}:`, e.message);
    }
}

async function run() {
    console.log("--- DISCORD COMMAND DIAGNOSTICS ---");

    if (DISCORD_APP_ID) {
        console.log("\n[Target: Bot App ID]");
        await listCommands(DISCORD_APP_ID);
        if (DISCORD_GUILD_ID) await listCommands(DISCORD_APP_ID, DISCORD_GUILD_ID);
    }

    if (DISCORD_CLIENT_ID && DISCORD_CLIENT_ID !== DISCORD_APP_ID) {
        console.log("\n[Target: OAuth Client ID]");
        await listCommands(DISCORD_CLIENT_ID);
        if (DISCORD_GUILD_ID) await listCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID);
    }

    console.log("\n--- FINISH ---");
}

run();
