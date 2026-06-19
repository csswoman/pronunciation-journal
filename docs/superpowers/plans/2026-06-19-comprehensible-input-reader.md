# Comprehensible Input Reader — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensible-input reader that shows i+1 paragraphs recycling the learner's recent SRS vocabulary, with light comprehension questions, reachable both as a daily-plan step and a standalone `/practice/reader` page.

**Architecture:** Pure helpers (target selection, morphological variant expansion, refinement validation) feed an online `/api/gemini/generate-reader` route. Generated passages persist to Supabase (`reader_passages`, RLS) mirrored in Dexie for offline reading. A new `reader` exercise type renders text + on-demand TTS + a `multiple_choice` comprehension widget. Comprehension records *exposure* (a dedicated `exposure` sub-object on the Dexie SRS record) — never an SM-2 grade — keeping passive exposure structurally separate from active recall.

**Tech Stack:** Next.js route handler, `@google/genai` with flash-lite→flash→latest fallback, Zod validation, Supabase + RLS, Dexie v13, Vitest.

Spec: [docs/superpowers/specs/2026-06-19-comprehensible-input-reader-design.md](../specs/2026-06-19-comprehensible-input-reader-design.md)

---

## File Structure

| Path | Responsibility |
|---|---|
| `lib/practice/reader/irregular-forms.ts` | Static map of ~150 high-frequency irregular base→forms (A2-B1) |
| `lib/practice/reader/variants.ts` | Expand a target word to its accepted surface variants (table-first, then suffix rules) |
| `lib/practice/reader/refinement.ts` | Validate a passage embeds ≥60% of targets (word-boundary matching) |
| `lib/practice/reader/target-hash.ts` | Stable hash of an ordered target set |
| `lib/practice/reader/select-targets.ts` | Pick 5-8 `learning`/`review` SRS items; `null` if <3 |
| `lib/practice/reader/exposure.ts` | `recordReaderExposure` — write `exposure` sub-object on `srsData` |
| `lib/practice/reader/queries.ts` | Supabase + Dexie read/write of `reader_passages` |
| `lib/practice/reader/types.ts` | `ReaderPassage`, `ReaderQuestion` shared types |
| `lib/ai-prompts.ts` (modify) | `GENERATE_READER_SYSTEM_PROMPT` + `buildGenerateReaderUserPrompt` |
| `app/api/gemini/generate-reader/route.ts` | Online generation with fallback + refinement gate |
| `lib/practice/daily-plan/async-step-builders.ts` (modify) | `buildReaderStep` (stale-while-revalidate) |
| `components/practice/reader/ReaderExercise.tsx` | Passage + on-demand TTS + comprehension MC |
| `app/practice/reader/page.tsx` | Standalone Reading entry |
| `lib/db/index.ts` (modify) | Dexie v13: `readerPassages` table; extend `SRSData` |
| `lib/types.ts` (modify) | Add `exposure?` to `SRSData` |
| `supabase/migrations/*_reader_passages.sql` | Table + RLS + index |

---

### Task 1: Irregular-forms table + variant expansion

**Files:**
- Create: `lib/practice/reader/irregular-forms.ts`
- Create: `lib/practice/reader/variants.ts`
- Test: `lib/practice/reader/__tests__/variants.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/practice/reader/__tests__/variants.test.ts
import { describe, it, expect } from 'vitest'
import { expandVariants } from '../variants'

describe('expandVariants', () => {
  it('includes the exact lowercased base form', () => {
    expect(expandVariants('study')).toContain('study')
  })

  it('generates regular suffix variants', () => {
    const v = expandVariants('study')
    expect(v).toEqual(expect.arrayContaining(['studies', 'studied', 'studying']))
  })

  it('handles consonant doubling for -ed/-ing', () => {
    const v = expandVariants('stop')
    expect(v).toEqual(expect.arrayContaining(['stops', 'stopped', 'stopping']))
  })

  it('drops trailing e before -ing', () => {
    expect(expandVariants('make')).toEqual(expect.arrayContaining(['makes', 'making']))
  })

  it('uses the irregular table when the base is irregular', () => {
    const v = expandVariants('go')
    expect(v).toEqual(expect.arrayContaining(['go', 'goes', 'went', 'gone', 'going']))
  })

  it('handles irregular plurals', () => {
    expect(expandVariants('child')).toEqual(expect.arrayContaining(['child', 'children']))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/reader/__tests__/variants.test.ts`
Expected: FAIL — cannot find module `../variants`.

- [ ] **Step 3: Write the irregular table**

