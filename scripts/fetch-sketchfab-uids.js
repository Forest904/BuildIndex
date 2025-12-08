#!/usr/bin/env node

/**
 * Populate a single Sketchfab UID per brand+category macro bucket into datasets/devices.csv.
 *
 * - Groups rows by normalized `${brand} ${category}` only (no model-specific searches).
 * - Single worker, one request every REQUEST_DELAY_MS.
 * - Logs successful requests and successful writes.
 * - Saves progress to the CSV every time a new UID is written; writes a one-time backup first.
 *
 * NOTE: Run manually.
 */

const fs = require("fs/promises");
const path = require("path");
const { parse } = require("csv-parse/sync");

const CSV_PATH = path.join(process.cwd(), "datasets", "devices.csv");
const BACKUP_PATH = path.join(process.cwd(), "datasets", "devices.backup-sketchfab.csv");
const ENV_PATH = path.join(process.cwd(), ".env");

const REQUEST_DELAY_MS = 5000; // one request every 5 seconds
const RATE_LIMIT_BACKOFF_MS = 5000; // constant backoff on 429s

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEnv(content) {
  const map = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    map[key] = value;
  }
  return map;
}

async function loadToken() {
  if (process.env.SKETCHFAB_TOKEN && process.env.SKETCHFAB_TOKEN.trim()) {
    return process.env.SKETCHFAB_TOKEN.trim();
  }
  try {
    const envRaw = await fs.readFile(ENV_PATH, "utf-8");
    const parsed = parseEnv(envRaw);
    return parsed.SKETCHFAB_TOKEN || "";
  } catch {
    return "";
  }
}

function sanitize(value) {
  return (value || "")
    .replace(/[_\-]+/g, " ")
    .replace(/[(){}\[\]]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function groupKey(device) {
  const brand = (device.brand || "").toLowerCase();
  const category = (device.category || "").toLowerCase();
  return sanitize(`${brand} ${category}`).replace(/\s+/g, " ").trim();
}

function buildQueryFromKey(key) {
  return key; // already "brand category" normalized
}

function serializeCsv(rows, columns) {
  const escape = (value) => {
    if (value === undefined || value === null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [];
  lines.push(columns.join(","));
  for (const row of rows) {
    lines.push(columns.map((col) => escape(row[col])).join(","));
  }
  return lines.join("\n");
}

async function searchSketchfab(query, token) {
  const url = new URL("https://api.sketchfab.com/v3/search");
  url.searchParams.set("type", "models");
  url.searchParams.set("q", query);
  url.searchParams.set("sort_by", "-relevance");

  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!res.ok) {
    const error = new Error(`Sketchfab search failed (${res.status}) for "${query}"`);
    // @ts-ignore
    error.status = res.status;
    throw error;
  }
  const body = await res.json();
  const first = body?.results?.[0];
  return first ? { uid: first.uid, title: first.name } : null;
}

async function main() {
  const token = await loadToken();
  if (!token) {
    console.error("No SKETCHFAB_TOKEN found (.env or env var). Aborting.");
    process.exit(1);
  }

  const raw = await fs.readFile(CSV_PATH, "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  if (!records.length) {
    console.error("No records found in devices.csv");
    process.exit(1);
  }

  const columns = [...Object.keys(records[0])];
  if (!columns.includes("sketchfab_uid")) {
    columns.push("sketchfab_uid");
    for (const r of records) {
      r.sketchfab_uid = "";
    }
  }

  await fs.writeFile(BACKUP_PATH, raw, "utf-8");
  console.log(`Backup created at ${BACKUP_PATH}`);

  // Group by brand + category only.
  const groups = new Map(); // key -> row indexes
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const key = groupKey(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  }

  const cache = new Map(); // key -> uid
  let filled = 0;
  let failures = 0;
  let groupIdx = 0;
  const groupEntries = Array.from(groups.entries());

  const flush = async (reason) => {
    const output = serializeCsv(records, columns);
    await fs.writeFile(CSV_PATH, output, "utf-8");
    console.log(`Write OK: ${reason}`);
  };

  while (groupIdx < groupEntries.length) {
    const [key, rowIndexes] = groupEntries[groupIdx];
    groupIdx += 1;

    // Skip if already populated
    const existingUid = records[rowIndexes[0]].sketchfab_uid && records[rowIndexes[0]].sketchfab_uid.trim();
    if (existingUid) {
      cache.set(key, existingUid);
      continue;
    }

    if (cache.has(key)) {
      const uid = cache.get(key);
      for (const idx of rowIndexes) records[idx].sketchfab_uid = uid;
      if (uid) filled += rowIndexes.length;
      await flush(`cached group ${key} -> ${uid}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const query = buildQueryFromKey(key);
    try {
      const result = await searchSketchfab(query, token);
      const uid = result?.uid || "";
      for (const idx of rowIndexes) records[idx].sketchfab_uid = uid;
      cache.set(key, uid);
      if (uid) filled += rowIndexes.length;
      console.log(`Request OK: ${query} -> ${uid}`);
      await flush(`group ${key} -> ${uid}`);
    } catch (error) {
      if (error && error.status === 429) {
        console.warn(`Rate limited on "${query}". Sleeping ${RATE_LIMIT_BACKOFF_MS}ms...`);
        groupIdx -= 1; // retry same group
        await sleep(RATE_LIMIT_BACKOFF_MS);
        continue;
      }
      failures += 1;
      cache.set(key, "");
      console.warn(`Request failed for "${query}": ${error.message}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  await flush(`final save; filled=${filled}, failures=${failures}`);
  console.log(
    `Done. Added Sketchfab UIDs to ${filled} rows across ${groups.size} groups. Failures/empty: ${failures}. Backup at ${BACKUP_PATH}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
