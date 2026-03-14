const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const os = require("os");

const backupDir = path.resolve(os.tmpdir(), "guildboard-backups");
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = path.resolve(backupDir, `backup_full_${timestamp}.json`);
const logFile = path.resolve(backupDir, `backup_full_${timestamp}.log`);

let jobId = process.argv[2]; // Expect jobId passed from API

const logMessages = [];
async function updateDbStatus(data, appendLog = null) {
  if (!jobId || !supabaseUrl || !supabaseKey) return;
  
  try {
    const payload = { ...data };
    if (appendLog) {
      logMessages.push(appendLog);
      payload.logs = logMessages;
    }

    const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/backup_logs?id=eq.${jobId}`;
    await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "apikey": supabaseKey,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Failed to update DB status:", e.message);
  }
}

async function run() {
  const logStream = fs.createWriteStream(logFile, { flags: "a" });
  const log = (msg) => {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    logStream.write(line + "\n");
    console.log(line);
    updateDbStatus({}, line);
  };

  // If no jobId, create one (autonomous mode / cron)
  if (!jobId) {
    console.log("No jobId provided. Creating a new entry in backup_logs...");
    try {
      const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/backup_logs`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          status: "running",
          progress: 0,
          started_at: new Date().toISOString()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          jobId = data[0].id;
          console.log(`Autonomous Job ID created: ${jobId}`);
        }
      }
    } catch (e) {
      console.error("Failed to create autonomous job ID:", e.message);
    }
  }

  log(`Backup (JSON Export) started. Output: ${outFile}`);

  try {
    await updateDbStatus({
      status: "running",
      progress: 5,
      started_at: new Date().toISOString()
    });

    // 1. Fetch list of tables
    log("Fetching list of tables...");
    const tablesUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/`;
    // We can use the RPC or query the API directly for OpenAPI spec to get tables, 
    // but the most reliable way via REST with Service Key is querying the schema if allowed,
    // OR just using a hardcoded list of known tables if schema discovery is restricted.
    // However, Supabase REST API exposes tables via the root endpoint if authenticated.
    
    // A better way to get tables is querying information_schema via RPC or POSTGRESS API.
    // Since we want to avoid complex discovery, let's use a list of tables we know exist 
    // or try to discover them via the meta API if possible.
    
    // For GuildBoard, we can list the tables based on your project structure.
    const tablesToExport = [
      "guild_members", "guild_events", "event_signups", "bnet_characters", 
      "guild_raid_schedule", "bis_selections", "app_permissions", "guild_ranks",
      "cd_assignments", "cooldown_definitions", "game_constants", "system_notifications",
      "recruitment_spots", "recruitment_questions", "recruitment_applications",
      "profiles", "news", "boss_abilities", "items",
      "navigation_items", "spec_rules", "navigation_item_roles", "news_categories",
      "application_answers", "bnet_expansions", "dashboard_blocks", "user_configs",
      "feedback", "verification_logs", "user_notifications_read", "guilds_managed",
      "discord_roles", "discord_commands", "application_messages", "guild_streamers",
      "stream_notifications", "discord_embeds", "discord_welcome_configs", "item_spec_rules",
      "app_secrets", "wishlist_records", "raids", "bnet_item_translations", "bosses",
      "boss_drops", "item_stats", "item_effects", "class_rules", "class_weapon_rules",
      "wishlists", "wishlist_items", "audit_logs", "weekly_vault_screenshots", "backup_logs"
    ];

    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0",
        tables: tablesToExport
      },
      data: {}
    };

    let processedCount = 0;
    for (const table of tablesToExport) {
      log(`Exporting table: ${table}...`);
      const tableUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=*`;
      
      const res = await fetch(tableUrl, {
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey
        }
      });

      if (res.ok) {
        backupData.data[table] = await res.json();
      } else {
        log(`Warning: Failed to fetch table ${table}: ${res.statusText}`);
      }

      processedCount++;
      const progress = 5 + Math.floor((processedCount / tablesToExport.length) * 85);
      await updateDbStatus({ progress });
    }

    // 2. Save to file
    log("Saving JSON file...");
    fs.writeFileSync(outFile, JSON.stringify(backupData, null, 2));
    const stats = fs.statSync(outFile);
    log(`Save complete. Size: ${stats.size} bytes`);

    await updateDbStatus({ progress: 95, file_size: stats.size });

    // 3. Upload to storage
    log("Uploading to storage...");
    const uploader = spawn(process.execPath, [
      path.resolve(process.cwd(), "scripts", "upload-to-storage.js"),
      `${timestamp}.json`,
      outFile
    ], {
      env: { ...process.env },
      windowsHide: true
    });

    let uploadOutput = "";
    uploader.stdout.on("data", (d) => {
      const msg = d.toString();
      uploadOutput += msg;
      log(`[uploader stdout] ${msg.trim()}`);
    });

    uploader.stderr.on("data", (d) => {
      log(`[uploader stderr] ${d.toString().trim()}`);
    });

    const uploadCode = await new Promise((resolve) => uploader.on("close", resolve));

    if (uploadCode === 0) {
      let storage_url = null;
      let file_name = null;
      try {
        const parsed = JSON.parse(uploadOutput);
        storage_url = parsed.storage_url;
        file_name = parsed.file_name;
      } catch {}

      log("Upload completed successfully.");
      await updateDbStatus({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        storage_url,
        file_name,
        file_size: stats.size
      });
    }
  } catch (e) {
    log(`ERROR: ${e.message}`);
    await updateDbStatus({
      status: "error",
      error_message: e.message,
      completed_at: new Date().toISOString()
    });
  } finally {
    logStream.end();
    // Clean up local temporary files
    setTimeout(() => {
      try {
        if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
        if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
        console.log("Local temporary files cleaned up.");
      } catch (cleanupError) {
        console.error("Failed to cleanup local files:", cleanupError.message);
      }
    }, 1000); // Small delay to ensure streams are closed
  }
}

run().catch(console.error);