```typescript
// lib/practice/reader/irregular-forms.ts
/**
 * High-frequency English irregulars (A2-B1). base → every accepted surface form
 * (including the base). Consulted before suffix rules in variant expansion so
 * irregular targets aren't spuriously rejected by word-boundary matching.
 * Not exhaustive — covers the ~150 forms a learner at this level actually meets.
 */
export const IRREGULAR_FORMS: Record<string, string[]> = {
  go: ['go', 'goes', 'went', 'gone', 'going'],
  buy: ['buy', 'buys', 'bought', 'buying'],
  run: ['run', 'runs', 'ran', 'running'],
  child: ['child', 'children'],
  person: ['person', 'people'],
  man: ['man', 'men'],
  woman: ['woman', 'women'],
  foot: ['foot', 'feet'],
  tooth: ['tooth', 'teeth'],
  be: ['be', 'is', 'am', 'are', 'was', 'were', 'been', 'being'],
  have: ['have', 'has', 'had', 'having'],
  do: ['do', 'does', 'did', 'done', 'doing'],
  say: ['say', 'says', 'said', 'saying'],
  make: ['make', 'makes', 'made', 'making'],
  take: ['take', 'takes', 'took', 'taken', 'taking'],
  come: ['come', 'comes', 'came', 'coming'],
  see: ['see', 'sees', 'saw', 'seen', 'seeing'],
  know: ['know', 'knows', 'knew', 'known', 'knowing'],
  get: ['get', 'gets', 'got', 'gotten', 'getting'],
  give: ['give', 'gives', 'gave', 'given', 'giving'],
  find: ['find', 'finds', 'found', 'finding'],
  think: ['think', 'thinks', 'thought', 'thinking'],
  tell: ['tell', 'tells', 'told', 'telling'],
  become: ['become', 'becomes', 'became', 'becoming'],
  leave: ['leave', 'leaves', 'left', 'leaving'],
  feel: ['feel', 'feels', 'felt', 'feeling'],
  bring: ['bring', 'brings', 'brought', 'bringing'],
  begin: ['begin', 'begins', 'began', 'begun', 'beginning'],
  keep: ['keep', 'keeps', 'kept', 'keeping'],
  hold: ['hold', 'holds', 'held', 'holding'],
  write: ['write', 'writes', 'wrote', 'written', 'writing'],
  stand: ['stand', 'stands', 'stood', 'standing'],
  hear: ['hear', 'hears', 'heard', 'hearing'],
  let: ['let', 'lets', 'letting'],
  mean: ['mean', 'means', 'meant', 'meaning'],
  meet: ['meet', 'meets', 'met', 'meeting'],
  pay: ['pay', 'pays', 'paid', 'paying'],
  sit: ['sit', 'sits', 'sat', 'sitting'],
  speak: ['speak', 'speaks', 'spoke', 'spoken', 'speaking'],
  lose: ['lose', 'loses', 'lost', 'losing'],
  send: ['send', 'sends', 'sent', 'sending'],
  build: ['build', 'builds', 'built', 'building'],
  understand: ['understand', 'understands', 'understood', 'understanding'],
  draw: ['draw', 'draws', 'drew', 'drawn', 'drawing'],
  break: ['break', 'breaks', 'broke', 'broken', 'breaking'],
  eat: ['eat', 'eats', 'ate', 'eaten', 'eating'],
  fall: ['fall', 'falls', 'fell', 'fallen', 'falling'],
  drive: ['drive', 'drives', 'drove', 'driven', 'driving'],
  read: ['read', 'reads', 'reading'],
  wear: ['wear', 'wears', 'wore', 'worn', 'wearing'],
  sleep: ['sleep', 'sleeps', 'slept', 'sleeping'],
  win: ['win', 'wins', 'won', 'winning'],
  sing: ['sing', 'sings', 'sang', 'sung', 'singing'],
  swim: ['swim', 'swims', 'swam', 'swum', 'swimming'],
  fly: ['fly', 'flies', 'flew', 'flown', 'flying'],
  catch: ['catch', 'catches', 'caught', 'catching'],
  teach: ['teach', 'teaches', 'taught', 'teaching'],
  // …extend toward ~150 high-frequency A2-B1 forms as content grows.
}
```

- [ ] **Step 4: Write the variant expander**

```typescript
// lib/practice/reader/variants.ts
import { IRREGULAR_FORMS } from './irregular-forms'

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

/** Lowercased surface variants accepted for `target` (table-first, then regular suffix rules). */
export function expandVariants(target: string): string[] {
  const base = target.trim().toLowerCase()
  if (!base) return []

  const irregular = IRREGULAR_FORMS[base]
  if (irregular) return Array.from(new Set([base, ...irregular]))

  const out = new Set<string>([base])

  // plural / 3rd person
  if (/(s|x|z|ch|sh)$/.test(base)) out.add(base + 'es')
  else if (/[^aeiou]y$/.test(base)) out.add(base.slice(0, -1) + 'ies')
  else out.add(base + 's')

  // past / participle (regular)
  if (base.endsWith('e')) out.add(base + 'd')
  else if (/[^aeiou]y$/.test(base)) out.add(base.slice(0, -1) + 'ied')
  else if (isCvc(base)) out.add(base + base[base.length - 1] + 'ed')
  else out.add(base + 'ed')

  // gerund
  if (base.endsWith('e') && !base.endsWith('ee')) out.add(base.slice(0, -1) + 'ing')
  else if (isCvc(base)) out.add(base + base[base.length - 1] + 'ing')
  else out.add(base + 'ing')

  return Array.from(out)
}

/** Consonant-vowel-consonant ending (triggers final-consonant doubling). */
function isCvc(w: string): boolean {
  if (w.length < 3) return false
  const [a, b, c] = [w[w.length - 3], w[w.length - 2], w[w.length - 1]]
  return !VOWELS.has(a) && VOWELS.has(b) && !VOWELS.has(c) && !['w', 'x', 'y'].includes(c)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test lib/practice/reader/__tests__/variants.test.ts`
Expected: PASS (all 6).

- [ ] **Step 6: Commit**

```bash
git add lib/practice/reader/irregular-forms.ts lib/practice/reader/variants.ts lib/practice/reader/__tests__/variants.test.ts
git commit -m "feat(reader): morphological variant expansion with irregular table"
```

---

### Task 2: Target refinement validation

