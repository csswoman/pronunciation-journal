# Unified /words Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `/vocabulary` and `/lexicon` into a single `/words` page with three tabs (Lexicon, My Words, Decks), add favorites (heart icon), add Lexicon→My Words import actions, and add unified word search in deck creation.

**Architecture:** The new `app/words/page.tsx` assembles all three tabs using existing components unchanged. Old routes redirect. New features (favorites, add-from-lexicon, create-deck-from-category) are additive changes to existing components. The `is_favorite` flag lives in Supabase `word_bank`; Dexie is not touched.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, Supabase, lucide-react, existing hooks (`useWords`, `useDeckData`).

---

## File Map

**New files:**
- `app/words/page.tsx` — unified page, tab routing
- `components/words/WordsTabs.tsx` — 3-tab component (Lexicon / My Words / Decks)
- `components/words/WordsHero.tsx` — merged hero with combined stats
- `hooks/useFavorite.ts` — toggle favorite state for a word bank entry
- `hooks/useWordSearch.ts` — merges My Words (Dexie) + Lexicon (static JSON) for deck search

**Modified files:**
- `app/vocabulary/page.tsx` — replace with redirect
- `app/lexicon/page.tsx` — replace with redirect
- `app/lexicon/[id]/page.tsx` — add "Create deck from category" button + `LessonDetailHeader` receives `onCreateDeck` prop
- `components/lexicon/lesson/LessonDetailHeader.tsx` — add `onCreateDeck?: () => void` prop + button
- `components/lexicon/lesson/WordCard.tsx` — add `onAddToMyWords?: () => void` + `isFavorite?: boolean` + `onToggleFavorite?: () => void` props
- `components/lexicon/lesson/WordBrowser.tsx` — wire `onAddToMyWords` and favorite props down to `WordCard`
- `components/vocabulary/words/WordsTab.tsx` — add "Favorites" filter chip; wire `onToggleFavorite` into `WordCard`
- `components/vocabulary/words/WordCard.tsx` — add heart icon + `isFavorite` + `onToggleFavorite` props
- `lib/word-bank/queries.ts` — add `toggleFavorite(wordBankId: string, value: boolean)`

**DB migration:**
- `supabase/migrations/YYYYMMDDHHMMSS_add_is_favorite_to_word_bank.sql`

---

## Task 1: DB Migration — add `is_favorite` to `word_bank`

**Files:**
- Create: `supabase/migrations/20260528120000_add_is_favorite_to_word_bank.sql`

- [ ] **Step 1: Write the migration file**

```sql
ALTER TABLE word_bank
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Apply the migration locally**

```bash
npx supabase db push
```

Expected: migration applied without error.

- [ ] **Step 3: Verify column exists**

In Supabase Studio or via SQL editor:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'word_bank' AND column_name = 'is_favorite';
```

