# Journal Writing Hints — Design

## Problem

Students writing in the journal often don't know how to form past/present tense
or which connector phrases to use. Today the only feedback is AI correction
*after* submitting the entry. There is no support while actually writing.

## Goals

- Give students light, non-blocking support while they write, without
  duplicating the AI correction that already happens on submit.
- Keep it offline-safe (no new Gemini calls, no network dependency).
- Two independent pieces: a static reference guide, and live rule-based hints.

## Non-goals

- No AI-powered live hints in this iteration (Gemini stays only in the
  post-submit correction flow). May be revisited later if local rules prove
  insufficient.
- No context-dependent grammar rules (articles a/an/the, loose prepositions) —
  too error-prone for simple pattern matching, deferred indefinitely unless a
  smarter approach is designed.

## Piece A — Writing Guide Panel (static reference)

A collapsible side panel next to the journal editor (drawer, collapsed by
default, on mobile) with two tabs:

- **Tiempos verbales**: short tables for present/past/future with 2-3 examples
  each, focused on the most common irregular verbs.
- **Frases útiles**: phrases grouped by purpose — narrating past events
  ("Yesterday I..."), opinion ("I think that..."), connectors ("because",
  "however").

### Structure

```
<WritingGuidePanel>              (collapsible/drawer wrapper)
  <WritingGuideTabs>              (tab switcher: Tiempos / Frases)
  <VerbTensesGuide />             (static table)
  <UsefulPhrasesGuide />          (static list grouped by purpose)
</WritingGuidePanel>
```

- Content lives in `lib/journal/writing-guide-content.ts` as typed static
  data — no logic, no prompts (this never touches Gemini).
- Only the collapse/tab UI state is client-side (`useState`, no store needed —
  purely ephemeral).
- Integrates into `JournalWorkspace.tsx` as a side panel.
- 100% static — zero impact on offline mode.

## Piece B — Live Writing Hints (local rule engine)

While the student types, a local rule engine (pure functions, no AI, no
network) flags high-confidence mechanical errors with a subtle underline;
hovering/tapping shows a short Spanish explanation. Debounced ~400ms after the
user stops typing. Does not block submission or duplicate AI correction — it's
a lightweight nudge before that happens.

### Rule scope (v1) — high-confidence only

Rules limited to mechanical patterns that don't require deep context, to avoid
false positives that would confuse a beginner more than help them:

- Malformed irregular past tense (`goed` → went)
- Missing `-ed` after past-time markers (`yesterday`, `last week`)
- `I am agree` → `I agree`
- Double negatives (`I don't have no...`)
- Missing `-s` in third-person present (`He go` → `He goes`)
- Irregular plurals (`childs` → `children`)
- Missing apostrophe in contractions (`dont`, `cant`)

Explicitly excluded from v1: articles (a/an/the), standalone prepositions —
both too context-dependent for regex-level rules.

### Code structure

`lib/journal/writing-hints/`:
- `rules.ts` — pure functions, each `(text: string) => WritingHintMatch[]`
  returning `{ start, end, ruleId, message }`. One function per rule for
  testability.
- `detect-hints.ts` — runs all rules, resolves overlaps (first match by
  position wins), returns an ordered list.
- `hint-labels.ts` — Spanish messages by `ruleId`, following the existing
  pattern in `lib/journal/error-type-label.ts`.

All pure, no DOM/network dependency — directly testable with Vitest.

### UI structure

```
<JournalEditor>                  (existing, extended)
  <WritingHintsOverlay />         (new: renders underline marks over textarea text)
  <WritingHintTooltip />          (new: shows message on hover/tap of a mark)
  existing autosave <textarea>    (unchanged logic)
</JournalEditor>
```

- `WritingHintsOverlay` uses the standard mirrored-`div` technique (a div with
  identical text/styles positioned behind/over the textarea) to render
  underlines at specific character ranges.
- New hook `useWritingHints(content, enabled)` — separate from
  `useJournalEntry` (already at its responsibility limit). Owns debounce +
  calling `detect-hints.ts`.
- Toggle "Mostrar pistas mientras escribo" persisted via `localStorage`
  (UI preference, not critical data — allowed under project rules) through a
  small `useWritingHintsPreference` hook.

## Testing

- `rules.ts` / `detect-hints.ts`: unit tests per rule with true positive and
  false positive fixtures (Vitest, alongside source per project convention).
- `WritingGuidePanel`: no logic to test beyond render; visual check.
- `WritingHintsOverlay`: test hint positioning logic (start/end → rendered
  mark) at the pure-function level where possible; component test for
  toggle-off hiding hints.

## Constraints honored

- No Gemini prompts added; no new `/api/gemini/*` route.
- No Supabase involvement — this is local/ephemeral only.
- Offline mode unaffected (both pieces are fully local).
- File size: new components kept single-responsibility, under 250 lines.
