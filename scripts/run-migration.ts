/** @type {import('ts-node')} */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runSQL() {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
        console.error("SUPABASE_DB_URL is not set.");
        process.exit(1);
    }
    
    // Disable SSL constraint for Supabase direct connection if needed, though usually ?sslmode=require is enough
    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, '../supabase/migrations/20260313180554_create_weekly_vault.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        
        console.log("Executing migration SQL...");
        await client.query(sqlScript);
        console.log("Migration executed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runSQL();
