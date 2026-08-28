// Normaliza `ipa` y `translation` en public/lexicon/*.json a la convención del corpus.
//
// Uso:
//   node scripts/normalize-lexicon-fields.mjs --dry
//   node scripts/normalize-lexicon-fields.mjs
//
// Convención IPA del corpus (derivada de CMUdict, no IPA académico):
//   - envuelto en /…/
//   - sin marcas de acento (ˈ ˌ) ni puntos silábicos
//   - schwa como `ʌ`, no `ə`
//   - General American, no RP  →  ɒ→ɑ, əʊ→oʊ, ɜː→ɜr
//
// Convención translation: primera letra en mayúscula, sin punto final.
//
// Solo reescribe valores que se desvían. Idempotente.

import fs from 'node:fs';
import path from 'node:path';

const DIR = 'public/lexicon';
const dry = process.argv.includes('--dry');

/** RP → General American, antes de colapsar la schwa. */
const RP_TO_GA = [
  [/ɒ/g, 'ɑ'],
  [/əʊ/g, 'oʊ'],
  [/ɜː/g, 'ɜr'],
  [/ɑː/g, 'ɑ'],
  [/ɔː/g, 'ɔ'],
];

function normalizeIpa(raw) {
  let s = raw.trim();
  const hadSlashes = s.startsWith('/') && s.endsWith('/');
  if (hadSlashes) s = s.slice(1, -1);

  for (const [re, to] of RP_TO_GA) s = s.replace(re, to);

  s = s
    .replace(/[ˈˌ]/g, '')   // marcas de acento
    .replace(/\./g, '')     // separación silábica
    .replace(/ə/g, 'ʌ')     // schwa al estilo del corpus
    .replace(/\s+/g, ' ')
    .trim();

  return `/${s}/`;
}

function normalizeTranslation(raw) {
  let s = raw.trim().replace(/\.+$/, '');
  if (s) s = s[0].toUpperCase() + s.slice(1);
  return s;
}

let ipaFixed = 0;
let trFixed = 0;
const samples = { ipa: [], translation: [] };

for (const f of fs.readdirSync(DIR)) {
  if (f === 'index.json' || !f.endsWith('.json')) continue;
  const p = path.join(DIR, f);
  const words = JSON.parse(fs.readFileSync(p, 'utf8'));
  let touched = false;

  for (const w of words) {
    if (typeof w.ipa === 'string' && w.ipa) {
      const next = normalizeIpa(w.ipa);
      if (next !== w.ipa) {
        if (samples.ipa.length < 10) samples.ipa.push(`${w.word}: ${w.ipa} → ${next}`);
        w.ipa = next;
        ipaFixed++;
        touched = true;
      }
    }
    if (typeof w.translation === 'string' && w.translation) {
      const next = normalizeTranslation(w.translation);
      if (next !== w.translation) {
        if (samples.translation.length < 10) {
          samples.translation.push(`${w.word}: "${w.translation}" → "${next}"`);
        }
        w.translation = next;
        trFixed++;
        touched = true;
      }
    }
  }

  if (touched && !dry) fs.writeFileSync(p, JSON.stringify(words, null, 2) + '\n', 'utf8');
}

console.log(dry ? '\n=== DRY RUN (nada escrito) ===\n' : '\n=== NORMALIZADO ===\n');
console.log(`  ipa corregidos         : ${ipaFixed}`);
samples.ipa.forEach((s) => console.log(`      ${s}`));
console.log(`  translation corregidas : ${trFixed}`);
samples.translation.forEach((s) => console.log(`      ${s}`));
if (trFixed > 10) console.log(`      … y ${trFixed - 10} más`);