**Files:**
- Create: `lib/practice/reader/refinement.ts`
- Test: `lib/practice/reader/__tests__/refinement.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/practice/reader/__tests__/refinement.test.ts
import { describe, it, expect } from 'vitest'
import { passageEmbedsTargets } from '../refinement'

describe('passageEmbedsTargets', () => {
  it('rejects substring false positives', () => {
    // "cat" must NOT match inside "category"
    expect(passageEmbedsTargets('I study a category today.', ['cat'])).toBe(false)
  })

  it('matches on word boundary', () => {
    expect(passageEmbedsTargets('The cat sleeps.', ['cat'])).toBe(true)
  })

  it('accepts regular inflected forms', () => {
    expect(passageEmbedsTargets('She stopped here.', ['stop'])).toBe(true)
    expect(passageEmbedsTargets('Two cities grew.', ['city'])).toBe(true)
  })

  it('accepts irregular forms via the table', () => {
    expect(passageEmbedsTargets('He went home.', ['go'])).toBe(true)
    expect(passageEmbedsTargets('The children played.', ['child'])).toBe(true)
  })

  it('passes when at least 60% of targets appear', () => {
    // 3 of 5 = 60%
    const p = 'The cat ran and the dog slept.'
    expect(passageEmbedsTargets(p, ['cat', 'run', 'dog', 'fish', 'bird'])).toBe(true)
  })

  it('fails below the 60% threshold', () => {
    // 2 of 5 = 40%
    const p = 'The cat ran.'
    expect(passageEmbedsTargets(p, ['cat', 'run', 'dog', 'fish', 'bird'])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/reader/__tests__/refinement.test.ts`
Expected: FAIL — cannot find module `../refinement`.

- [ ] **Step 3: Write the refinement**

```typescript
// lib/practice/reader/refinement.ts
import { expandVariants } from './variants'

const THRESHOLD = 0.6

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * True if `passage` embeds at least 60% of `targets`, matching each target by
 * any of its surface variants on a word boundary (never substring).
 *
 * Algorithm (mirrored by the test):
 *  1. normalize passage: lowercase, NFC, collapse whitespace.
 *  2. expand each target to its variant set (table-first, then suffix rules).
 *  3. a target matches if ANY variant matches /\bvariant\b/ in the passage.
 *  4. count matched targets.
 *  5. matched / total >= 0.6 → valid.
 */
export function passageEmbedsTargets(passage: string, targets: string[]): boolean {
  if (targets.length === 0) return true
  const normalized = passage.normalize('NFC').toLowerCase().replace(/\s+/g, ' ')

  let matched = 0
  for (const target of targets) {
    const variants = expandVariants(target)
    const hit = variants.some((v) =>
      new RegExp(`\\b${escapeRegExp(v)}\\b`).test(normalized),
    )
    if (hit) matched++
  }
  return matched / targets.length >= THRESHOLD
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/practice/reader/__tests__/refinement.test.ts`
Expected: PASS (all 6).

- [ ] **Step 5: Commit**

```bash
git add lib/practice/reader/refinement.ts lib/practice/reader/__tests__/refinement.test.ts
git commit -m "feat(reader): target-embedding refinement (word-boundary, 60% threshold)"
```

---

### Task 3: Exposure recording (structural SM-2 boundary)

**Files:**
- Modify: `lib/types.ts:95-105` (extend `SRSData`)
- Create: `lib/practice/reader/exposure.ts`
- Test: `lib/practice/reader/__tests__/exposure.test.ts`
- Test: `lib/srs/__tests__/update-srs-exposure.test.ts`

- [ ] **Step 1: Extend the SRSData type**

In `lib/types.ts`, add the `exposure` field to the `SRSData` interface (after `archivedAt?`):

```typescript
export interface SRSData {
  wordId: string;
  word: string;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
  archived?: boolean;
  archivedAt?: string;
  /**
   * Passive reader-exposure signal, owned exclusively by recordReaderExposure.
   * Structurally separate from the SM-2 recall fields above so updateSRS never
   * touches it. The scheduler ignores this when choosing what to review.
   */
  exposure?: { lastAt: number; count: number };
}
```

- [ ] **Step 2: Write the failing tests**

```typescript
// lib/practice/reader/__tests__/exposure.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordReaderExposure } from '../exposure'

const store = new Map<string, unknown>()
vi.mock('@/lib/db', () => ({
  getSRSData: async (id: string) => store.get(id),
  saveSRSData: async (d: { wordId: string }) => { store.set(d.wordId, d) },
}))

beforeEach(() => store.clear())

describe('recordReaderExposure', () => {
  it('creates an exposure sub-object on a fresh record', async () => {
    await recordReaderExposure('c1k:go', 'go')
    const rec = store.get('c1k:go') as { exposure: { count: number; lastAt: number } }
    expect(rec.exposure.count).toBe(1)
    expect(rec.exposure.lastAt).toBeGreaterThan(0)
  })

  it('increments count and does not touch SM-2 fields', async () => {
    store.set('c1k:go', {
      wordId: 'c1k:go', word: 'go', ease: 2.5, interval: 7, repetitions: 3,
      nextReview: '2030-01-01T00:00:00.000Z', exposure: { lastAt: 1, count: 2 },
    })
    await recordReaderExposure('c1k:go', 'go')
    const rec = store.get('c1k:go') as {
      exposure: { count: number }; interval: number; repetitions: number; nextReview: string
    }
    expect(rec.exposure.count).toBe(3)
    expect(rec.interval).toBe(7)
    expect(rec.repetitions).toBe(3)
    expect(rec.nextReview).toBe('2030-01-01T00:00:00.000Z')
  })
})
```

```typescript
// lib/srs/__tests__/update-srs-exposure.test.ts
import { describe, it, expect } from 'vitest'
import { updateSRS } from '@/lib/srs'
import type { SRSData } from '@/lib/types'

describe('updateSRS preserves the exposure boundary', () => {
  it('leaves the exposure sub-object intact after a grade', () => {
    const before: SRSData = {
      wordId: 'c1k:go', word: 'go', ease: 2.5, interval: 1, repetitions: 0,
      nextReview: new Date().toISOString(), exposure: { lastAt: 123, count: 4 },
    }
    const after = updateSRS(before, 5)
    expect(after.exposure).toEqual({ lastAt: 123, count: 4 })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test lib/practice/reader/__tests__/exposure.test.ts lib/srs/__tests__/update-srs-exposure.test.ts`
