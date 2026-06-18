# Review Hub — SRS History Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible "Historial SRS" section to Review Hub that shows the user's recently practiced words, sentences, and sounds with their next review date and current interval — making spaced repetition transparent.

**Architecture:** Three new server queries (one per SRS domain) pull recent items with SRS metadata. A shared type `SrsHistoryItem` normalizes the data. A new `SrsHistoryPanel` component renders three collapsible domain groups inside the existing Review Hub page. No new routes, no Zustand, no Dexie — pure server data passed as props through the existing `ReviewHubSummary`.

**Tech Stack:** Next.js 15 App Router (server component data fetch), Supabase server client, Tailwind v4 tokens, existing `ReviewSectionCard` pattern, Vitest for unit tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/review/types.ts` | Modify | Add `SrsHistoryItem`, `SrsHistoryDomain`, `SrsHistoryGroup` types; extend `ReviewHubSummary` |
| `lib/review/srs-history-queries.ts` | Create | Three queries: words, deck entries, sounds — normalized to `SrsHistoryItem[]` |
| `lib/review/__tests__/srs-history.test.ts` | Create | Unit tests for normalization helpers |
| `lib/review/server-queries.ts` | Modify | Call `getSrsHistory` and include in `ReviewHubSummary` |
| `components/practice/review/SrsHistoryPanel.tsx` | Create | Collapsible panel with three domain groups |
| `components/practice/review/ReviewHubClient.tsx` | Modify | Render `SrsHistoryPanel` below existing sections |

---

## Task 1: Add types

**Files:**
- Modify: `lib/review/types.ts`

- [ ] **Step 1: Add SRS history types to `lib/review/types.ts`**

Append at the end of the file:

```ts
export type SrsHistoryDomain = 'words' | 'sounds' | 'sentences'

export interface SrsHistoryItem {
  id: string                  // unique key for React (domain:originalId)
  domain: SrsHistoryDomain
  label: string               // word text, ipa symbol, or sentence label
  sublabel?: string           // translation for words; example for sounds
  intervalDays: number
  nextReviewAt: string | null // ISO string or null if never scheduled
  lastPracticedAt: string     // ISO string
}

export interface SrsHistoryGroup {
  domain: SrsHistoryDomain
  title: string
  items: SrsHistoryItem[]
}

// Extend ReviewHubSummary — add after `canStartReview`:
```

Then add `srsHistory: SrsHistoryGroup[]` to the `ReviewHubSummary` interface so it becomes:

```ts
export interface ReviewHubSummary {
  failedSentences: FailedSentenceItem[]
  weakWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  soundsDue: SoundDueHome[]
  counts: ReviewHubCounts
  nothingDue: boolean
  canStartReview: boolean
  srsHistory: SrsHistoryGroup[]
}
```

- [ ] **Step 2: Run type-check to confirm no errors yet**

```bash
pnpm type-check
```

Expected: errors only in `server-queries.ts` (missing `srsHistory` in returned object). That is expected — we fix it in Task 3.

- [ ] **Step 3: Commit**

```bash
git add lib/review/types.ts
git commit -m "feat(review): add SrsHistoryItem and SrsHistoryGroup types"
```

---

## Task 2: Query layer + unit tests

**Files:**
- Create: `lib/review/srs-history-queries.ts`
- Create: `lib/review/__tests__/srs-history.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/review/__tests__/srs-history.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeWordRow, normalizeSoundRow } from '@/lib/review/srs-history-queries'

