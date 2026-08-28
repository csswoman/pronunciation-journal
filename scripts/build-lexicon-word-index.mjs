// Generates public/lexicon/word-index.json: a compact `{ wordId: categoryId[] }`
// map used client-side to resolve word_bank.source_ref -> category, without
// fetching the full ~340KB of per-category word data.
//
// Regenerate whenever public/lexicon/*.json content changes:
//   node scripts/build-lexicon-word-index.mjs
//
// A word id can appear in more than one category (e.g. "etl" in both
// backend-infra and data-science) — every occurrence is kept.

import fs from 'node:fs';
import path from 'node:path';

const DIR = 'public/lexicon';
const OUT = path.join(DIR, 'word-index.json');

const index = {};

for (const f of fs.readdirSync(DIR)) {
  if (f === 'index.json' || f === 'word-index.json' || !f.endsWith('.json')) continue;
  const categoryId = f.slice(0, -'.json'.length);
  const words = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));

  for (const w of words) {
    if (!w?.id) continue;
    (index[w.id] ??= []).push(categoryId);
  }
}

fs.writeFileSync(OUT, JSON.stringify(index) + '\n', 'utf8');

const total = Object.keys(index).length;
const dupes = Object.values(index).filter((cats) => cats.length > 1).length;
console.log(`Wrote ${OUT}: ${total} word ids (${dupes} in more than one category)`);
