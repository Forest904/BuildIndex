#!/usr/bin/env node

/**
 * Fill missing sketchfab_uid values with a generic UID per broad category (laptop / phone / tablet).
 *
 * - Reads datasets/devices.csv, ensures sketchfab_uid column.
 * - Only touches rows that still lack a UID.
 * - Canonicalizes categories to one of: laptop, phone, tablet, or device (fallback).
 * - One request per canonical category; first Sketchfab result is used for all rows in that category.
 * - Pacing: one request every 5 seconds; 5s backoff on 429.
 * - Writes a one-time backup, then writes the CSV after each successful category fill and logs requests/writes.
 *
 * NOTE: Run manually. Requires SKETCHFAB_TOKEN in env or .env.
 */

const fs = require("fs/promises");
const path = require("path");
const { parse } = require("csv-parse/sync");

const CSV_PATH = path.join(process.cwd(), "datasets", "devices.csv");
const BACKUP_PATH = path.join(process.cwd(), "datasets", "devices.backup-generic-sketchfab.csv");
const ENV_PATH = path.join(process.cwd(), ".env");

const REQUEST_DELAY_MS = 5000;
const RATE_LIMIT_BACKOFF_MS = 5000;

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

function canonicalCategory(value) {
  const c = (value || "").toLowerCase();
  if (/laptop|notebook/.test(c)) return "laptop";
  if (/phone|smartphone/.test(c)) return "phone";
  if (/tablet|tab/.test(c)) return "tablet";
  return "device";
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
    headers: { Authorization: `Token ${token}` },
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
    for (const r of records) r.sketchfab_uid = "";
  }

  await fs.writeFile(BACKUP_PATH, raw, "utf-8");
  console.log(`Backup created at ${BACKUP_PATH}`);

  // Collect canonical categories with missing UIDs only.
  const categories = new Map(); // canonical -> row indexes missing UID
  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i];
    const hasUid = rec.sketchfab_uid && rec.sketchfab_uid.trim();
    if (hasUid) continue;
    const key = canonicalCategory(rec.category);
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key).push(i);
  }

  const categoryEntries = Array.from(categories.entries());
  let filled = 0;
  let failures = 0;

  const flush = async (reason) => {
    const output = serializeCsv(records, columns);
    await fs.writeFile(CSV_PATH, output, "utf-8");
    console.log(`Write OK: ${reason}`);
  };

  for (let idx = 0; idx < categoryEntries.length; idx += 1) {
    const [key, rowIndexes] = categoryEntries[idx];
    const query = key || "device";

    try {
      const result = await searchSketchfab(query, token);
      const uid = result?.uid || "";
      for (const rowIdx of rowIndexes) records[rowIdx].sketchfab_uid = uid;
      if (uid) filled += rowIndexes.length;
      console.log(`Request OK: ${query} -> ${uid}`);
      await flush(`category ${query} -> ${uid}`);
    } catch (error) {
      if (error && error.status === 429) {
        console.warn(`Rate limited on "${query}". Sleeping ${RATE_LIMIT_BACKOFF_MS}ms...`);
        idx -= 1; // retry same category
        await sleep(RATE_LIMIT_BACKOFF_MS);
        continue;
      }
      failures += 1;
      console.warn(`Request failed for "${query}": ${error.message}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  await flush(`final save; filled=${filled}, failures=${failures}`);
  console.log(
    `Done. Filled ${filled} rows across ${categoryEntries.length} canonical categories missing UIDs. Failures/empty: ${failures}. Backup at ${BACKUP_PATH}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