Expected: exposure.test FAILS (no module `../exposure`); update-srs-exposure may already PASS because `updateSRS` spreads `...current` — that's the point: the test locks the behavior so a future refactor can't regress it.

- [ ] **Step 4: Write the exposure recorder**

```typescript
// lib/practice/reader/exposure.ts
import { getSRSData, saveSRSData } from '@/lib/db'
import type { SRSData } from '@/lib/types'

/**
 * Record a passive reader exposure on the SRS record `srsId` (already namespaced,
 * e.g. `c1k:go` / `fragment:123`). Writes ONLY the `exposure` sub-object; never
 * touches the SM-2 recall fields. Both correct and incorrect comprehension call
 * this — exposure is not a grade.
 */
export async function recordReaderExposure(srsId: string, word: string): Promise<void> {
  const current: SRSData = (await getSRSData(srsId)) ?? {
    wordId: srsId,
    word,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  }
  const prev = current.exposure ?? { lastAt: 0, count: 0 }
  await saveSRSData({
    ...current,
    exposure: { lastAt: Date.now(), count: prev.count + 1 },
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test lib/practice/reader/__tests__/exposure.test.ts lib/srs/__tests__/update-srs-exposure.test.ts`
Expected: PASS (all 3).

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/practice/reader/exposure.ts lib/practice/reader/__tests__/exposure.test.ts lib/srs/__tests__/update-srs-exposure.test.ts
git commit -m "feat(reader): exposure sub-object with structural SM-2 boundary"
```

---

### Task 4: Target hash

**Files:**
- Create: `lib/practice/reader/target-hash.ts`
- Test: `lib/practice/reader/__tests__/target-hash.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/practice/reader/__tests__/target-hash.test.ts
import { describe, it, expect } from 'vitest'
import { targetHash } from '../target-hash'

