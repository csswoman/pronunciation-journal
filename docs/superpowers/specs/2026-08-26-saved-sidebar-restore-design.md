# Restore standalone access to Saved content

**Date:** 2026-08-26
**Status:** Approved for planning

## Problem

Saved content (words, phrases, lessons the user bookmarked) has no entry point in
the sidebar. The "Guardado" nav item — `{ name: "Guardado", href: "/tracking",
icon: Bookmark }` — was removed from the `exploreNav` group on 2026-08-18 in commit
`6bebffc7` ("feat(nav): refine sidebar navigation and active-state logic"). The
feature still works, but the only ways to reach it are:

- the `?mode=saved` segment inside the Dictionary page's topbar, and
- typing `/saved` (which redirects to `/dictionary?mode=saved`) or `/tracking`
  directly.

The user wants saved content to be its own destination again, reachable from the
sidebar, and **not** presented as a mode nested inside `/dictionary`.

## Goals

1. Sidebar has a "Guardadas" item that opens the saved-content view.
2. Saved content is no longer surfaced as a tab/mode inside `/dictionary`.
3. The Palabras / Frases / Lecciones sub-views the user asked for already exist
   in `TrackingClient` (its `FILTERS` toolbar) — no new data work needed.
4. Old links keep working (`/saved`, `/dictionary?mode=saved`).

## Non-goals

- Renaming the `/tracking` route or its files.
- Moving `/tracking/review`.
- Any change to how saved items are stored, queried, or reviewed.
- Redesigning `TrackingClient`'s internal layout.

## Decisions

| # | Decision |
|---|----------|
| A | Remove the "Guardadas" segment from the Dictionary topbar **entirely**. Dictionary becomes Diccionario + Aprender only. |
| B | `/tracking` remains the implementation route. `/saved` redirects to `/tracking`. The sidebar links to `/tracking`. |
| C | The sidebar item goes in the bottom `progressNav` group, next to "Progreso". Label: **"Guardadas"**. Icon: `BookMarked` (same icon the removed Dictionary tab used). |
| D | `isNavActive` stops making `/dictionary` absorb the `/tracking` active state. The new item highlights on `/tracking` and `/tracking/review` via the default `startsWith` rule. |

## Changes

### 1. `components/theme/sidebar/navConfig.ts`

Add `BookMarked` to the icon import. Add a second item to `progressNav`:

```ts
export const progressNav: NavSectionType = {
  label: "",
  items: [
    { name: "Progreso", href: "/progress", icon: TrendingUp },
    { name: "Guardadas", href: "/tracking", icon: BookMarked },
  ],
};
```

No change to `NavSection` — it already maps over `items` and keys by `href`, and
`/tracking` is unique.

### 2. `app/(authenticated)/saved/page.tsx`

```ts
import { redirect } from "next/navigation";

export default function SavedRedirectPage() {
  redirect("/tracking");
}
```

(Only the redirect target changes: `/dictionary?mode=saved` → `/tracking`.)

### 3. `components/words/WordsTopbar.tsx`

- `WordsMode` narrows to `"dictionary" | "learn"`.
- Remove the `saved` entry from `TABS`.
- Remove the `BookMarked` import if now unused (keep `BookOpen`).
- Simplify the `href` ternary: `id === "learn" ? "/dictionary?mode=learn" : "/dictionary"`.

### 4. `components/words/WordsClient.tsx`

- `activeMode` computation drops the `saved` branch:
  `rawMode === "learn" ? "learn" : "dictionary"`.
- Remove the `activeMode === "saved"` block (lines ~86-89) and the `TrackingClient`
  dynamic import (lines ~15-17). Always render `LexiconTabRuntime`.
- The outer conditional collapses; `LexiconTabRuntime` becomes the sole child.

### 5. `components/lexicon/LexiconView.tsx` & `components/words/tabs/LexiconTabRuntime.tsx`

`mode?: WordsMode` prop type follows the narrowed `WordsMode` automatically. Both
files only branch on `"dictionary"` / `"learn"`, so no logic changes. Verify
`type-check` passes.

### 6. `lib/navigation/is-nav-active.ts`

Remove the `/dictionary` special case that absorbs `/tracking`:

```ts
if (href === '/dictionary') {
  return (
    cleanPathname === '/dictionary' ||
    cleanPathname.startsWith('/dictionary/')
  )
}
```

`/tracking` and `/tracking/review` now fall through to the default rule
(`cleanPathname === href || cleanPathname.startsWith(`${href}/`)`), which
activates the `href: "/tracking"` item correctly.

Update the docstring at the top of the file (remove the "absorbs `/tracking`" line).

### 7. Tests

**`lib/navigation/__tests__/is-nav-active.test.ts`**
- Rename/rewrite the `'activates Diccionario on /dictionary and /tracking'` test:
  - `isNavActive('/tracking', '/dictionary')` → `false`
  - `isNavActive('/dictionary?mode=saved', '/dictionary')` → still `true` (query
    stripping is unchanged; `mode=saved` is now a dead param but the URL still
    resolves to the Dictionary page)
- Add a `'activates Guardadas on /tracking and /tracking/review'` test:
  - `isNavActive('/tracking', '/tracking')` → `true`
  - `isNavActive('/tracking/review', '/tracking')` → `true`
  - `isNavActive('/progress', '/tracking')` → `false`

**`components/layout/__tests__/Sidebar.test.tsx`**
- Add an assertion that a link named `/Guardadas/i` has `href="/tracking"`.
- Check the existing suite for any assertion that no longer holds (e.g. a count of
  nav links) and update it.

**`components/words/__tests__/WordsClient.test.tsx`**
- Remove/adjust any case that exercises `?mode=saved` rendering `TrackingClient`.

## Risks

- **Dead `?mode=saved` links.** `/dictionary?mode=saved` will render the Dictionary
  (dictionary mode) instead of saved content. Acceptable: `/saved` is the
  advertised path and now points to `/tracking`; the in-app Dictionary tab that
  generated `?mode=saved` links is being removed. No redirect added for the bare
  query param (Decision A).
- **`WordsClient.test.tsx` / `TrackingClient.test.tsx` coupling.** The embed path is
  removed from `WordsClient`; `TrackingClient`'s `embed` prop stays (still used by
  nothing after this change — leave it, it's harmless and out of scope to remove).

## Verification

- [ ] `pnpm type-check` — `WordsMode` narrowing produces no errors.
- [ ] `pnpm test` — nav, sidebar, words suites green.
- [ ] `pnpm lint`.
- [ ] Manual: sidebar shows "Guardadas" under "Progreso"; clicking opens
      `/tracking` with Palabras/Frases/Lecciones filters; the item is highlighted
      on `/tracking` and `/tracking/review`; "Diccionario" is not highlighted on
      `/tracking`; `/saved` redirects to `/tracking`.