Expected: one row, `data_type = boolean`, `column_default = false`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260528120000_add_is_favorite_to_word_bank.sql
git commit -m "feat(db): add is_favorite column to word_bank"
```

---

## Task 2: `toggleFavorite` query in `lib/word-bank/queries.ts`

**Files:**
- Modify: `lib/word-bank/queries.ts`

- [ ] **Step 1: Add the function at the end of the file**

```ts
/** Toggle the is_favorite flag for a word bank row owned by the current user. */
export async function toggleFavorite(
  wordBankId: string,
  value: boolean
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("word_bank")
    .update({ is_favorite: value })
    .eq("id", wordBankId);
  if (error) throw error;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/word-bank/queries.ts
git commit -m "feat(queries): add toggleFavorite to word-bank queries"
```

---

## Task 3: `useFavorite` hook

**Files:**
- Create: `hooks/useFavorite.ts`

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useState } from "react";
import { toggleFavorite } from "@/lib/word-bank/queries";

export function useFavorite(initialValue: boolean, wordBankId: string | null) {
  const [isFavorite, setIsFavorite] = useState(initialValue);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (!wordBankId || pending) return;
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    setPending(true);
    try {
      await toggleFavorite(wordBankId, next);
    } catch {
      setIsFavorite(!next); // revert on error
    } finally {
      setPending(false);
    }
  };

  return { isFavorite, toggle, pending };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useFavorite.ts
git commit -m "feat(hooks): add useFavorite hook"
```

---

## Task 4: Heart icon on `WordCard` (vocabulary/words)

The `WordCard` in `components/vocabulary/words/WordCard.tsx` is the personal word bank card. Add heart icon with favorite toggle.

**Files:**
- Modify: `components/vocabulary/words/WordCard.tsx`

- [ ] **Step 1: Read the current file**

Read `components/vocabulary/words/WordCard.tsx` to see its current props and layout before editing.

- [ ] **Step 2: Add props and heart button**

Add `isFavorite?: boolean` and `onToggleFavorite?: () => void` to the props interface. Inside the card's action area (wherever delete/retry buttons live), add:

```tsx
import { Heart } from "lucide-react";

// Inside the component, in the action row:
{onToggleFavorite && (
  <button
    onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    className={`p-1.5 rounded-full transition-colors ${
      isFavorite
        ? "text-error hover:text-error/70"
        : "text-fg-muted hover:text-fg"
    }`}
  >
    <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
  </button>
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/vocabulary/words/WordCard.tsx
git commit -m "feat(ui): add favorite heart icon to vocabulary WordCard"
```

---

## Task 5: Favorites filter chip in `WordsTab`

**Files:**
- Modify: `components/vocabulary/words/WordsTab.tsx`

- [ ] **Step 1: Extend `WordFilter` type and add filter logic**

Change the `WordFilter` type from:
```ts
type WordFilter = "all" | "ready" | "processing";
```
To:
```ts
type WordFilter = "all" | "ready" | "processing" | "favorites";
```

In `filteredWords` useMemo, add after the existing filters:
```ts
if (filterType === "favorites") result = result.filter(w => w.is_favorite);
```

- [ ] **Step 2: Add "Favorites" filter chip in the filter row**

In the filter chips map, add a new chip entry alongside the existing ones. After the `processing` chip rendering block, add:

```tsx
<button
  onClick={() => setFilterType("favorites")}
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
  style={{
    background: filterType === "favorites" ? "var(--primary)" : "transparent",
    borderColor: filterType === "favorites" ? "var(--primary)" : "var(--line-divider)",
    color: filterType === "favorites" ? "var(--on-primary)" : "var(--text-secondary)",
  }}
>
  <Heart size={11} fill={filterType === "favorites" ? "currentColor" : "none"} />
  Favorites
</button>
```

Add `import { Heart } from "lucide-react";` at the top.

- [ ] **Step 3: Wire `onToggleFavorite` into the WordCard rendering**

`WordsTab` receives `words: WordBankEntry[]` from the parent. The parent (`words/page.tsx`, coming in Task 9) will pass `onToggleFavorite`. For now, add it to `WordsTabProps`:

```ts
onToggleFavorite?: (id: string, value: boolean) => void;
```

Pass it through to each `WordCard`:
```tsx
<WordCard
  key={word.id}
  word={word}
  onRetry={onRetry}
  onDelete={onDelete}
  selected={selectedWordIds.has(word.id)}
  onSelect={selectMode ? onToggleWordSelection : undefined}
  isFavorite={!!word.is_favorite}
  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(word.id, !word.is_favorite) : undefined}
/>
```

- [ ] **Step 4: Commit**

```bash
git add components/vocabulary/words/WordsTab.tsx
git commit -m "feat(ui): add favorites filter chip and toggle wiring in WordsTab"
```

---

## Task 6: Heart icon + Add button on Lexicon `WordCard`

**Files:**
- Modify: `components/lexicon/lesson/WordCard.tsx`

- [ ] **Step 1: Add new props**

Add to `WordCardProps`:
```ts
isFavorite?: boolean;
onToggleFavorite?: () => void;
isInMyWords?: boolean;
onAddToMyWords?: () => void;
```

- [ ] **Step 2: Add buttons in the card footer**

In the footer row (where `Mark learned` and `Volume2` buttons are), add before the `Volume2` button:

```tsx
import { Heart, Plus, Check } from "lucide-react";

{onToggleFavorite && (
  <button
    onClick={onToggleFavorite}
    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    className={`p-1.5 rounded-full transition-colors ${
      isFavorite ? "text-error hover:text-error/70" : "text-fg-muted hover:text-fg"
    }`}
  >
    <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
  </button>
)}
{onAddToMyWords && (
  <button
    onClick={isInMyWords ? undefined : onAddToMyWords}
    disabled={isInMyWords}
    aria-label={isInMyWords ? "Already in My Words" : "Add to My Words"}
    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
      isInMyWords
        ? "text-fg-subtle border-border-subtle opacity-50 cursor-default"
        : "text-fg-muted border-border-default hover:text-fg hover:border-border-strong"
    }`}
  >
    {isInMyWords ? <Check size={11} /> : <Plus size={11} />}
    {isInMyWords ? "In My Words" : "Add"}
  </button>
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/lexicon/lesson/WordCard.tsx
git commit -m "feat(ui): add favorite + add-to-my-words buttons on Lexicon WordCard"
```

---

## Task 7: Wire Lexicon WordCard actions in `WordBrowser`

`WordBrowser` renders the `WordGrid` which renders `WordCard`. The favorite/add state needs to be computed per-word and passed down.

**Files:**
- Modify: `components/lexicon/lesson/WordBrowser.tsx`
- Modify: `components/lexicon/lesson/WordGrid.tsx`

- [ ] **Step 1: Read current WordBrowser and WordGrid**

Read `components/lexicon/lesson/WordBrowser.tsx` and `components/lexicon/lesson/WordGrid.tsx` to understand current props before editing.

- [ ] **Step 2: Extend WordGrid's Word type**

In `components/lexicon/lesson/WordGrid.tsx`, add to the `Word` type (or its extended interface):
```ts
isFavorite?: boolean;
wordBankId?: string | null; // word_bank row id if this lexicon word is imported
onToggleFavorite?: () => void;
onAddToMyWords?: () => void;
```

Pass these through from `WordGrid` down to `WordCard`.

- [ ] **Step 3: Extend WordBrowser props**

Add to `WordBrowserProps`:
```ts
wordBankMap?: Map<string, { id: string; isFavorite: boolean }>;
onToggleFavorite?: (wordBankId: string, value: boolean) => void;
onAddToMyWords?: (lexiconWord: { id: string; word: string; definition: string; example?: string }) => void;
```

Wire these into each word passed to `WordGrid`:
```tsx
isFavorite={wordBankMap?.get(word.id)?.isFavorite ?? false}
wordBankId={wordBankMap?.get(word.id)?.id ?? null}
onToggleFavorite={wordBankMap?.get(word.id)?.id
  ? () => onToggleFavorite?.(wordBankMap.get(word.id)!.id, !wordBankMap.get(word.id)!.isFavorite)
  : undefined}
