#!/usr/bin/env node
/* Create a Supabase storage bucket if it doesn't exist. */
const fetch = (...args) =>
  import("node-fetch").then((r) => r.default.apply(null, args));
const path = require("path");
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "backups";
const base = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error("Missing SUPABASE URL or SERVICE ROLE KEY");
  process.exit(1);
}
async function run() {
  try {
    const url = `${base}/storage/v1/buckets`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
    });
    const buckets = res.ok ? await res.json() : [];
    if (Array.isArray(buckets) && buckets.find((b) => b.name === bucket)) {
      console.log(JSON.stringify({ bucket: bucket, exists: true }));
      process.exit(0);
    }
    // Create bucket
    const createRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: bucket, public: false }),
    });
    if (!createRes.ok) {
      const text = await createRes.text();
      console.error("Bucket create failed:", createRes.status, text);
      process.exit(2);
    }
    console.log(JSON.stringify({ bucket: bucket, created: true }));
  } catch (e) {
    console.error("Bucket creation error", e?.message ?? e);
    process.exit(3);
  }
}
run();
