// Applies the reviewed Essential Words study pilot to its canonical chunk files
// and rebuilds the client aggregate. Safe to run repeatedly.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../public/essential-words");
const pilotPath = path.join(here, "data/study-pilot.json");
const batchPath = path.join(here, "data/function-words-batch-001.json");
const correctionsPath = path.join(here, "data/function-words-batch-001-corrections.json");
const pilot = JSON.parse(fs.readFileSync(pilotPath, "utf8"));
const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
const corrections = JSON.parse(fs.readFileSync(correctionsPath, "utf8"));
const byWord = new Map();
for (const entry of [...pilot.entries, ...batch.entries, ...corrections.entries]) {
  const key = entry.word.toLowerCase();
  const previous = byWord.get(key);
  const study = { ...previous?.study, ...entry.study };
  for (const [field, value] of Object.entries(study)) if (value === null) delete study[field];
  byWord.set(key, { ...previous, ...entry, study });
}
const excludedWords = new Set((pilot.exclusions ?? []).map((entry) => entry.word.toLowerCase()));
const all = [];
let applied = 0;

for (let n = 1; ; n += 1) {
  const file = path.join(outDir, `words-${String(n).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) break;
  const chunk = JSON.parse(fs.readFileSync(file, "utf8"));
  let changed = false;
  for (const entry of chunk.entries) {
    const pilotEntry = byWord.get(entry.word.toLowerCase());
    if (pilotEntry) {
      entry.study = pilotEntry.study;
      if (pilotEntry.teachWith) entry.teachWith = pilotEntry.teachWith;
      applied += 1;
      changed = true;
    }
    if (excludedWords.has(entry.word.toLowerCase()) && entry.study) {
      delete entry.study;
      delete entry.teachWith;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, `${JSON.stringify(chunk, null, 2)}\n`);
  all.push(...chunk.entries);
}

if (applied !== byWord.size) {
  throw new Error(`Pilot mismatch: applied ${applied} of ${byWord.size} authored entries.`);
}
fs.writeFileSync(path.join(outDir, "words-all.json"), `${JSON.stringify({ version: 1, entries: all }, null, 2)}\n`);
console.log(`Applied ${applied} study-pilot entries and rebuilt words-all.json.`);