onAddToMyWords={!wordBankMap?.get(word.id)
  ? () => onAddToMyWords?.({ id: word.id, word: word.word, definition: word.definition, example: word.example })
  : undefined}
isInMyWords={!!wordBankMap?.get(word.id)}
```

- [ ] **Step 4: Commit**

```bash
git add components/lexicon/lesson/WordBrowser.tsx components/lexicon/lesson/WordGrid.tsx
git commit -m "feat(ui): wire favorite and add-to-my-words actions through WordBrowser/WordGrid"
```

---

## Task 8: "Create deck from category" button in `LessonDetailHeader`

**Files:**
- Modify: `components/lexicon/lesson/LessonDetailHeader.tsx`
- Modify: `app/lexicon/[id]/page.tsx`

- [ ] **Step 1: Add `onCreateDeck` prop to LessonDetailHeader**

Add to `LessonDetailHeaderProps`:
```ts
onCreateDeck?: () => void;
```

Add the button next to the existing right-side stats block:
```tsx
import { Layers } from "lucide-react";
import Button from "@/components/ui/Button";

{onCreateDeck && (
  <Button variant="secondary" size="sm" onClick={onCreateDeck} icon={<Layers size={14} />}>
    Create deck
  </Button>
)}
```

`LessonDetailHeader` is a Server Component today — adding a button with `onClick` requires making the file a Client Component. Add `"use client";` at the top.

- [ ] **Step 2: Update `app/lexicon/[id]/page.tsx` to pass `onCreateDeck`**

Since `LessonDetailHeader` is now a Client Component, this page remains a Server Component but passes a client action. The cleanest way: extract a thin client wrapper `LessonDetailActions.tsx` in `components/lexicon/lesson/` that owns the `showCreateDeck` state and renders both `LessonDetailHeader` and `CreateDeckFromWordsModal`.

Create `components/lexicon/lesson/LessonDetailActions.tsx`:
```tsx
"use client";

import { useState } from "react";
import { LessonDetailHeader } from "./LessonDetailHeader";
import { CreateDeckFromWordsModal } from "@/components/vocabulary/decks/CreateDeckFromWordsModal";
import { useDeckData } from "@/hooks/useDeckData";
import type { Word } from "./WordGrid";

interface LessonDetailActionsProps {
  title: string;
  totalWords: number;
  wordsLearned: number;
  wordsReviewing: number;
  color: string;
  categoryWordIds: string[];
  words: Word[];
}

export function LessonDetailActions({
  title, totalWords, wordsLearned, wordsReviewing, color, categoryWordIds, words,
}: LessonDetailActionsProps) {
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const { addDeck } = useDeckData();

  return (
    <>
      <LessonDetailHeader
        title={title}
        totalWords={totalWords}
        wordsLearned={wordsLearned}
        wordsReviewing={wordsReviewing}
        color={color}
        onCreateDeck={() => setShowCreateDeck(true)}
      />
      {showCreateDeck && (
        <CreateDeckFromWordsModal
          wordIds={categoryWordIds}
          onClose={() => setShowCreateDeck(false)}
          onCreated={deck => { addDeck(deck); setShowCreateDeck(false); }}
        />
      )}
    </>
  );
}
```

In `app/lexicon/[id]/page.tsx`, replace `<LessonDetailHeader ... />` with `<LessonDetailActions ... categoryWordIds={lexiconIds} />`.

Note: `CreateDeckFromWordsModal` currently links `word_bank` rows by `word_id`. For lexicon words not yet in the word bank, they need to be imported first. Update `LessonDetailActions.handleCreate` to call `markLexiconWordLearned` for each word before creating the deck — but this is handled by `CreateDeckFromWordsModal` receiving `wordIds` which are already word_bank IDs. Instead, add a pre-import step: before opening the modal, import all category words via `markLexiconWordLearned` and collect their word_bank IDs. Show a brief "Importing…" state while this runs.

Update `LessonDetailActions`:
```tsx
const [importedIds, setImportedIds] = useState<string[] | null>(null);
const [importing, setImporting] = useState(false);