describe('normalizeWordRow', () => {
  it('builds a SrsHistoryItem from a word_bank row', () => {
    const row = {
      id: 'abc-123',
      text: 'although',
      translation: 'aunque',
      interval_days: 4,
      next_review_at: '2026-06-22T00:00:00Z',
      last_reviewed_at: '2026-06-18T10:00:00Z',
    }
    const item = normalizeWordRow(row)
    expect(item.id).toBe('words:abc-123')
    expect(item.domain).toBe('words')
    expect(item.label).toBe('although')
    expect(item.sublabel).toBe('aunque')
    expect(item.intervalDays).toBe(4)
    expect(item.nextReviewAt).toBe('2026-06-22T00:00:00Z')
    expect(item.lastPracticedAt).toBe('2026-06-18T10:00:00Z')
  })

  it('falls back to empty sublabel when translation is null', () => {
    const row = {
      id: 'abc-123',
      text: 'run',
      translation: null,
      interval_days: 1,
      next_review_at: null,
      last_reviewed_at: '2026-06-18T10:00:00Z',
    }
    const item = normalizeWordRow(row)
    expect(item.sublabel).toBeUndefined()
    expect(item.nextReviewAt).toBeNull()
  })
})

describe('normalizeSoundRow', () => {
  it('builds a SrsHistoryItem from a user_contrast_progress row', () => {
    const row = {
      contrast_id: 'iː|ɪ',
      interval_days: 3,
      next_review: '2026-06-21T00:00:00Z',
      updated_at: '2026-06-18T09:00:00Z',
      ipa: '/iː/',
      example: 'beat',
    }
    const item = normalizeSoundRow(row)
    expect(item.id).toBe('sounds:iː|ɪ')
    expect(item.domain).toBe('sounds')
    expect(item.label).toBe('/iː/')
    expect(item.sublabel).toBe('beat')
    expect(item.intervalDays).toBe(3)
    expect(item.nextReviewAt).toBe('2026-06-21T00:00:00Z')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test lib/review/__tests__/srs-history --reporter=verbose
```

Expected: FAIL — `normalizeWordRow` not found.

- [ ] **Step 3: Implement `lib/review/srs-history-queries.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SrsHistoryGroup, SrsHistoryItem } from '@/lib/review/types'

// --- Normalization helpers (exported for testing) ---

type WordRow = {
  id: string
  text: string
  translation: string | null
  interval_days: number
  next_review_at: string | null
  last_reviewed_at: string | null
}

export function normalizeWordRow(row: WordRow): SrsHistoryItem {
  return {
    id: `words:${row.id}`,
    domain: 'words',
    label: row.text,
    sublabel: row.translation ?? undefined,
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review_at,
    lastPracticedAt: row.last_reviewed_at ?? new Date(0).toISOString(),
  }
}

type SoundRow = {
  contrast_id: string
  interval_days: number
  next_review: string | null
  updated_at: string | null
  ipa: string | null
  example: string | null
}

export function normalizeSoundRow(row: SoundRow): SrsHistoryItem {
  return {
    id: `sounds:${row.contrast_id}`,
    domain: 'sounds',
    label: row.ipa ?? row.contrast_id,
    sublabel: row.example ?? undefined,
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review,
    lastPracticedAt: row.updated_at ?? new Date(0).toISOString(),
  }
}

// --- Queries ---

async function fetchWordHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
): Promise<SrsHistoryItem[]> {
  const { data } = await supabase
    .from('word_bank')
    .select('id, text, translation, interval_days, next_review_at, last_reviewed_at')
    .eq('user_id', userId)
    .not('last_reviewed_at', 'is', null)
    .order('last_reviewed_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(normalizeWordRow)
}

async function fetchSoundHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
): Promise<SrsHistoryItem[]> {
  // user_contrast_progress joins phoneme_sounds via ipa extracted from contrast_id
  const { data } = await supabase
    .from('user_contrast_progress')
    .select('contrast_id, interval_days, next_review, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return []

  // Resolve ipa labels: first ipa in each contrast_id (e.g. "iː|ɪ" → "iː")
  const ipaList = [...new Set(data.map((r) => r.contrast_id.split('|')[0]))]
  const { data: sounds } = await supabase
    .from('phoneme_sounds')
    .select('ipa, example')
    .in('ipa', ipaList)

  const soundMap = new Map<string, { ipa: string; example: string | null }>(
    (sounds ?? []).map((s) => [s.ipa, s]),
  )

  return data.map((r) => {
    const ipaKey = r.contrast_id.split('|')[0]
    const sound = soundMap.get(ipaKey)
    return normalizeSoundRow({
      ...r,
      ipa: sound ? `/${sound.ipa}/` : `/${ipaKey}/`,
      example: sound?.example ?? null,
    })
  })
}

export async function getSrsHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<SrsHistoryGroup[]> {
  const LIMIT = 20
  const [words, sounds] = await Promise.all([
    fetchWordHistory(supabase, userId, LIMIT),
    fetchSoundHistory(supabase, userId, LIMIT),
  ])

  const groups: SrsHistoryGroup[] = []
  if (words.length > 0) groups.push({ domain: 'words', title: 'Palabras', items: words })
  if (sounds.length > 0) groups.push({ domain: 'sounds', title: 'Sonidos', items: sounds })

  return groups
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test lib/review/__tests__/srs-history --reporter=verbose
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/review/srs-history-queries.ts lib/review/__tests__/srs-history.test.ts
git commit -m "feat(review): add SRS history queries and normalization helpers"
```

---

## Task 3: Wire into server-queries + ReviewHubSummary

**Files:**
- Modify: `lib/review/server-queries.ts`

- [ ] **Step 1: Add `getSrsHistory` call to `getReviewHubSummary`**

Add the import at the top of `lib/review/server-queries.ts`:

```ts
import { getSrsHistory } from '@/lib/review/srs-history-queries'
```

Change `getReviewHubSummary` to fetch srsHistory in parallel with the rest and include it in the return:

```ts
export async function getReviewHubSummary(userId: string): Promise<ReviewHubSummary> {
  const supabase = await createSupabaseServerClient()

  const [failedSentences, weakWords, dueWords, soundsDue, srsHistory] = await Promise.all([
    loadFailedSentenceItemsServer(userId, 5),
    getWeakWordsForReviewServer(userId, 6),
    getWordsDueForReview(userId, 6),
    getSoundsDueForHome(userId),
    getSrsHistory(supabase, userId),
  ])

  const counts = buildReviewHubCounts(failedSentences, weakWords, dueWords, soundsDue)
  const canStartReview = computeCanStartReview({ failedSentences, weakWords, dueWords, soundsDue })

  return {
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    counts,
    nothingDue: counts.total === 0,
    canStartReview,
    srsHistory,
  }
}
```

Note: `loadFailedSentenceItemsServer` currently creates its own supabase client internally. Pass the shared `supabase` client into it to avoid creating two clients — update the signature:

```ts
async function loadFailedSentenceItemsServer(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  limit: number,
): Promise<import('@/lib/review/types').FailedSentenceItem[]> {
  // remove: const supabase = await createSupabaseServerClient()
  // rest unchanged
```

- [ ] **Step 2: Run type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/review/server-queries.ts
git commit -m "feat(review): wire SRS history into ReviewHubSummary"
```

---

## Task 4: SrsHistoryPanel component

**Files:**
- Create: `components/practice/review/SrsHistoryPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

// Planned structure:
// <SrsHistoryPanel>
//   <details> (one per domain group, open by default for first group)
//     <summary> (domain title + item count)
//     <ul> (items list)
//       <SrsHistoryRow /> (label, sublabel, interval badge, next review date)
//     </ul>
//   </details>
// </SrsHistoryPanel>

import type { SrsHistoryGroup } from '@/lib/review/types'

interface Props {
  groups: SrsHistoryGroup[]
}

function formatNextReview(isoDate: string | null): string {
  if (!isoDate) return 'sin programar'
  const date = new Date(isoDate)
  const now = new Date()
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86_400_000)
  if (diffDays < 0) return 'vencido'
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'mañana'
  return `en ${diffDays}d`
}

function IntervalBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 font-caption text-fg-muted">
      {days}d
    </span>
  )
}

export function SrsHistoryPanel({ groups }: Props) {
  if (groups.length === 0) return null

  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
      <h2 className="font-display text-base font-medium text-fg">Historial SRS</h2>
      <div className="flex flex-col gap-4">
        {groups.map((group, i) => (
          <details key={group.domain} open={i === 0}>
            <summary className="flex cursor-pointer items-center justify-between gap-2 py-1 font-body-sm font-medium text-fg-secondary marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{group.title}</span>
              <span className="font-caption text-fg-muted">{group.items.length} items</span>
            </summary>
            <ul className="mt-2 flex flex-col divide-y divide-border-subtle">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <span className={item.domain === 'sounds' ? 'font-ipa text-primary' : 'font-body-sm text-fg'}>
                      {item.label}
                    </span>
                    {item.sublabel ? (
                      <span className="ml-2 font-caption text-fg-muted">{item.sublabel}</span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <IntervalBadge days={item.intervalDays} />
                    <span className="font-caption text-fg-subtle w-16 text-right">
                      {formatNextReview(item.nextReviewAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/practice/review/SrsHistoryPanel.tsx
git commit -m "feat(review): add SrsHistoryPanel component"
```

---

## Task 5: Wire panel into ReviewHubClient

**Files:**
- Modify: `components/practice/review/ReviewHubClient.tsx`

- [ ] **Step 1: Import and render SrsHistoryPanel**

Add import at top of `ReviewHubClient.tsx`:

```tsx
import { SrsHistoryPanel } from '@/components/practice/review/SrsHistoryPanel'
```

Add `<SrsHistoryPanel>` as the last section inside the `<div className="flex flex-col gap-4">`, after the "Sonidos due" card and before the button logic:

```tsx
<SrsHistoryPanel groups={summary.srsHistory} />
```

- [ ] **Step 2: Run type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test --reporter=verbose
```

Expected: all passing.

- [ ] **Step 4: Commit**

```bash
git add components/practice/review/ReviewHubClient.tsx
git commit -m "feat(review): render SRS history panel in Review Hub"
```

---

## Task 6: Verify in browser

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Navigate to `/practice/review`**

Check:
- "Historial SRS" section appears below the existing four cards
- "Palabras" group is open by default, "Sonidos" collapsed
- Each word row shows: text, translation (if any), interval badge (e.g. `4d`), next review label (e.g. `en 3d`, `hoy`, `vencido`)
- Sound rows show IPA in primary color, example word, interval badge
- Clicking a summary toggles the group open/closed
- No layout breaks on mobile (< 390px)

- [ ] **Step 3: Commit any tweaks**

```bash
git add -p
git commit -m "fix(review): tweak SRS history panel spacing/labels"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Words with SRS metadata (interval, next review) — Task 2 + 4
- ✅ Sounds with SRS metadata — Task 2 + 4
- ✅ Grouped by domain — Task 4
- ✅ Collapsible — Task 4 (`<details>/<summary>`)
- ✅ Integrated into existing Review Hub page — Task 5
- ✅ No new routes — confirmed
- ✅ No inline styles — all tokens

**Gaps / decisions:**
- Deck entry progress (`deck_entry_progress`) is not included — this table tracks progress per card in lesson decks, and the label resolution would require joining `deck_entries` → content. Excluded for now since the user's main SRS domains are word_bank and phoneme contrasts. Can be a follow-up.
- `answer_history` (sentence practice) is already surfaced via "Frases falladas" — not duplicated here.

**Placeholder scan:** None found.

**Type consistency:** `SrsHistoryItem`, `SrsHistoryGroup`, `SrsHistoryDomain` used consistently across types.ts, srs-history-queries.ts, and SrsHistoryPanel.tsx.
