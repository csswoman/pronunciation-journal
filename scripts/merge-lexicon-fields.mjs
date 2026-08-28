// Fusiona la salida de Antigravity en public/lexicon/*.json.
// Uso:
//   node scripts/merge-lexicon-fields.mjs ipa          --dry
//   node scripts/merge-lexicon-fields.mjs ipa
//   node scripts/merge-lexicon-fields.mjs translation  --dry
//
// Lee tmp/lexicon-gaps/filled-<campo>.json (rutas relativas al root del repo).
// Ver plans/078-lexicon-field-generation-prompt.md para el prompt generador.
//
// Solo rellena campos VACÍOS. Nunca sobrescribe un valor existente.
// Revisa el diff con `git diff public/lexicon/` antes de commitear.

import fs from 'node:fs';
import path from 'node:path';

const field = process.argv[2];
const dry = process.argv.includes('--dry');

if (field !== 'ipa' && field !== 'translation') {
  console.error('Uso: node merge.mjs <ipa|translation> [--dry]');
  process.exit(1);
}

const GAPS = 'tmp/lexicon-gaps';
const DIR = 'public/lexicon';
const inFile = path.join(GAPS, `filled-${field}.json`);

if (!fs.existsSync(inFile)) {
  console.error(`No existe ${inFile}. Genera primero la salida de Antigravity.`);
  process.exit(1);
}

const filled = JSON.parse(fs.readFileSync(inFile, 'utf8'));
if (!Array.isArray(filled)) {
  console.error('El archivo debe ser un array JSON.');
  process.exit(1);
}

// ── Validación previa ────────────────────────────────────────────────────────
const errors = [];
const byId = new Map();

for (const [i, row] of filled.entries()) {
  if (!row || typeof row.id !== 'string') {
    errors.push(`[${i}] falta 'id'`);
    continue;
  }
  const val = row[field];
  if (typeof val !== 'string' || !val.trim()) {
    errors.push(`[${i}] ${row.id}: '${field}' vacío o no es string`);
    continue;
  }
  if (field === 'ipa') {
    if (!/^\/.+\/$/.test(val)) errors.push(`${row.id}: IPA sin barras -> ${val}`);
    if (/[ˈˌ.]/.test(val)) errors.push(`${row.id}: IPA con acento o punto -> ${val}`);
    if (/ə/.test(val)) errors.push(`${row.id}: usa 'ə' en vez de 'ʌ' -> ${val}`);
  }
  if (field === 'translation' && val.length > 40) {
    errors.push(`${row.id}: traducción larga (${val.length}) -> ${val}`);
  }
  byId.set(row.id, val);
}

if (errors.length) {
  console.error(`\n${errors.length} problema(s) de formato:\n`);
  console.error(errors.slice(0, 30).join('\n'));
  if (errors.length > 30) console.error(`… y ${errors.length - 30} más`);
  console.error('\nCorrige la salida antes de fusionar. Nada fue modificado.');
  process.exit(1);
}

// ── Fusión ───────────────────────────────────────────────────────────────────
let applied = 0;
let skippedExisting = 0;
const unused = new Set(byId.keys());
const perFile = {};

for (const f of fs.readdirSync(DIR)) {
  if (f === 'index.json' || !f.endsWith('.json')) continue;
  const p = path.join(DIR, f);
  const words = JSON.parse(fs.readFileSync(p, 'utf8'));
  let touched = 0;

  for (const w of words) {
    const val = byId.get(w.id);
    if (val === undefined) continue;
    unused.delete(w.id);
    if (w[field]) { skippedExisting++; continue; }
    w[field] = val;
    touched++;
  }

  if (touched > 0) {
    perFile[f] = touched;
    applied += touched;
    if (!dry) fs.writeFileSync(p, JSON.stringify(words, null, 2) + '\n', 'utf8');
  }
}

console.log(dry ? '\n=== DRY RUN (nada escrito) ===\n' : '\n=== FUSIONADO ===\n');
for (const [f, n] of Object.entries(perFile)) console.log(`  ${f.padEnd(28)} ${n}`);
console.log(`\n  aplicados        : ${applied}`);
console.log(`  ya tenían valor  : ${skippedExisting}`);
console.log(`  ids sin destino  : ${unused.size}`);
if (unused.size) console.log('    ' + [...unused].slice(0, 15).join(', '));
if (!dry) console.log('\nRevisa: git diff public/lexicon/');