const handleCreateDeck = async () => {
  setImporting(true);
  const results = await Promise.all(
    words.map(w =>
      markLexiconWordLearned({
        sourceRef: w.id,
        text: w.word,
        definition: w.definition ?? "",
        example: w.example ?? null,
      })
    )
  );
  setImportedIds(results.map(r => r.entry.id));
  setImporting(false);
  setShowCreateDeck(true);
};
```

Import `markLexiconWordLearned` from `@/lib/word-bank/queries`.

- [ ] **Step 3: Commit**

```bash
git add components/lexicon/lesson/LessonDetailHeader.tsx \
        components/lexicon/lesson/LessonDetailActions.tsx \
        app/lexicon/[id]/page.tsx
git commit -m "feat(ui): add create-deck-from-category to Lexicon detail page"
```

---

## Task 9: `WordsTabs` and `WordsHero` components

**Files:**
- Create: `components/words/WordsTabs.tsx`
- Create: `components/words/WordsHero.tsx`

- [ ] **Step 1: Create `WordsTabs.tsx`**

```tsx
"use client";

import { BookOpen, BookMarked, Layers } from "lucide-react";

export const WORDS_TABS = [
  { id: "lexicon",   label: "Lexicon",   icon: BookOpen },
  { id: "my-words",  label: "My Words",  icon: BookMarked },
  { id: "decks",     label: "Decks",     icon: Layers },
] as const;

export type WordsTabId = (typeof WORDS_TABS)[number]["id"];

interface WordsTabsProps {
  active: WordsTabId;
  onChange: (id: WordsTabId) => void;
}

