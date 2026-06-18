# Home "Due for review" — unified review queue redesign

**Date:** 2026-06-18
**Status:** Approved (brainstorming) — ready for implementation plan
**Area:** `components/home/`, `lib/home/`

## Problem

The home "Due for review" section (`HomeReviewsSection`) has two problems:

1. **Deficient UX / empty states.** When nothing is due, the most prominent card
   shows a big `0`, "Nothing due yet", and a **disabled, greyed-out "Start review"
   button** — which reads as broken, not "caught up". The retention card renders a
   **hardcoded `/ð/ · 0%`** fallback when there is no phoneme data, showing fake
   bars to new users and eroding trust.
2. **Multiple vocabulary sources, only one counted.** "Items due" reflects only
   `word_bank` SRS + sounds. The newer **Essential Words / Core-1000** SRS queue is
   invisible. Two unrelated denominators ("0 items due" vs "695 words · 0%") sit
   side-by-side with no explained relationship.

Additionally, a real data bug: `getSoundsDueForHome` counts never-practiced sounds
(`next_review.is.null`) as "due", while vocabulary excludes new words. The headline
"items due" therefore mixes "to review" with "to review + new", inflating the number
and creating false urgency.

## Goals

- One **honest, unified** review queue that represents every vocabulary source.
- "Due" means **scheduled review only** (`next_review <= now`); new/unseen items are
  never counted as due.
- Every empty state answers "what now?" — affirmative or forward, never a dead
  disabled button or fake data.
- Two-tier IA: **actionable queue** (do now) vs **progress** (where you stand /
  discover next).

Non-goals: redesigning the sessions themselves; syncing Core-1000 SRS to Supabase
(handled via client hydration instead).

## Architecture

### Data model — hybrid server-aggregate + client-hydrate

Core-1000 SRS lives in **Dexie (client-side IndexedDB)**; the home page is a
**Server Component** and cannot read it. So the queue is computed in two parts.

New query module `lib/home/review-queue.ts`:

```ts
// lib/home/constants.ts
/** A source's count feels urgent at or above this many scheduled reviews. */
export const REVIEW_URGENCY_THRESHOLD = 10

export interface ReviewSource {
  id: 'vocabulary' | 'essential' | 'sounds'  // extensible: add a source = add an entry
  label: string                              // "Vocabulary" | "Essential words" | "Sounds"
  count: number                              // strictly scheduled-due: next_review <= now (never new/null)
  href: string                               // session route
  tone: 'primary' | 'warning'                // warning when count >= REVIEW_URGENCY_THRESHOLD
}

export interface ReviewQueueSummary {
  total: number              // sum of server-known source counts (essential merged client-side)
  newAvailable: number       // new/unseen items available — powers the forward CTA, NOT part of total
  sources: ReviewSource[]    // only sources with count > 0, ordered by count desc
}
```

- **`tone` is derived in the query layer**, never in the component. The component is a
  pure renderer mapping `tone → design token`.
- **Server-computed sources:** `vocabulary` (word_bank due) and `sounds`. Aggregated in
  `getReviewQueueSummary()` on the server.
- **`essential` (Core-1000):** cannot be server-counted. A small **client island**
  (`Core1000DueHydrator`, using a `useCore1000DueCount` hook over the existing
  `buildSessionQueue` + Dexie I/O) merges its count into the displayed total after
  hydration. Server renders the server-known total first; the essential row appears/
  updates on hydration. No business logic enters `/app`; Dexie stays client-side;
  offline mode unaffected.

### "Due" semantics fix

- `getSoundsDueForHome` (or a queue-specific variant) must **exclude** never-practiced
  sounds (`next_review.is.null`) from the due count. Currently
  `lib/home/queries.ts:230` includes them.
- Vocabulary already excludes new (`server-queries.ts:124`) — keep.
- `newAvailable` is tracked separately to power the "Learn new words" forward CTA and
  is **not** added to `total`.
- The "weakest sound to start practicing" discovery stays in the Tier-2 progress card,
  not in the due count.

## Visual design & IA (two tiers)

