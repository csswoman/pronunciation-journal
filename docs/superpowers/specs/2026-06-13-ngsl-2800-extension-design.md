# Design: Extend Core 1000 to NGSL 2800 (Essential Words)

**Date:** 2026-06-13  
**Status:** Approved  

## Overview

Extend the existing Core 1000 vocabulary practice feature to cover the full New General Service List (NGSL) up to rank 2800. The extension reuses all existing infrastructure — data loader, SRS queue, session engine, and UI — with minimal code changes. The feature is always available to users (no unlock requirement).

## Goals

- Add ~1800 new vocabulary words (ranks 1001–2800) from the NGSL
- Reuse the existing `CoreWord` schema, SRS namespace (`c1k:`), and session queue without modification
- Rename the feature from "Core 1000" to "Essential Words" in all user-visible text

## Non-Goals

- A separate unlock/progression gate for the NGSL words
- A new SRS namespace or separate practice screen
- Simplified word schema (no IPA omission)
- Generating data automatically via script — all chunks are hand-curated

## Data Model

No type changes. `CoreWord` already has all required fields:

```ts
interface CoreWord {
  rank: number;         // extends to 1001–2800 with this change
  word: string;
  pos: CorePos;
  ipa_strong: string;
  ipa_weak?: string;
  example_sentence: string;
  sentence_ipa?: string;
  cefr_level: CefrLevel;
}
```

**SRS namespace:** `c1k:` prefix is retained for all words rank 1–2800. Words are undifferentiated in the SRS pool — rank order handles sequencing.

## Code Changes

### `lib/core-1000/types.ts`

```ts
// Before
export const MAX_CHUNKS = 10;  // covers rank 1–1000

// After
export const MAX_CHUNKS = 28;  // covers rank 1–2800
```

### `lib/core-1000/schema.ts`

```ts
// Before
rank: z.number().int().min(1).max(1000),

// After
rank: z.number().int().min(1).max(2800),
```

### UI strings

All user-visible occurrences of "Core 1000" are replaced with "Essential Words". Internal identifiers (`lib/core-1000/`, `CoreWord`, `c1k:`, `CORE1000_PREFIX`) are unchanged.

Progress text should avoid hardcoded totals (e.g. "1000 words"). Prefer dynamic counts like "X words learned" or "X / {total} words".

## Data Files

Add chunks to `public/core-1000/`:

```
words-011.json   rank 1001–1100
words-012.json   rank 1101–1200
...
words-028.json   rank 2701–2800
```

Each file follows the existing format:

```json
{
  "version": 1,
  "entries": [ /* 100 CoreWord objects */ ]
}
```

Constraints enforced by the existing loader and Zod schema:
- Exactly 100 entries per chunk
- Ranks must be contiguous and match position in chunk
- `ipa_strong` required for all entries
- `sentence_ipa` required when `ipa_weak` is present

## Session Behavior

No changes to `queue.ts` or `engine.ts`. `buildSessionQueue` receives the full sorted word array — with 2800 entries it simply continues introducing words in rank order after rank 1000. The daily new-word quota (`NEW_CARDS_PER_DAY = 10`) is unchanged.

## What Does NOT Change

- `lib/core-1000/data.ts` — loader auto-detects chunks up to `MAX_CHUNKS`
- `lib/core-1000/queue.ts` — queue builder is already rank-agnostic
- `lib/practice/` — session engine is content-agnostic
- Dexie schema — SRS entries already use open-ended `wordId` strings
- Routing — no new routes needed

## Rollout

Content can be added incrementally. The loader handles a partially curated dataset (chunks must be contiguous from 001, but the dataset can stop at any chunk boundary). Users with an incomplete dataset simply see fewer available words — no errors.