export default function WordsTabs({ active, onChange }: WordsTabsProps) {
  return (
    <div className="flex w-full border-b border-border-default">
      {WORDS_TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm -mb-px border-b-2 transition-colors whitespace-nowrap cursor-pointer bg-transparent ${
              isActive
                ? "font-semibold text-fg border-primary"
                : "font-normal text-fg-muted border-transparent"
            }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `WordsHero.tsx`**

```tsx
"use client";

import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import type { WordsTabId } from "@/components/words/WordsTabs";

interface WordsHeroProps {
  activeTab: WordsTabId;
  myWordsCount: number;
  deckCount: number;
  lexiconLearned: number;
  lexiconTotal: number;
  wordsLoading: boolean;
  onAddWord: () => void;
  onAddDeck: () => void;
}

export function WordsHero({
  activeTab,
  myWordsCount,
  deckCount,
  lexiconLearned,
  lexiconTotal,
  wordsLoading,
  onAddWord,
  onAddDeck,
}: WordsHeroProps) {
  const titles: Record<WordsTabId, string> = {
    lexicon: "Lexicon",
    "my-words": "My Words",
    decks: "Decks",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 mb-6 bg-gradient-to-br from-surface-raised to-surface-sunken">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] opacity-60 mb-0.5">
            Words
          </p>
          <h1 className="text-2xl font-bold leading-[1.15] text-fg mb-4">
            {titles[activeTab]}
          </h1>

          {!wordsLoading && (
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[12px] text-fg-subtle">
              <span>
                <span className="font-semibold text-fg">{lexiconLearned}</span>
                {" / "}
                <span>{lexiconTotal}</span>
                {" Lexicon learned"}
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="font-semibold text-fg">{myWordsCount}</span>
                {" My Words"}
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="font-semibold text-fg">{deckCount}</span>
                {" Decks"}
              </span>
            </div>
          )}
        </div>

        {activeTab === "my-words" && (
          <Button onClick={onAddWord} icon={<Plus size={15} />} size="sm">New Word</Button>
        )}
        {activeTab === "decks" && (
          <Button onClick={onAddDeck} icon={<Plus size={15} />} size="sm">New Deck</Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/words/WordsTabs.tsx components/words/WordsHero.tsx
git commit -m "feat(ui): add WordsTabs and WordsHero components"
```

---

## Task 10: `useWordSearch` hook for unified deck search

**Files:**
- Create: `hooks/useWordSearch.ts`

- [ ] **Step 1: Create the hook**

```ts
"use client";

import { useMemo, useState, useEffect } from "react";
import type { WordBankEntry } from "@/lib/word-bank/types";

export interface WordSearchResult {
  id: string;
  text: string;
  meaning: string | null;
  source: "my-words" | "lexicon";
  wordBankId?: string; // set if already in word bank
}

interface LexiconIndexEntry {
  id: string;
  word: string;
  definition: string;
  example?: string;
}

export function useWordSearch(query: string, myWords: WordBankEntry[]) {
  const [lexiconIndex, setLexiconIndex] = useState<LexiconIndexEntry[]>([]);

  useEffect(() => {
    if (query.length < 2) return;
    fetch("/lexicon/index.json")
      .then(r => r.json())
      .then((categories: Array<{ id: string }>) => {
        // index.json only has category metadata; we need a flat word list.
        // Fetch all category files and flatten. Cache in module scope.
        return Promise.all(
          categories.map(cat =>
            fetch(`/lexicon/${cat.id}.json`).then(r => r.json())
          )
        );
      })
      .then((arrays: LexiconIndexEntry[][]) => {
        setLexiconIndex(arrays.flat());
      })
      .catch(() => {/* silent — lexicon search is best-effort */});
  }, [query.length >= 2]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo<WordSearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const myWordResults: WordSearchResult[] = myWords
      .filter(w => w.text.toLowerCase().includes(q) || (w.meaning ?? "").toLowerCase().includes(q))
      .slice(0, 10)
      .map(w => ({
        id: w.id,
        text: w.text,
        meaning: w.meaning ?? null,
        source: "my-words" as const,
        wordBankId: w.id,
      }));

    const myWordTexts = new Set(myWords.map(w => w.text.toLowerCase()));

    const lexiconResults: WordSearchResult[] = lexiconIndex
      .filter(
        w =>
          !myWordTexts.has(w.word.toLowerCase()) &&
          (w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map(w => ({
        id: w.id,
        text: w.word,
        meaning: w.definition,
        source: "lexicon" as const,
      }));

    return [...myWordResults, ...lexiconResults];
  }, [query, myWords, lexiconIndex]);

  return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useWordSearch.ts
git commit -m "feat(hooks): add useWordSearch hook (My Words + Lexicon)"
```

---

## Task 11: Wire `useWordSearch` into `ManageAddTab`

**Files:**
- Modify: `components/vocabulary/decks/ManageAddTab.tsx`

- [ ] **Step 1: Add search results UI to ManageAddTab**

Extend `ManageAddTabProps`:
```ts
searchResults?: import("@/hooks/useWordSearch").WordSearchResult[];
onSelectSearchResult?: (result: import("@/hooks/useWordSearch").WordSearchResult) => void;
```

Below the word input, if `searchResults` has items, render a dropdown list:

```tsx
{searchResults && searchResults.length > 0 && manualWord.trim().length >= 2 && (
  <ul className="border border-border-default rounded-xl bg-surface-raised overflow-hidden divide-y divide-border-subtle">
    {searchResults.map(r => (
      <li key={r.id}>
        <button
          type="button"
          onClick={() => onSelectSearchResult?.(r)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-sunken transition-colors text-left"
        >
          <span>
            <span className="font-medium text-fg">{r.text}</span>
            {r.meaning && (
              <span className="ml-2 text-xs text-fg-muted truncate max-w-[200px] inline-block align-middle">
                {r.meaning}
              </span>
            )}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-2 shrink-0 ${
              r.source === "lexicon"
                ? "bg-primary/10 text-primary"
                : "bg-surface-sunken text-fg-subtle"
            }`}
          >
            {r.source === "lexicon" ? "Lexicon" : "My Words"}
          </span>
        </button>
      </li>
    ))}
  </ul>
)}
```

- [ ] **Step 2: Commit**

```bash
git add components/vocabulary/decks/ManageAddTab.tsx
git commit -m "feat(ui): add unified word search results to ManageAddTab"
```

---

## Task 12: Main `app/words/page.tsx` — unified page

**Files:**
- Create: `app/words/page.tsx`

- [ ] **Step 1: Create the unified page**

This page mirrors the structure of the current `app/vocabulary/page.tsx` but adds the Lexicon tab and favorites wiring. Keep it under 250 lines by delegating to existing tab components.

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import Button from "@/components/ui/Button";
import WordsTabs, { type WordsTabId } from "@/components/words/WordsTabs";
import { WordsHero } from "@/components/words/WordsHero";
import { WordsTab } from "@/components/vocabulary/words/WordsTab";
import { DecksTab } from "@/components/vocabulary/decks/DecksTab";
import { LexiconContent } from "@/components/lexicon/LexiconContent";

import { useWords } from "@/hooks/useWords";
import { useDeckData } from "@/hooks/useDeckData";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { WordSelectionBar } from "@/components/vocabulary/words/WordSelectionBar";
import { CreateDeckModal } from "@/components/vocabulary/decks/CreateDeckModal";
import { CreateDeckFromWordsModal } from "@/components/vocabulary/decks/CreateDeckFromWordsModal";
import { AddToExistingDeckModal } from "@/components/vocabulary/decks/AddToExistingDeckModal";
import { EditDeckModal } from "@/components/vocabulary/decks/EditDeckModal";
import { StudyModal } from "@/components/vocabulary/decks/StudyModal";
import { StudyModalWordBank } from "@/components/vocabulary/decks/StudyModalWordBank";
import { ManageDrawer } from "@/components/vocabulary/decks/ManageDrawer";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { wordBankSource } from "@/lib/decks/study-source";
import { useAuth } from "@/components/auth/AuthProvider";
import { toggleFavorite } from "@/lib/word-bank/queries";
import { computeStrengthStats } from "@/lib/word-bank/strength";

// Lexicon stats are loaded server-side; pass minimal props for the hero.
const LEXICON_TOTAL_PLACEHOLDER = 0; // replaced in WordsHero when tab is "lexicon"

export default function WordsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as WordsTabId | null) ?? "lexicon";
  const [activeTab, setActiveTab] = useState<WordsTabId>(initialTab);

  const handleTabChange = (tab: WordsTabId) => {
    setActiveTab(tab);
    router.replace(`/words?tab=${tab}`, { scroll: false });
  };

  // ── Words ────────────────────────────────────────────────────────────────
  const { words, loading: wordsLoading, error: wordsError, addWord, removeWord, retry } = useWords();
  const [showAddWord, setShowAddWord] = useState(false);
  const [initialWordText, setInitialWordText] = useState("");
  const [wordActionError, setWordActionError] = useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showCreateFromWords, setShowCreateFromWords] = useState(false);
  const [showAddToExisting, setShowAddToExisting] = useState(false);

  useEffect(() => {
    if (!wordActionError) return;
    const t = setTimeout(() => setWordActionError(null), 4000);
    return () => clearTimeout(t);
  }, [wordActionError]);

  useEffect(() => {
    if (activeTab !== "my-words") return;
    const onKey = (e: KeyboardEvent) => {
      if (showAddWord) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowAddWord(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddWord, activeTab]);

  const toggleWordSelection = (id: string) => {
    setSelectedWordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleSelectMode = () => {
    setSelectMode(prev => { if (prev) setSelectedWordIds(new Set()); return !prev; });
  };

  const handleAddWord = async (input: { text: string; context?: string | null; deckId?: string | null }) => {
    try { await addWord(input); } catch (err) {
      setWordActionError(err instanceof Error ? err.message : "Failed to save word");
    }
  };

  const handleToggleFavorite = async (wordId: string, value: boolean) => {
    try { await toggleFavorite(wordId, value); } catch { /* silent */ }
  };

  const wordStats = useMemo(() => ({
    total: words.length,
    ready: words.filter(w => w.status === "ready").length,
    processing: words.filter(w => w.status === "processing").length,
    strength: computeStrengthStats(words),
  }), [words]);

  // ── Decks ────────────────────────────────────────────────────────────────
  const { decks, counts, loading: decksLoading, addDeck, updateDeck, removeDeck, setWordCount } = useDeckData();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [manageDeckId, setManageDeckId] = useState<string | null>(null);
  const [wordBankStudyDeckId, setWordBankStudyDeckId] = useState<string | null>(null);

  const editDeck = decks.find(d => d.id === editDeckId) ?? null;
  const studyDeck = decks.find(d => d.id === studyDeckId) ?? null;
  const manageDeck = decks.find(d => d.id === manageDeckId) ?? null;
  const wordBankStudyDeck = decks.find(d => d.id === wordBankStudyDeckId) ?? null;

  const handleStudyDeck = async (deckId: string) => {
    if (!user) return;
    const { count } = await getSupabaseBrowserClient()
      .from("word_bank_decks")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId);
    if ((count ?? 0) > 0) setWordBankStudyDeckId(deckId);
    else setStudyDeckId(deckId);
  };

  const handleDeleteDeck = async (id: string) => {
    const name = decks.find(d => d.id === id)?.name;
    if (!confirm(`Delete deck "${name}"? This cannot be undone.`)) return;
    await getSupabaseBrowserClient().from("decks").delete().eq("id", id);
    removeDeck(id);
    setEditDeckId(null);
  };

  if (wordBankStudyDeck && user) {
    return (
      <StudyModalWordBank
        source={wordBankSource({ deckId: wordBankStudyDeck.id, userId: user.id, deckLabel: wordBankStudyDeck.name })}
        onClose={() => setWordBankStudyDeckId(null)}
      />
    );
  }
  if (studyDeck) {
    return (
      <>
        <StudyModal deck={studyDeck} onClose={() => setStudyDeckId(null)} />
        {manageDeck && (
          <ManageDrawer
            deck={manageDeck}
            onClose={() => setManageDeckId(null)}
            onWordCountChange={count => setWordCount(manageDeckId!, count)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageLayout cardWrapper={false}>
        <WordsHero
          activeTab={activeTab}
          myWordsCount={words.length}
          deckCount={decks.length}
          lexiconLearned={0}
          lexiconTotal={0}
          wordsLoading={wordsLoading}
          onAddWord={() => setShowAddWord(true)}
          onAddDeck={() => setShowCreateDeck(true)}
        />

        <div className="mb-3">
          <WordsTabs active={activeTab} onChange={handleTabChange} />
        </div>

        <Section spacing="lg">
          {activeTab === "lexicon" && <LexiconContent lessons={[]} />}

          {activeTab === "my-words" && (
            <WordsTab
              words={words}
              loading={wordsLoading}
              error={wordsError}
              actionError={wordActionError}
              wordStats={wordStats}
              selectedWordIds={selectedWordIds}
              selectMode={selectMode}
              onToggleSelectMode={handleToggleSelectMode}
              onToggleWordSelection={toggleWordSelection}
              onRetry={async id => { try { await retry(id); } catch { setWordActionError("Failed to retry"); } }}
              onDelete={async id => { try { await removeWord(id); } catch { setWordActionError("Failed to delete"); } }}
              onOpenAddWord={(text) => { setInitialWordText(text ?? ""); setShowAddWord(true); }}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {activeTab === "decks" && (
            <DecksTab
              decks={decks}
              counts={{ ...counts }}
              loading={decksLoading}
              onStudy={handleStudyDeck}
              onManage={setManageDeckId}
              onEdit={setEditDeckId}
              onDelete={handleDeleteDeck}
              onCreateNew={() => setShowCreateDeck(true)}
            />
          )}
        </Section>
      </PageLayout>

      <Button
        onClick={() => activeTab === "my-words" ? setShowAddWord(true) : setShowCreateDeck(true)}
        aria-label={activeTab === "my-words" ? "Quick add word" : "Create deck"}
        className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl"
        size="icon"
      >
        <Plus size={20} />
      </Button>

      {selectMode && selectedWordIds.size > 0 && (
        <WordSelectionBar
          count={selectedWordIds.size}
          onClear={() => setSelectedWordIds(new Set())}
          onCreateDeck={() => setShowCreateFromWords(true)}
          onAddToExistingDeck={() => setShowAddToExisting(true)}
        />
      )}

      <QuickAddModal
        open={showAddWord}
        onClose={() => { setShowAddWord(false); setInitialWordText(""); }}
        onSubmit={handleAddWord}
        initialText={initialWordText}
      />

      {showCreateFromWords && (
        <CreateDeckFromWordsModal
          wordIds={Array.from(selectedWordIds)}
          onClose={() => setShowCreateFromWords(false)}
          onCreated={deck => {
            addDeck(deck);
            setShowCreateFromWords(false);
            setSelectedWordIds(new Set());
            handleTabChange("decks");
          }}
        />
      )}
      {showAddToExisting && (
        <AddToExistingDeckModal
          wordIds={Array.from(selectedWordIds)}
          decks={decks}
          onClose={() => setShowAddToExisting(false)}
          onAdded={() => { setShowAddToExisting(false); setSelectedWordIds(new Set()); }}
        />
      )}
      {showCreateDeck && (
        <CreateDeckModal
          onClose={() => setShowCreateDeck(false)}
          onCreated={deck => { addDeck(deck); setShowCreateDeck(false); }}
        />
      )}
      {editDeck && (
        <EditDeckModal
          deck={editDeck}
          onClose={() => setEditDeckId(null)}
          onUpdated={deck => { updateDeck(deck); setEditDeckId(null); }}
          onDelete={() => handleDeleteDeck(editDeck.id)}
        />
      )}
      {manageDeck && (
        <ManageDrawer
          deck={manageDeck}
          onClose={() => setManageDeckId(null)}
          onWordCountChange={count => setWordCount(manageDeckId!, count)}
        />
      )}
    </>
  );
}
```

