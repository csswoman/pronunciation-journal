#!/usr/bin/env node
/**
 * Validates Core 1000 word datasets: every word must appear in its
 * `example_sentence` — either verbatim or as a natural inflected form
 * (plural, conjugation, possessive, or known irregular).
 *
 * Usage:
 *   node scripts/validate-core-1000.mjs            # validate all chunks
 *   node scripts/validate-core-1000.mjs --json     # machine-readable output
 *
 * Exit code 0 = clean, 1 = mismatches found (CI-friendly).
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'public', 'core-1000')
const CHUNK_COUNT = 28

// Irregular verbs/nouns whose inflected forms don't share the base spelling.
const IRREGULAR = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being', "'s", "'re", "'m"],
  have: ['has', 'had', 'having', "'ve", "'d"],
  do: ['does', 'did', 'done', 'doing'],
  go: ['goes', 'went', 'gone', 'going'],
  say: ['says', 'said', 'saying'],
  make: ['makes', 'made', 'making'],
  take: ['takes', 'took', 'taken', 'taking'],
  come: ['comes', 'came', 'coming'],
  see: ['sees', 'saw', 'seen', 'seeing'],
  get: ['gets', 'got', 'gotten', 'getting'],
  give: ['gives', 'gave', 'given', 'giving'],
  find: ['finds', 'found', 'finding'],
  think: ['thinks', 'thought', 'thinking'],
  know: ['knows', 'knew', 'known', 'knowing'],
  tell: ['tells', 'told', 'telling'],
  become: ['becomes', 'became', 'becoming'],
  leave: ['leaves', 'left', 'leaving'],
  feel: ['feels', 'felt', 'feeling'],
  bring: ['brings', 'brought', 'bringing'],
  begin: ['begins', 'began', 'begun', 'beginning'],
  keep: ['keeps', 'kept', 'keeping'],
  hold: ['holds', 'held', 'holding'],
  write: ['writes', 'wrote', 'written', 'writing'],
  stand: ['stands', 'stood', 'standing'],
  hear: ['hears', 'heard', 'hearing'],
  let: ['lets', 'letting'],
  mean: ['means', 'meant', 'meaning'],
  set: ['sets', 'setting'],
  meet: ['meets', 'met', 'meeting'],
  run: ['runs', 'ran', 'running'],
  pay: ['pays', 'paid', 'paying'],
  sit: ['sits', 'sat', 'sitting'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  lead: ['leads', 'led', 'leading'],
  read: ['reads', 'reading'], // same spelling for past
  grow: ['grows', 'grew', 'grown', 'growing'],
  lose: ['loses', 'lost', 'losing'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  send: ['sends', 'sent', 'sending'],
  build: ['builds', 'built', 'building'],
  spend: ['spends', 'spent', 'spending'],
  buy: ['buys', 'bought', 'buying'],
  win: ['wins', 'won', 'winning'],
  teach: ['teaches', 'taught', 'teaching'],
  catch: ['catches', 'caught', 'catching'],
  fight: ['fights', 'fought', 'fighting'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  child: ['children'],
  man: ['men'],
  woman: ['women'],
  person: ['people'],
  foot: ['feet'],
  tooth: ['teeth'],
}

/** Generate plausible inflected forms of a base word. */
function inflectedForms(word) {
  const w = word.toLowerCase()
  const forms = new Set([w])

  // Possessive
  forms.add(w + "'s")

  // Regular noun/verb endings
  forms.add(w + 's')
  forms.add(w + 'es')
  forms.add(w + 'ed')
  forms.add(w + 'ing')

  if (w.endsWith('e')) {
    const stem = w.slice(0, -1)
    forms.add(w + 'd') // like -> liked
    forms.add(stem + 'ing') // make -> making
  }
  if (w.endsWith('y') && w.length > 1 && !'aeiou'.includes(w[w.length - 2])) {
    const stem = w.slice(0, -1)
    forms.add(stem + 'ies') // try -> tries
    forms.add(stem + 'ied') // try -> tried
  }
  // Consonant doubling: stop -> stopped/stopping
  const last = w[w.length - 1]
  if (w.length >= 3 && !'aeiou'.includes(last) && 'aeiou'.includes(w[w.length - 2])) {
    forms.add(w + last + 'ed')
    forms.add(w + last + 'ing')
  }

  for (const irr of IRREGULAR[w] ?? []) forms.add(irr)

  return forms
}

/** Tokenize keeping apostrophes (so possessives/contractions survive). */
function tokenize(sentence) {
  return sentence
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter(Boolean)
}

function wordAppears(word, sentence) {
  const tokens = tokenize(sentence)
  const forms = inflectedForms(word)
  return tokens.some((t) => forms.has(t) || forms.has(t.replace(/'s$/, '')))
}

function main() {
  const jsonOutput = process.argv.includes('--json')
  const issues = []
  let total = 0

  for (let i = 1; i <= CHUNK_COUNT; i++) {
    const n = String(i).padStart(3, '0')
    const path = join(DATA_DIR, `words-${n}.json`)
    if (!existsSync(path)) {
      console.error(`⚠️  Missing chunk: words-${n}.json`)
      continue
    }
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    const entries = raw.entries ?? raw
    for (const e of entries) {
      total++
      const sentence = e.example_sentence ?? ''
      if (!e.word) {
        issues.push({ file: n, rank: e.rank, word: e.word, sentence, reason: 'missing word' })
        continue
      }
      if (!sentence.trim()) {
        issues.push({ file: n, rank: e.rank, word: e.word, sentence, reason: 'empty sentence' })
        continue
      }
      if (!wordAppears(e.word, sentence)) {
        issues.push({ file: n, rank: e.rank, word: e.word, sentence, reason: 'word not in sentence' })
      }
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ total, issueCount: issues.length, issues }, null, 2))
  } else if (issues.length === 0) {
    console.log(`✓ ${total} entries validated — no mismatches found.`)
  } else {
    console.error(`✗ ${issues.length} mismatch(es) of ${total} entries:\n`)
    for (const it of issues) {
      console.error(`  [words-${it.file}.json #${it.rank}] "${it.word}" — ${it.reason}`)
      console.error(`      ${it.sentence}`)
    }
  }

  process.exit(issues.length > 0 ? 1 : 0)
}

main()
