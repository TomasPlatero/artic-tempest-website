#!/usr/bin/env node
/* Upload a file to Supabase Storage using the REST API with service key. */
const fs = require("fs");
const path = require("path");
// Native fetch is available in Node 18+

const storageBase = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "backups";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const destPath = process.argv[2] || "";
const localPath = process.argv[3] || "";

if (!storageBase || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}
if (!destPath || !localPath) {
  console.error("Usage: node upload-to-storage.js <destPath> <localFilePath>");
  process.exit(1);
}

async function run() {
  try {
    const fileBuffer = await fs.promises.readFile(localPath);
    const url = `${storageBase}/storage/v1/object/${bucket}/${destPath}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Upload failed: ${res.status} ${text}`);
      process.exit(2);
    }
    const info = {
      storage_url: `${storageBase}/storage/v1/object/${bucket}/${destPath}`,
      file_name: path.basename(destPath),
    };
    console.log(JSON.stringify(info));
  } catch (e) {
    console.error("Upload error", e.message);
    process.exit(3);
  }
}

run();
