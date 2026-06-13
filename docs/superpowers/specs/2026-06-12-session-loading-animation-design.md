# Spec: SessionLoadingShell — Word Carousel Animation

**Date:** 2026-06-12
**Status:** Approved

## Problem

`SessionLoadingShell` currently shows only a static spinner and text "Cargando sesión…" with no animation and no connection to the app's identity as a pronunciation/vocabulary learning tool. The loading moment is wasted.

## Goal

Replace the spinner with a rotating word carousel that shows 10 user words (with IPA) cycling during load. If the user has no words yet, show a curated fallback set. The wait becomes a micro-educational moment that reinforces the app's personality.

## Design

### Visual layout

```
                thought
                /θɔːt/
        ▓▓▓▓▓▓░░░░░░░░░░░░░░░░     ← indeterminate progress bar
             Preparando tu sesión
```

- One word centered at a time, with IPA on the line below (hidden if null)
- Indeterminate progress bar underneath (primary color, slides left to right on loop)
- Label "Preparando tu sesión" in caption/tertiary style below the bar
- Full-screen centered, same layout for both `focusUi` and plain modes

### Animation

- Word interval: **2.2s** per word
- Transition: fade + `translateY(6px → 0 → -6px)`, ease-out-quart (`cubic-bezier(0.16, 1, 0.3, 1)`)
- Progress bar: `translateX(-100% → 350%)` loop, 2s, linear
- `prefers-reduced-motion`: skip translate, opacity-only fade at 1.5s
- No bounce, no elastic, no layout animation

### Word cycling

- 10 words shuffled on mount (Fisher-Yates)
- Cycles through all 10 before reshuffling — no consecutive repeats
- If IPA is null, the IPA line is hidden (no empty space reserved)

## File structure

```
hooks/
  useLoadingWords.ts              ← NEW: fetches + shuffles words
components/practice/session/
  SessionLoadingShell.tsx         ← REFACTOR: uses hook + WordCarousel
  WordCarousel.tsx                ← NEW: animation only
```

## `useLoadingWords` hook

**Location:** `hooks/useLoadingWords.ts`

**Responsibilities:**
- On mount, calls `getMyWords()` from `lib/word-bank/queries.ts`
- Filters to `status === 'ready'`
- Picks 10 at random (Fisher-Yates on the full list, take first 10)
- Maps to `{ text: string; ipa: string | null }`
- If result is empty (no words yet), returns fallback array
- Returns `words: LoadingWord[]` — always 10 items
- Cleanup: cancels async if unmounted before fetch resolves

**Type:**
```ts
type LoadingWord = { text: string; ipa: string | null }
```

**Fallback words** (illustrate hard pronunciation patterns for Spanish speakers):

| Word | IPA |
|------|-----|
| thought | /θɔːt/ |
| through | /θruː/ |
| though | /ðoʊ/ |
| world | /wɜːrld/ |
| clothes | /kloʊðz/ |
| comfortable | /ˈkʌmftərbəl/ |
| rhythm | /ˈrɪðəm/ |
| pronunciation | /prəˌnʌnsiˈeɪʃən/ |
| thoroughly | /ˈθɜːrəli/ |
| particularly | /pərˈtɪkjʊlərli/ |

## `WordCarousel` component

**Location:** `components/practice/session/WordCarousel.tsx`

**Props:**
```ts
interface WordCarouselProps {
  words: LoadingWord[]
}
```

**Responsibilities:**
- Internal state: `currentIndex` (number), advances every 2.2s via `setInterval`
- Renders: word text (DM Mono, 1.25rem, fg-primary), IPA (DM Mono, 0.875rem, fg-tertiary), progress bar, label
- Animation via Tailwind + CSS custom properties — no inline style except runtime-computed `animationDelay`
- Clears interval on unmount
- `prefers-reduced-motion` via `useReducedMotion` hook or `window.matchMedia`

**Does NOT:**
- Fetch data
- Know about Supabase or Dexie
- Have more than one responsibility

## `SessionLoadingShell` refactor

**Location:** `components/practice/session/SessionLoadingShell.tsx`

**Changes:**
- Import and call `useLoadingWords()`
- Import and render `<WordCarousel words={words} />` in place of the old spinner div
- No other logic changes — `focusUi` / `displayBadge` / `onExit` props unchanged
- File stays well under 250 lines

## Design tokens used

| Token | Usage |
|-------|-------|
| `var(--primary)` | Progress bar fill, word text (accent color) |
| `fg-secondary` | IPA text |
| `fg-tertiary` | Label "Preparando tu sesión" |
| `font-mono` (DM Mono) | Word + IPA |
| `border-default` | Progress bar track |

The word text uses `var(--primary)` (the app accent color) to make each word feel alive and on-brand during the wait.

## Constraints

- No `any` without comment
- No Supabase call outside `lib/word-bank/queries.ts`
- No inline `style={{}}` except runtime-computed animation values
- Offline-safe: fallback words cover the case where Supabase is unreachable (fetch error → fallback)
- `prefers-reduced-motion` respected
- IPA null handled gracefully — no empty line rendered