describe('targetHash', () => {
  it('is order-independent', () => {
    expect(targetHash(['go', 'cat', 'run'])).toBe(targetHash(['run', 'go', 'cat']))
  })

  it('is case-insensitive', () => {
    expect(targetHash(['Go'])).toBe(targetHash(['go']))
  })

  it('differs for different target sets', () => {
    expect(targetHash(['go', 'cat'])).not.toBe(targetHash(['go', 'dog']))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/reader/__tests__/target-hash.test.ts`
Expected: FAIL — cannot find module `../target-hash`.

- [ ] **Step 3: Write the hash**

```typescript
// lib/practice/reader/target-hash.ts
/**
 * Stable, order- and case-independent hash of a target set. Used as the cache
 * key for reader_passages (so the same set of recycled words resolves the same
 * passage). FNV-1a over the sorted, lowercased, comma-joined targets.
 */
export function targetHash(targets: string[]): string {
  const canonical = targets.map((t) => t.trim().toLowerCase()).sort().join(',')
  let h = 0x811c9dc5
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/practice/reader/__tests__/target-hash.test.ts`
Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add lib/practice/reader/target-hash.ts lib/practice/reader/__tests__/target-hash.test.ts
git commit -m "feat(reader): stable order-independent target hash"
```

---

### Task 5: Shared types + Supabase migration + Dexie v13

**Files:**
- Create: `lib/practice/reader/types.ts`
- Create: `supabase/migrations/20260619180000_reader_passages.sql`
- Modify: `lib/db/index.ts:97` (table field), `:171-173` (add v13 block), and the export region (add `readerPassages` helpers)

- [ ] **Step 1: Write shared types**

```typescript
// lib/practice/reader/types.ts
import type { CEFRLevel } from '@/lib/exercises/cefr'

export interface ReaderQuestion {
  prompt: string
  options: string[]
  /** Index into `options` of the correct answer. */
  correctIndex: number
}

export interface ReaderPassage {
  id: string
  userId: string
  targetItems: string[]
  targetHash: string
  topic: string
  passage: string
  questions: ReaderQuestion[]
  level: CEFRLevel
  createdAt: string
}
```

- [ ] **Step 2: Write the Supabase migration**

```sql
-- supabase/migrations/20260619180000_reader_passages.sql
create table public.reader_passages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_items text[] not null,
  target_hash text not null,
  topic text not null default '',
  passage text not null,
  questions jsonb not null default '[]'::jsonb,
  level text not null default 'b1',
  created_at timestamptz not null default now()
);

-- Cache query: most recent passage per user, and per (user, target_hash).
create index reader_passages_user_created_idx
  on public.reader_passages (user_id, created_at desc);
create index reader_passages_user_hash_idx
  on public.reader_passages (user_id, target_hash);

alter table public.reader_passages enable row level security;

create policy "reader_passages_select_own"
  on public.reader_passages for select
  using (auth.uid() = user_id);

create policy "reader_passages_insert_own"
  on public.reader_passages for insert
  with check (auth.uid() = user_id);
```

- [ ] **Step 3: Add the Dexie table + helpers**

In `lib/db/index.ts`, add the table field next to the others (after `ipaExplorations`, ~line 97):

```typescript
  readerPassages!: Table<ReaderPassage, string>;
```

Add the import near the top (with the other type imports):

```typescript
import type { ReaderPassage } from "@/lib/practice/reader/types";
```

Add a v13 block after the v12 block (~line 173, inside the constructor):

```typescript
    // v13: reader passages (comprehensible-input reader, offline reread cache)
    this.version(13).stores({
      readerPassages: "id, userId, targetHash, createdAt",
    });
```

Add helpers in the export region (near `saveSRSData`):

```typescript
export async function saveReaderPassage(p: ReaderPassage): Promise<void> {
  await db.readerPassages.put(p);
}

/** Most recent cached passage for this user + target set, or undefined. */
export async function getCachedReaderPassage(
  userId: string,
  targetHash: string,
): Promise<ReaderPassage | undefined> {
  const rows = await db.readerPassages
    .where("targetHash").equals(targetHash)
    .filter((p) => p.userId === userId)
    .toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
```

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add lib/practice/reader/types.ts supabase/migrations/20260619180000_reader_passages.sql lib/db/index.ts
git commit -m "feat(reader): reader_passages table (Supabase RLS + Dexie v13) and types"
```

---

### Task 6: Generation prompt + route with refinement gate

**Files:**
- Modify: `lib/ai-prompts.ts` (append exports)
- Create: `app/api/gemini/generate-reader/route.ts`
- Test: `app/api/gemini/generate-reader/__tests__/route.test.ts`

- [ ] **Step 1: Add the prompt to lib/ai-prompts.ts**

Append:

```typescript
export const GENERATE_READER_SYSTEM_PROMPT = `You write very short English reading passages for language learners at the i+1 level (Krashen): mostly known vocabulary with a little new.

Rules:
- 60-90 words, one short coherent paragraph telling a tiny real-world story or scene.
- Embed EVERY target word. Prefer each target's citation (base/dictionary) form; if grammar forces inflection, keep it regular and recognizable.
- Keep all other vocabulary simple and high-frequency. No idioms, no rare words.
- Then write 1-2 comprehension questions about the MEANING of the passage (not grammar), each with exactly 4 plausible options and one correct answer.
- Output JSON only.`

export function buildGenerateReaderUserPrompt(input: {
  targets: string[]
  level: string
}): string {
  return `Target words to embed: ${input.targets.join(', ')}\nLevel: ${input.level}\n\nReturn JSON: { "passage": string, "topic": string, "questions": [{ "prompt": string, "options": [string,string,string,string], "correctIndex": number }] }`
}
```

- [ ] **Step 2: Write the failing route test**

```typescript
// app/api/gemini/generate-reader/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateContent = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({ models: { generateContent } })),
}))
vi.mock('@/lib/api/guards', () => ({
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: async (_req: Request, _schema: unknown) => ({
    data: { targets: ['cat', 'go', 'dog'], level: 'b1' }, error: null,
  }),
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  generateContent.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('generate-reader route', () => {
  it('returns a passage when refinement passes', async () => {
    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        passage: 'The cat went to find a dog in the park.',
        topic: 'animals',
        questions: [{ prompt: 'Who did the cat find?', options: ['dog', 'fish', 'bird', 'cow'], correctIndex: 0 }],
      }),
    })
    const res = await POST(reqWith() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.passage).toContain('cat')
  })

  it('retries the next model when the passage misses too many targets', async () => {
    generateContent
      .mockResolvedValueOnce({ text: JSON.stringify({
        passage: 'Nothing relevant here at all.', topic: 't',
        questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctIndex: 0 }],
      }) })
      .mockResolvedValueOnce({ text: JSON.stringify({
        passage: 'The cat went with the dog.', topic: 'animals',
        questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctIndex: 0 }],
      }) })
    const res = await POST(reqWith() as never)
    expect(res.status).toBe(200)
    expect(generateContent).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test app/api/gemini/generate-reader/__tests__/route.test.ts`
Expected: FAIL — cannot find module `../route`.

- [ ] **Step 4: Write the route**

```typescript
// app/api/gemini/generate-reader/route.ts
import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  GENERATE_READER_SYSTEM_PROMPT,
  buildGenerateReaderUserPrompt,
} from '@/lib/ai-prompts'
import { requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { passageEmbedsTargets } from '@/lib/practice/reader/refinement'
import type { ReaderQuestion } from '@/lib/practice/reader/types'

const RequestSchema = z.object({
  targets: z.array(z.string().min(1).max(40)).min(1).max(10),
  level: z.string().min(2).max(4),
}).strict()

const ResponseSchema = z.object({
  passage: z.string().min(1).max(2000),
  topic: z.string().max(200),
  questions: z.array(z.object({
    prompt: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(200)).length(4),
    correctIndex: z.number().int().min(0).max(3),
  })).min(1).max(2),
}).strict()

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === 'true'
const BASE_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'] as const
const PREVIEW_MODELS = ['gemini-3.1-flash-lite-preview'] as const
const FALLBACK_MODELS = ENABLE_PREVIEW_MODELS ? [...BASE_MODELS, ...PREVIEW_MODELS] : [...BASE_MODELS]

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const maybe = err as { status?: unknown; statusCode?: unknown }
  if (typeof maybe.status === 'number') return maybe.status
  if (typeof maybe.statusCode === 'number') return maybe.statusCode
  return undefined
}

function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err)
  if (status === 400 || status === 401 || status === 403) return false
  if (status === 404 || status === 408 || status === 429) return true
  if (typeof status === 'number' && status >= 500) return true
  const msg = String((err as { message?: unknown })?.message ?? '').toLowerCase()
  return msg.includes('quota') || msg.includes('rate') || msg.includes('unavailable') || msg.includes('timeout')
}

interface ReaderResult { passage: string; topic: string; questions: ReaderQuestion[] }

function parse(raw: string): ReaderResult {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return ResponseSchema.parse(JSON.parse(cleaned))
}

async function generateWithFallback(
  ai: GoogleGenAI, prompt: string, targets: string[],
): Promise<ReaderResult> {
  let lastError: unknown
  for (const model of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: GENERATE_READER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      })
      if (!result.text) throw new Error('Empty response from AI')
      const parsed = parse(result.text)
      // Refinement gate: reject (and try next model) if it failed to embed targets.
      if (!passageEmbedsTargets(parsed.passage, targets)) {
        throw Object.assign(new Error('refinement failed'), { statusCode: 422 })
      }
      return parsed
    } catch (err: unknown) {
      lastError = err
      const isRefinement = String((err as { message?: unknown })?.message ?? '').includes('refinement')
      if (!isRefinement && !shouldTryNextModel(err)) throw err
    }
  }
  throw lastError ?? new Error('All fallback models failed')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error: authError } = await requireUser()
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/generate-reader:${user.id}`, {
    max: 20, windowMs: 60_000, meta: { endpoint: '/api/gemini/generate-reader', userId: user.id },
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })

  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = buildGenerateReaderUserPrompt({ targets: body.targets, level: body.level })
    const result = await generateWithFallback(ai, prompt, body.targets)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500
    const message = String((err as { message?: unknown })?.message ?? 'Internal server error')
    console.error('generate-reader error:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test app/api/gemini/generate-reader/__tests__/route.test.ts`