Note: `LexiconContent` currently requires `lessons` loaded server-side. Since `words/page.tsx` is a Client Component, you need to either: (a) fetch lexicon lessons client-side, or (b) wrap `LexiconContent` in a server component child. The cleanest solution is option (b): create `components/words/LexiconTab.tsx` as a Server Component that fetches and renders lexicon content, and render it inside the `activeTab === "lexicon"` branch. Add this as a follow-up in Task 12b below.

- [ ] **Step 2: Commit**

```bash
git add app/words/page.tsx
git commit -m "feat(pages): add unified /words page with three tabs"
```

---

## Task 12b: `LexiconTab` server component wrapper

**Files:**
- Create: `components/words/LexiconTab.tsx`

- [ ] **Step 1: Create LexiconTab as a Server Component**

```tsx
import { getCategories, getCategoryWords, getPreviewTags } from "@/lib/lexicon/categories";
import { getLexiconProgressByCategory } from "@/lib/word-bank/server-queries";
import { LexiconHeader } from "@/components/lexicon";
import { LexiconContent } from "@/components/lexicon/LexiconContent";
import type { LessonViewModel } from "@/lib/lexicon/types";

export async function LexiconTab() {
  const categories = getCategories();
  const categoryWordIds = new Map(
    categories.map(cat => [cat.id, getCategoryWords(cat.id).map(w => w.id)])
  );

  let progressMap: Map<string, { mastered: number; reviewing: number }>;
  try {
    progressMap = await getLexiconProgressByCategory(categoryWordIds);
  } catch {
    progressMap = new Map();
  }

  const lessons: LessonViewModel[] = categories.map(cat => {
    const { mastered = 0 } = progressMap.get(cat.id) ?? {};
    const progress = cat.total > 0 ? Math.round((mastered / cat.total) * 100) : 0;
    return {
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      color: cat.color,
      totalWords: cat.total,
      wordsCompleted: mastered,
      progress,
      tags: getPreviewTags(cat.id),
    };
  });

  const totalWordsLearned = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
  const totalWords = lessons.reduce((sum, l) => sum + l.totalWords, 0);
  const percentageDone = totalWords > 0 ? (totalWordsLearned / totalWords) * 100 : 0;

  return (
    <>
      <LexiconHeader
        wordsLearned={totalWordsLearned}
        totalWords={totalWords}
        percentageDone={percentageDone}
      />
      <LexiconContent lessons={lessons} />
    </>
  );
}
```

