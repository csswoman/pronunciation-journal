#!/usr/bin/env node
/**
 * Dexie ⇄ Zustand state duplication audit (warning only).
 * Hard rule (CLAUDE.md): "Zustand = ephemeral UI state only", "Never
 * duplicate state between Dexie and Zustand".
 *
 * This is a heuristic, not a proof: it flags things worth a human look,
 * it never blocks CI. Two signals:
 *   1. A Zustand store uses the `persist` middleware — persistence usually
 *      means the data has outgrown "ephemeral UI state" and belongs in
 *      Dexie/Supabase instead. Allowlisted where persistence is itself a
 *      UI preference (not domain data).
 *   2. A Zustand store's state field names overlap with a Dexie table name
 *      — possible sign the same domain is tracked in both places.
 *
 * Run: npm run audit:state-duplication
 * Always exits 0.
 */

import { readFileSync, readdirSync } from "fs";
import { join, extname, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const STORES_DIR = join(ROOT, "lib", "stores");
const DEXIE_SCHEMA_FILE = join(ROOT, "lib", "db", "index.ts");

/**
 * Stores where `persist` is a deliberate, reviewed choice because the state
 * is a device-local UI preference, not domain data synced via Dexie/Supabase.
 */
const PERSIST_ALLOWLIST = new Set(["uiSoundsStore.ts"]);

function readDexieTableNames() {
  if (!readdirSync) return new Set();
  let source;
  try {
    source = readFileSync(DEXIE_SCHEMA_FILE, "utf8");
  } catch {
    return new Set();
  }
  const tables = new Set();
  for (const match of source.matchAll(/this\.version\(\d+\)\.stores\(\{([\s\S]*?)\}\);/g)) {
    const block = match[1];
    for (const fieldMatch of block.matchAll(/(\w+):\s*["'`]/g)) {
      tables.add(fieldMatch[1]);
    }
  }
  return tables;
}

function readStoreStateFields(source) {
  // Matches the `interface XState { ... }` or `type XState = { ... }` block,
  // pulling out field names (skip ones that look like methods: `foo: (`).
  const fields = new Set();
  const interfaceMatch = source.match(/interface\s+\w+State\s*\{([\s\S]*?)\n\}/);
  const block = interfaceMatch?.[1];
  if (!block) return fields;
  for (const line of block.split("\n")) {
    const fieldMatch = line.match(/^\s*(\w+)\s*[?:]?\s*:\s*(.+)$/);
    if (!fieldMatch) continue;
    const [, name, rest] = fieldMatch;
    const isMethod = /=>|\([^)]*\)\s*=>/.test(rest) || rest.trim().startsWith("(");
    if (!isMethod) fields.add(name);
  }
  return fields;
}

function normalize(name) {
  return name.toLowerCase().replace(/[_-]/g, "");
}

const dexieTables = readDexieTableNames();
const normalizedDexieTables = new Map([...dexieTables].map((t) => [normalize(t), t]));

const warnings = [];

let storeFiles = [];
try {
  storeFiles = readdirSync(STORES_DIR).filter((f) => extname(f) === ".ts");
} catch {
  // lib/stores doesn't exist — nothing to audit.
}

for (const file of storeFiles) {
  const filePath = join(STORES_DIR, file);
  const relPath = relative(ROOT, filePath).replace(/\\/g, "/");
  const source = readFileSync(filePath, "utf8");

  const usesPersist = /from\s+["']zustand\/middleware["'][\s\S]*?persist\(|persist\(\s*\n?\s*\(set/.test(source) &&
    /\bpersist\(/.test(source);
  if (usesPersist && !PERSIST_ALLOWLIST.has(file)) {
    warnings.push(
      `${relPath}: uses persist() middleware. Confirm this is a device-local UI preference, not domain data — persistent domain state belongs in Dexie/Supabase.`,
    );
  }

  const stateFields = readStoreStateFields(source);
  for (const field of stateFields) {
    const normalized = normalize(field);
    const dexieMatch = normalizedDexieTables.get(normalized);
    if (dexieMatch) {
      warnings.push(
        `${relPath}: field "${field}" shares a name with Dexie table "${dexieMatch}". Verify this isn't the same domain data duplicated in both stores.`,
      );
    }
  }
}

if (warnings.length === 0) {
  console.log("State duplication audit: no Dexie/Zustand overlap detected.");
  process.exit(0);
}

console.warn("State duplication audit warnings (heuristic, non-blocking):");
for (const w of warnings) {
  console.warn(`- ${w}`);
}
process.exit(0);