```
02  Due for review                    spaced repetition · don't let it go cold

┌─ TIER 1: ACTIONABLE (the queue) ──────────────────────────────┐
│  13  to review                                                 │
│  ▸ 8 essential words      →                                    │
│  ▸ 3 vocabulary           →     [ Start review  → ]            │
│  ▸ 2 sounds               →                                    │
│  (optional 3-item word/sound preview below)                    │
└────────────────────────────────────────────────────────────────┘

┌─ TIER 2: PROGRESS (no false urgency) ─────────────────────────┐
│  Vocabulary    ▓▓▓░░░░░  142 / 695 · 20%                       │
│  Weakest sound /ð/  voiced dental fricative  ·  Practice →     │
└────────────────────────────────────────────────────────────────┘
```

### Tier 1 — ReviewQueueCard

- Headline: big `total` stat + honest label **"to review"**.
- **Per-source breakdown rows** (tappable, route to each source's session). A row
  renders only if `count > 0`. `tone: warning` rows use the warning accent + dot,
  driven by `REVIEW_URGENCY_THRESHOLD` (replaces the ad-hoc `atRiskCount`).
- Existing 3-item word/sound preview kept as supporting texture below the breakdown
  (collapsible on mobile).
- **CTA state machine (fixes the disabled-button anti-pattern):**

  | State | Primary action |
  |---|---|
  | `total > 0` | **Start review →** (enabled) |
  | `total === 0`, `newAvailable > 0` | **Learn new words →** (forward, solid CTA, different verb) |
  | `total === 0`, `newAvailable === 0` | No button. Quiet "You're all caught up ✓" + small "Browse vocabulary" link |

### Tier 2 — ReviewProgressCard

- Keep vocabulary retention bar, reframed as "Progress" not "due".
- **Remove the hardcoded `/ð/` fallback.** When there is no phoneme data, show a real
  empty state ("Take the placement check to find your weakest sound →"), never fake
  0% bars.

### Empty-state philosophy

Every empty state answers "what now?". `0 due` → caught-up celebration or new-words
nudge. No phoneme data → discovery CTA. Fixed structurally, not cosmetically.

## Component decomposition (CLAUDE.md: ≤250 lines, one responsibility each)

```
HomeReviewsSection           (IA: two tiers)
├─ ReviewQueueCard           (Tier 1 shell + CTA state machine; pure renderer of ReviewQueueSummary)
│  ├─ ReviewQueueBreakdown   (tappable per-source rows)        ← new
│  ├─ ReviewQueuePreview     (3-item word/sound preview)       ← extracted from current card
│  └─ Core1000DueHydrator    (client island; merges essential count via useCore1000DueCount) ← new
└─ ReviewProgressCard        (Tier 2: retention bar + weakest sound, honest empty state) ← from HomeRetentionCard
```

`ReviewQueueCard` holds no data logic — it renders summary + CTA state. The Core-1000
client island is isolated so the surrounding tree stays a Server Component.

## Data flow

1. `app/page.tsx` (Server) calls `getReviewQueueSummary(userId)` → server-known
   `{ total, newAvailable, sources }` (vocabulary + sounds).
2. `HomeReviewsSection` renders Tier 1 + Tier 2 from server data.
3. `Core1000DueHydrator` (client) reads Dexie, computes essential `count`, merges into
   total + inserts/updates the `essential` source row (re-sorted by count desc).
4. CTA state derives from `total` + `newAvailable`.

## Testing

- Unit: `getReviewQueueSummary` — due semantics (excludes new/null), ordering by count
  desc, tone threshold, only `count > 0` sources included.
- Unit: `useCore1000DueCount` merge logic (pure portion) — count derivation from queue.
- Component: `ReviewQueueCard` CTA state machine across the 3 states; `ReviewProgressCard`
  honest empty state (no hardcoded `/ð/`).
- Sounds due query: never-practiced sounds excluded from the count.

## Constraints honored

- No Supabase calls outside `lib/*/queries.ts` (`review-queue.ts` is a query module).
- No business logic in `/app` pages.
- Dexie stays client-side; offline mode unaffected (server renders without essential,
  hydrates after).
- Tailwind tokens only; `cn()` for conditionals; no inline styles except runtime values.
- Components ≤250 lines, ≤8 props, one responsibility.
```
