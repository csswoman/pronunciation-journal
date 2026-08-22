import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const DIR = path.join(ROOT, "public", "essential-words");
const OUT = path.join(DIR, "catalog-index.json");

export function readChunkEntriesWithChunkIndex(dir = DIR) {
  const entries = [];
  for (let n = 1; ; n++) {
    const file = path.join(dir, `words-${String(n).padStart(3, "0")}.json`);
    if (!fs.existsSync(file)) break;
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
    for (const entry of parsed.entries ?? []) {
      entries.push({ ...entry, chunk: n });
    }
  }
  return entries;
}

export function buildCatalogIndex(entries) {
  return {
    version: 1,
    entries: entries.map((e) => [
      e.rank,
      e.word,
      e.pos,
      e.cefr_level,
      e.chunk,
      e.ipa_strong ?? "",
      e.ipa_weak ?? "",
    ]),
  };
}

function main() {
  const entries = readChunkEntriesWithChunkIndex();
  if (entries.length === 0) {
    console.error("[essential-words] no chunks found — nothing to generate");
    process.exit(1);
  }

  const index = buildCatalogIndex(entries);
  fs.writeFileSync(OUT, `${JSON.stringify(index)}\n`);

  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`[essential-words] wrote catalog-index.json — ${index.entries.length} entries, ${kb} KB`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("generate-catalog-index.mjs")) {
  main();
}