- [ ] **Step 2: Update `app/words/page.tsx` to use LexiconTab**

Replace the `LexiconContent` import and usage:

```tsx
// Remove:
import { LexiconContent } from "@/components/lexicon/LexiconContent";

// Add:
import { LexiconTab } from "@/components/words/LexiconTab";

// Replace in JSX:
{activeTab === "lexicon" && <LexiconTab />}
```

However, `LexiconTab` is async (Server Component) and `words/page.tsx` is a Client Component — you cannot render an async Server Component directly inside a Client Component. The solution: make `app/words/page.tsx` a Server Component that wraps the client interaction in a separate `WordsClient.tsx`.

Refactor:
- `app/words/page.tsx` → Server Component, fetches lexicon data, renders `<WordsClient lexiconLessons={lessons} ... />`
- `components/words/WordsClient.tsx` → Client Component with all the state (moved from page.tsx)

This is the same pattern used in `app/lexicon/page.tsx` today.

- [ ] **Step 3: Create `components/words/WordsClient.tsx`**

Move all client-side state from `app/words/page.tsx` into `WordsClient.tsx`. The component accepts:
```ts
interface WordsClientProps {
  lexiconLessons: LessonViewModel[];
  lexiconTotal: number;
  lexiconLearned: number;
}
```

And renders `WordsHero`, `WordsTabs`, the three tab branches, and all modals — exactly as the page did.

