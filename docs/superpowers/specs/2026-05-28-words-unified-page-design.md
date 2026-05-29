# Spec: Unified /words Page (Vocabulary + Lexicon Merge)

**Date:** 2026-05-28  
**Status:** Approved  

## Problem

The app has two separate vocabulary-related pages (`/vocabulary` and `/lexicon`) that confuse users. Both deal with English words and learning, but they feel like disconnected features. The goal is to merge them into a single `/words` page without losing any functionality.

## Solution Overview

Replace `/vocabulary` and `/lexicon` with a unified `/words` page using three horizontal tabs: **Lexicon**, **My Words**, and **Decks**. Add cross-section actions: favorites, adding Lexicon words to My Words, creating decks from Lexicon categories, and a unified word search in the deck creation flow.

---

## Architecture

### Routes

| Old route | New behavior |
|---|---|
| `/vocabulary` | 301 redirect → `/words?tab=my-words` |
| `/lexicon` | 301 redirect → `/words?tab=lexicon` |
| `/lexicon/[id]` | Kept as-is (category detail page) |
| `/lexicon/[id]/practice` | Kept as-is |
| `/words` | New unified page |

### File structure

```
app/
  words/
    page.tsx               ← new unified page (replaces vocabulary/page.tsx)
  vocabulary/
    page.tsx               ← redirect to /words?tab=my-words
  lexicon/
    page.tsx               ← redirect to /words?tab=lexicon
    [id]/page.tsx          ← kept, minor additions
    [id]/practice/page.tsx ← kept unchanged

components/
  words/
    WordsHero.tsx          ← replaces VocabularyHero
    WordsTabs.tsx          ← replaces VocabTabs (3 tabs now)
  vocabulary/              ← kept, no changes
  lexicon/                 ← kept, minor additions to WordCard and LessonDetailHeader
```

### Tab IDs

```ts
type WordsTabId = "lexicon" | "my-words" | "decks";
```

---

## Tab: Lexicon

Identical to the current `/lexicon` page. No behavioral changes.

**Additions only:**
- Each `WordCard` gets a heart icon (favorites toggle) and an `+ Add` button to add the word to My Words.
- `LessonDetailHeader` gets a "Create deck from this category" button that opens `CreateDeckFromWordsModal` pre-populated with the category's word IDs.

---

## Tab: My Words

Identical to the current "Words" tab in `/vocabulary`. No changes.

**Additions only:**
- A "Favorites" filter chip alongside the existing filters. When active, shows only words with `is_favorite = true`.
- Heart icon on each `WordCard` to toggle favorite status.

---

## Tab: Decks

Identical to the current "Decks" tab in `/vocabulary`. No changes.

---

## Hero: WordsHero

Replaces `VocabularyHero`. Shows combined stats:

- Lexicon progress: "X / Y words learned" (from existing `getLexiconProgressByCategory`)
- My Words count: total words in personal word bank
- Decks count: total personal decks

CTA button changes based on active tab (same pattern as current `VocabularyHero`):
- Lexicon tab → no primary CTA (browse-only)
- My Words tab → "Add word"
- Decks tab → "Create deck"

---

## New Feature: Favorites

**Data model:** Add `is_favorite boolean DEFAULT false` column to the `word_bank` table. Requires a migration and RLS policy update (existing RLS covers the table; the column inherits it).

**UI:**
- Heart icon (`lucide-react Heart / HeartFill`) on `WordCard` in both Lexicon detail and My Words tab.
- In Lexicon: toggling heart on a word that is not yet in My Words automatically adds it to the Word Bank with `is_favorite = true`.
- In My Words: filter chip "Favorites" filters the list client-side.

**Queries:**
- `lib/word-bank/queries.ts`: add `toggleFavorite(wordId: string)` mutation.
- `lib/lexicon/queries.ts` (new file if needed): `addLexiconWordToWordBank(lexiconWord: WordEntry)` — imports word with `source_ref = lexiconWord.id`.

---

## New Feature: Unified Word Search in Create Deck Modal

`CreateDeckModal` and `ManageAddTab` get an extended search that queries two sources:

1. **My Words** (existing behavior) — words already in the user's word bank.
2. **Lexicon** — static word data from `getCategoryWords` across all categories.

**UI:** Results show a source badge: `My Words` (neutral) or `Lexicon` (accent). Adding a Lexicon word that is not in My Words auto-imports it to the word bank before adding to the deck.

**Implementation:** A new hook `useWordSearch(query)` that merges results from Dexie (My Words) and a local search over the lexicon index. No new API routes needed — lexicon data is static JSON available on the client via an import or a lightweight fetch.

---

## Data Flow

```
User taps ♥ on Lexicon WordCard
  → word not in Word Bank → addLexiconWordToWordBank() → toggleFavorite()
  → word already in Word Bank → toggleFavorite() only

User taps "+ Add" on Lexicon WordCard
  → word not in Word Bank → addLexiconWordToWordBank()
  → word already in Word Bank → no-op (button shows check)

User clicks "Create deck from category" in LessonDetailHeader
  → opens CreateDeckFromWordsModal with category word IDs
  → words not yet in Word Bank are imported on deck creation
```

---

## Migration

```sql
ALTER TABLE word_bank ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;
```

RLS: no changes needed (existing row-level policy covers all columns on the table).

---

## What Does NOT Change

- `/lexicon/[id]` and `/lexicon/[id]/practice` routing and components
- SRS logic, study modals, SM-2 algorithm
- Dexie schema (favorites live in Supabase `word_bank`, not Dexie)
- Offline mode — favorites sync when online, no offline writes needed for this flag
- All existing Vocabulary components (moved, not rewritten)

---

## Checklist (pre-implementation)

- [ ] Migration written and tested locally
- [ ] RLS verified on `word_bank` after migration
- [ ] `/vocabulary` and `/lexicon` redirects in place before removing pages
- [ ] `useWordSearch` hook covers both sources without duplicates
- [ ] Favorites filter works client-side without extra DB query
- [ ] No file exceeds 250 lines — `words/page.tsx` must delegate to tab components
