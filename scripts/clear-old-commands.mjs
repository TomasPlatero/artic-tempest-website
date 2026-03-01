// scripts/clear-old-commands.mjs
import dotenv from "dotenv";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: ".env.local" });

const {
    DISCORD_CLIENT_ID,
    DISCORD_BOT_TOKEN,
    DISCORD_GUILD_ID
} = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
    console.error("Missing Discord credentials in .env.local");
    process.exit(1);
}

const headers = {
    "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
};

async function clearCommands(url, type) {
    console.log(`Clearing ${type} commands at ${url}...`);
    try {
        const res = await fetch(url, { method: "PUT", headers, body: "[]" });
        if (res.ok) {
            console.log(`✅ ${type} commands cleared successfully.`);
        } else {
            console.error(`❌ Failed to clear ${type} commands:`, res.status, await res.text());
        }
    } catch (e) {
        console.error(`❌ Error clearing ${type} commands:`, e);
    }
}

async function run() {
    console.log("Starting Ghost Command cleanup...");

    // Clear Global Commands
    const globalUrl = `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/commands`;
    await clearCommands(globalUrl, "GLOBAL");

    // Clear Guild Commands
    if (DISCORD_GUILD_ID) {
        const guildUrl = `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/guilds/${DISCORD_GUILD_ID}/commands`;
        await clearCommands(guildUrl, "GUILD");
    } else {
        console.log("No GUILD ID provided, skipping guild-specific cleanup.");
    }

    console.log("Ghost cleanup finished.");
}

run();