- [ ] **Step 4: Update `app/words/page.tsx` as Server Component**

```tsx
import { getCategories, getCategoryWords, getPreviewTags } from "@/lib/lexicon/categories";
import { getLexiconProgressByCategory } from "@/lib/word-bank/server-queries";
import { WordsClient } from "@/components/words/WordsClient";
import type { LessonViewModel } from "@/lib/lexicon/types";

export default async function WordsPage() {
  const categories = getCategories();
  const categoryWordIds = new Map(
    categories.map(cat => [cat.id, getCategoryWords(cat.id).map(w => w.id)])
  );

  let progressMap: Map<string, { mastered: number; reviewing: number }>;
  try {
    progressMap = await getLexiconProgressByCategory(categoryWordIds);
  } catch {
    progressMap = new Map();
  }

  const lessons: LessonViewModel[] = categories.map(cat => {
    const { mastered = 0 } = progressMap.get(cat.id) ?? {};
    const progress = cat.total > 0 ? Math.round((mastered / cat.total) * 100) : 0;
    return {
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      color: cat.color,
      totalWords: cat.total,
      wordsCompleted: mastered,
      progress,
      tags: getPreviewTags(cat.id),
    };
  });

  const lexiconLearned = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
  const lexiconTotal = lessons.reduce((sum, l) => sum + l.totalWords, 0);

  return (
    <WordsClient
      lexiconLessons={lessons}
      lexiconLearned={lexiconLearned}
      lexiconTotal={lexiconTotal}
    />
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/words/page.tsx components/words/WordsClient.tsx components/words/LexiconTab.tsx
git commit -m "feat(pages): refactor words page to server/client split for lexicon data"
```

---

## Task 13: Redirect old routes

**Files:**
- Modify: `app/vocabulary/page.tsx`
- Modify: `app/lexicon/page.tsx`

- [ ] **Step 1: Replace `app/vocabulary/page.tsx` with redirect**

```tsx
import { redirect } from "next/navigation";

export default function VocabularyPage() {
  redirect("/words?tab=my-words");
}
```

- [ ] **Step 2: Replace `app/lexicon/page.tsx` with redirect**

```tsx
import { redirect } from "next/navigation";

export default function LexiconPage() {
  redirect("/words?tab=lexicon");
}
```

- [ ] **Step 3: Update nav links**

Search for references to `/vocabulary` and `/lexicon` in nav/sidebar components and update them to `/words`.

Run:
```bash
grep -r '"/vocabulary"' components/ app/ --include="*.tsx" -l
grep -r '"/lexicon"' components/ app/ --include="*.tsx" -l
```

For each file found: change `/vocabulary` → `/words?tab=my-words` and `/lexicon` → `/words?tab=lexicon` (only in navigation links, not in the redirect files just created).

- [ ] **Step 4: Update breadcrumb link in LessonDetailHeader**

In `components/lexicon/lesson/LessonDetailHeader.tsx`, change the breadcrumb href:
```tsx
// Before:
<Link href="/lexicon" ...>Lexicon</Link>

// After:
<Link href="/words?tab=lexicon" ...>Lexicon</Link>
```

- [ ] **Step 5: Commit**

```bash
git add app/vocabulary/page.tsx app/lexicon/page.tsx components/lexicon/lesson/LessonDetailHeader.tsx
git commit -m "feat(routing): redirect /vocabulary and /lexicon to /words"
```

---

## Task 14: Final verification

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Run the app and verify**

```bash
npm run dev
```

Verify manually:
1. `/words` loads with Lexicon tab active
2. Switching to My Words and Decks tabs works; URL updates
3. `/vocabulary` → redirects to `/words?tab=my-words`
4. `/lexicon` → redirects to `/words?tab=lexicon`
5. `/lexicon/[id]` detail page still works; "Create deck" button appears
6. Heart icon appears on Lexicon WordCards
7. "+ Add" button appears on Lexicon WordCards; shows "In My Words" after click
8. Favorites filter chip appears in My Words tab
9. Heart on My Words WordCard toggles favorite status
10. Nav links point to `/words`

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat: unified /words page — merge Vocabulary and Lexicon"
```