Expected: PASS (both).

- [ ] **Step 6: Commit**

```bash
git add lib/ai-prompts.ts app/api/gemini/generate-reader/
git commit -m "feat(reader): generate-reader route with fallback chain + refinement gate"
```

---

### Task 7: Target selection from SRS

**Files:**
- Create: `lib/practice/reader/select-targets.ts`
- Test: `lib/practice/reader/__tests__/select-targets.test.ts`

> Reuses the existing due-ordering helper. `selectReaderTargets` reads the user's
> word-bank SRS rows, keeps `learning`/`review` status, orders by soonest due,
> and returns the top 5-8 `{ srsId, word }`. Returns `null` when fewer than 3 qualify.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/practice/reader/__tests__/select-targets.test.ts
import { describe, it, expect } from 'vitest'
import { pickTargets } from '../select-targets'

const row = (word: string, status: string, due: string) => ({
  srsId: `c1k:${word}`, word, status, nextReview: due,
})

describe('pickTargets', () => {
  it('returns null when fewer than 3 qualify', () => {
    expect(pickTargets([row('go', 'learning', '2030-01-01'), row('cat', 'new', '2030-01-01')])).toBeNull()
  })

  it('keeps only learning/review and orders by soonest due', () => {
    const out = pickTargets([
      row('go', 'learning', '2030-03-01'),
      row('cat', 'review', '2030-01-01'),
      row('dog', 'mastered', '2030-01-01'),
      row('run', 'learning', '2030-02-01'),
    ])
    expect(out?.map((t) => t.word)).toEqual(['cat', 'run', 'go'])
  })

  it('caps at 8 targets', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`w${i}`, 'review', `2030-01-${i + 1}`))
    expect(pickTargets(rows)?.length).toBe(8)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/reader/__tests__/select-targets.test.ts`
Expected: FAIL — cannot find module `../select-targets`.

- [ ] **Step 3: Write the selector**

```typescript
// lib/practice/reader/select-targets.ts
export interface ReaderTargetRow {
  srsId: string
  word: string
  status: string
  nextReview: string
}

export interface ReaderTarget {
  srsId: string
  word: string
}

const MIN_TARGETS = 3
const MAX_TARGETS = 8

/**
 * Pure selection: keep learning/review rows, order by soonest due, cap at 8.
 * Returns null when fewer than 3 qualify (no reader that day).
 */
export function pickTargets(rows: ReaderTargetRow[]): ReaderTarget[] | null {
  const eligible = rows
    .filter((r) => r.status === 'learning' || r.status === 'review')
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
    .slice(0, MAX_TARGETS)
    .map(({ srsId, word }) => ({ srsId, word }))
  return eligible.length >= MIN_TARGETS ? eligible : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/practice/reader/__tests__/select-targets.test.ts`
Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add lib/practice/reader/select-targets.ts lib/practice/reader/__tests__/select-targets.test.ts
git commit -m "feat(reader): pure target selection from SRS rows"
```

---

### Task 8: buildReaderStep — stale-while-revalidate orchestration

**Files:**
- Create: `lib/practice/reader/get-passage.ts`
- Test: `lib/practice/reader/__tests__/get-passage.test.ts`

> This is the orchestration seam. To keep it testable and free of network/Dexie
> coupling, `resolveReaderPassage` takes its effects as injected functions. The
> daily step-builder (and the `/practice/reader` page) wire the real `getCachedReaderPassage`,
> a `fetch`-backed generator, and `saveReaderPassage` into it.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/practice/reader/__tests__/get-passage.test.ts
import { describe, it, expect, vi } from 'vitest'
import { resolveReaderPassage } from '../get-passage'
import type { ReaderPassage } from '../types'

const passage = (over: Partial<ReaderPassage> = {}): ReaderPassage => ({
  id: 'p1', userId: 'u1', targetItems: ['go'], targetHash: 'h', topic: 't',
  passage: 'x', questions: [], level: 'b1', createdAt: '2030-01-01T00:00:00.000Z', ...over,
})

const STALE_MS = 7 * 24 * 60 * 60 * 1000

describe('resolveReaderPassage', () => {
  it('returns null when there are no targets and no cache', async () => {
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [], online: true,
      getCached: async () => undefined, generate: vi.fn(), save: vi.fn(), now: Date.now(),
    })
    expect(out).toBeNull()
  })

  it('serves fresh cache without generating', async () => {
    const now = Date.parse('2030-01-02T00:00:00.000Z') // 1 day old
    const generate = vi.fn()
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => passage(), generate, save: vi.fn(), now,
    })
    expect(out?.id).toBe('p1')
    expect(generate).not.toHaveBeenCalled()
  })

  it('generates and saves when there is no cache and we are online', async () => {
    const fresh = passage({ id: 'p2' })
    const save = vi.fn()
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => undefined, generate: async () => fresh, save, now: Date.now(),
    })
    expect(out?.id).toBe('p2')
    expect(save).toHaveBeenCalledWith(fresh)
  })

  it('serves stale immediately and revalidates in the background', async () => {
    const now = Date.parse('2030-01-01T00:00:00.000Z') + STALE_MS + 1000 // >7 days old
    const fresh = passage({ id: 'p3' })
    const save = vi.fn(async () => {})
    const generate = vi.fn(async () => fresh)
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => passage(), generate, save, now,
    })
    expect(out?.id).toBe('p1') // stale served immediately
    await Promise.resolve(); await Promise.resolve()
    expect(generate).toHaveBeenCalled() // revalidation fired
  })

  it('keeps stale when background regeneration fails', async () => {
    const now = Date.parse('2030-01-01T00:00:00.000Z') + STALE_MS + 1000
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: true,
      getCached: async () => passage(),
      generate: async () => { throw new Error('network') }, save: vi.fn(), now,
    })
    expect(out?.id).toBe('p1') // no throw, stale retained
  })

  it('returns null offline with no cache', async () => {
    const out = await resolveReaderPassage({
      userId: 'u1', targets: [{ srsId: 'c1k:go', word: 'go' }], online: false,
      getCached: async () => undefined, generate: vi.fn(), save: vi.fn(), now: Date.now(),
    })
    expect(out).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/reader/__tests__/get-passage.test.ts`
Expected: FAIL — cannot find module `../get-passage`.

- [ ] **Step 3: Write the orchestrator**

```typescript
// lib/practice/reader/get-passage.ts
import type { ReaderPassage } from './types'
import type { ReaderTarget } from './select-targets'

const STALE_MS = 7 * 24 * 60 * 60 * 1000

export interface ResolveReaderPassageDeps {
  userId: string
  targets: ReaderTarget[]
  online: boolean
  now: number
  getCached: (userId: string, targetHash: string) => Promise<ReaderPassage | undefined>
  generate: (userId: string, targets: ReaderTarget[]) => Promise<ReaderPassage>
  save: (p: ReaderPassage) => Promise<void>
}

/**
 * Resolve the passage to show, applying stale-while-revalidate:
 *  - no targets → null
 *  - fresh cache (<7d) → serve it
 *  - stale cache (>=7d) + online → serve stale now, regenerate in background
 *  - no cache + online → generate + save synchronously
 *  - no cache offline → null
 * Background regeneration failures are swallowed (stale retained).
 */
export async function resolveReaderPassage(
  deps: ResolveReaderPassageDeps,
): Promise<ReaderPassage | null> {
  const { userId, targets, online, now, getCached, generate, save } = deps
  if (targets.length === 0) return null

  // targetHash is computed by the caller-supplied getCached via the same hash;
  // here we pass the hash implicitly through getCached by hashing in the wiring.
  const cached = await getCached(userId, hashOf(targets))

  if (cached) {
    const age = now - Date.parse(cached.createdAt)
    if (age < STALE_MS) return cached
    if (online) {
      // revalidate in background; never block, never throw.
      void generate(userId, targets).then(save).catch(() => {})
    }
    return cached
  }

  if (!online) return null
  const fresh = await generate(userId, targets)
  await save(fresh)
  return fresh
}

// Local import kept lazy-free: hash the ordered set the same way queries do.
import { targetHash } from './target-hash'
function hashOf(targets: ReaderTarget[]): string {
  return targetHash(targets.map((t) => t.word))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/practice/reader/__tests__/get-passage.test.ts`
Expected: PASS (all 6).

- [ ] **Step 5: Wire buildReaderStep into the daily plan**

Add to `lib/practice/daily-plan/async-step-builders.ts`:

```typescript
import { resolveReaderPassage } from '@/lib/practice/reader/get-passage'
import { getCachedReaderPassage, saveReaderPassage } from '@/lib/db'
import { generateReaderPassage } from '@/lib/practice/reader/queries'
import { pickTargets, type ReaderTargetRow } from '@/lib/practice/reader/select-targets'

/** Comprehensible-input reader step. null when offline w/o cache or <3 targets. */
export async function buildReaderStep(
  userId: string,
  srsRows: ReaderTargetRow[],
  online: boolean,
): Promise<DailyStep | null> {
  const targets = pickTargets(srsRows)
  if (!targets) return null

  const passage = await resolveReaderPassage({
    userId, targets, online, now: Date.now(),
    getCached: getCachedReaderPassage,
    generate: (uid, t) => generateReaderPassage(uid, t),
    save: saveReaderPassage,
  })
  if (!passage) return null

  return {
    kind: 'reader',
    id: 'reader',
    title: 'Lectura',
    subtitle: 'Tus palabras recientes, en contexto',
    icon: 'BookOpen',
    exercises: [],
    estMinutes: 3,
    readerPassage: passage,
  }
}
```

Add `'reader'` to `DailyStepKind` and a `readerPassage?: ReaderPassage` field to `DailyStep` in `lib/practice/types.ts`. Create `lib/practice/reader/queries.ts` with `generateReaderPassage(userId, targets)` that POSTs to `/api/gemini/generate-reader`, maps the response to a `ReaderPassage` (`id: crypto.randomUUID()`, `targetHash`, `createdAt: new Date().toISOString()`), and returns it.

- [ ] **Step 6: Type-check and commit**

Run: `pnpm type-check`
Expected: PASS.

```bash
git add lib/practice/reader/get-passage.ts lib/practice/reader/queries.ts lib/practice/reader/__tests__/get-passage.test.ts lib/practice/daily-plan/async-step-builders.ts lib/practice/types.ts
git commit -m "feat(reader): stale-while-revalidate passage resolution + daily reader step"
```

---

### Task 9: ReaderExercise component + standalone page + registry

**Files:**
- Create: `components/practice/reader/ReaderExercise.tsx`
- Create: `app/practice/reader/page.tsx`
- Modify: `lib/practice/types.ts` (`ExerciseSlug` + `EXERCISE_TYPE_IDS`)
- Test: `components/practice/reader/__tests__/ReaderExercise.test.tsx`

> Planned structure:
> // <ReaderExercise>
> //   <ReaderPassageText />   (paragraph + on-demand TTS button)
> //   <ReaderComprehension /> (multiple_choice question)

- [ ] **Step 1: Register the slug**

In `lib/practice/types.ts`, add `| 'reader'` to `ExerciseSlug` (near `multiple_choice`) and `reader: null` to `EXERCISE_TYPE_IDS` — null because the reader is input and does not write `answer_history`.

- [ ] **Step 2: Write the failing component test**

```typescript
// components/practice/reader/__tests__/ReaderExercise.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReaderExercise } from '../ReaderExercise'
import type { ReaderPassage } from '@/lib/practice/reader/types'

const passage: ReaderPassage = {
  id: 'p1', userId: 'u1', targetItems: ['go'], targetHash: 'h', topic: 'animals',
  passage: 'The cat went home.',
  questions: [{ prompt: 'Where did the cat go?', options: ['home', 'park', 'shop', 'school'], correctIndex: 0 }],
  level: 'b1', createdAt: '2030-01-01T00:00:00.000Z',
}

describe('ReaderExercise', () => {
  it('renders the passage text and the question', () => {
    render(<ReaderExercise passage={passage} online onComplete={vi.fn()} />)
    expect(screen.getByText('The cat went home.')).toBeInTheDocument()
    expect(screen.getByText('Where did the cat go?')).toBeInTheDocument()
  })

  it('calls onComplete with correctness when an option is chosen', () => {
    const onComplete = vi.fn()
    render(<ReaderExercise passage={passage} online onComplete={onComplete} />)
    fireEvent.click(screen.getByText('home'))
    expect(onComplete).toHaveBeenCalledWith(true)
  })

  it('disables the listen button when offline', () => {
    render(<ReaderExercise passage={passage} online={false} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /escuchar/i })).toBeDisabled()
  })
}) 
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test components/practice/reader/__tests__/ReaderExercise.test.tsx`
Expected: FAIL — cannot find module `../ReaderExercise`.

- [ ] **Step 4: Write the component**

```tsx
// components/practice/reader/ReaderExercise.tsx
'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { recordReaderExposure } from '@/lib/practice/reader/exposure'

// Planned structure:
// <ReaderExercise>
//   <passage text + listen button>
//   <comprehension options>

interface ReaderExerciseProps {
  passage: ReaderPassage
  online: boolean
  onComplete: (correct: boolean) => void
}

export function ReaderExercise({ passage, online, onComplete }: ReaderExerciseProps) {
  const [answered, setAnswered] = useState(false)
  const question = passage.questions[0]

  function speak() {
    const u = new SpeechSynthesisUtterance(passage.passage)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u) // on-demand, never saved
  }

  function choose(index: number) {
    if (answered) return
    setAnswered(true)
    const correct = index === question.correctIndex
    // Exposure for every recycled target — never an SM-2 grade.
    passage.targetItems.forEach((w) => void recordReaderExposure(`c1k:${w}`, w))
    onComplete(correct)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-lg leading-relaxed text-foreground">{passage.passage}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={speak}
          disabled={!online}
          aria-label="Escuchar"
          className="self-start"
        >
          <Volume2 className="size-4" /> Escuchar
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium text-foreground">{question.prompt}</p>
        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => choose(i)}
              disabled={answered}
              className={cn(
                'rounded-md border border-border px-4 py-3 text-left',
                answered && i === question.correctIndex && 'border-success bg-success/10',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

> Note: confirm the real import paths for `cn` (`@/lib/utils`) and `Button` (`@/components/ui/Button`) and the design tokens (`text-foreground`, `border-success`) against the codebase before finalizing — adjust to the actual token/component names if they differ.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test components/practice/reader/__tests__/ReaderExercise.test.tsx`
Expected: PASS (all 3).

- [ ] **Step 6: Add the standalone page**

```tsx
// app/practice/reader/page.tsx
import { ReaderEntry } from '@/components/practice/reader/ReaderEntry'

export default function ReaderPage() {
  return <ReaderEntry />
}
```

Create `components/practice/reader/ReaderEntry.tsx` (`'use client'`): loads the user's SRS rows, calls `pickTargets` + `resolveReaderPassage` (same wiring as `buildReaderStep`), and renders `<ReaderExercise>` or an empty state ("Sigue practicando para desbloquear lecturas") when it resolves to null.

- [ ] **Step 7: Type-check, lint, full test run, commit**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: all PASS.

```bash
git add components/practice/reader/ app/practice/reader/ lib/practice/types.ts
git commit -m "feat(reader): ReaderExercise component, standalone page, reader slug"
```

---

## Self-Review Notes

- **Spec coverage:** target selection (T7), generation prompt+route (T6), reader type/component (T9), TTS on-demand never-saved (T9 `speak`), refinement word-boundary+60%+irregular table (T1, T2), exposure-vs-recall structural boundary (T3), stale-while-revalidate (T8), `target_hash` in Supabase + `(user_id, created_at)` index + Dexie mirror (T5), entry both as daily step and standalone page (T8, T9).
- **Type consistency:** `ReaderPassage`/`ReaderQuestion` (T5) used identically in T6/T8/T9; `ReaderTarget` (T7) used in T8; `recordReaderExposure(srsId, word)` (T3) called in T9.
- **Open wiring confirmations for the implementer (not placeholders — real lookups):** (a) exact SRS-row source for `select-targets` wiring — confirm whether word-bank rows come from `lib/word-bank/srs-queries.ts` or `lib/practice/queries.ts` and map to `ReaderTargetRow`; (b) the namespaced srsId prefix per source (`c1k:` for Core 1000 vs `fragment:`) — the component currently assumes `c1k:`; thread the real prefix from the target row; (c) `cn`/`Button`/token names in T9.
```
