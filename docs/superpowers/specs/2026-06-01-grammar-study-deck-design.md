# Grammar study deck — design spec

**Date:** 2026-06-01  
**Reference:** `english-journal-grammar-cards.html` (L1–273)

## Goal

When the user opens a course from `/courses`, show a **scrollable stack of study cards** (no flip), with progress in the sticky header. Content is mocked for now; components accept typed data for later CMS/DB wiring.

## UI blocks (card body)

| Block type | Component | Use |
|------------|-----------|-----|
| `conjugation` | `GrammarConjugationBlock` | Pronoun × form grid |
| `verb-table` | `GrammarVerbTableBlock` | Irregular verb columns |
| `contrast` | `GrammarContrastBlock` | a / an side-by-side |
| `pairs` | `GrammarPairsBlock` | ✕/✓ lines (Lucide) |
| `rules` | `GrammarRulesBlock` | Key → value rows |

## Tokens

Same as course path: `--primary`, `--accent-dim`, `--accent-border`, `--surface-*`, `--success-*`, `--error-*`, `--font-editorial`.

## Routes

- `/courses/study/[lessonId]?level=&title=` — deck shell + `MOCK_GRAMMAR_DECK`
- Course path rows link here when no `theory_lessons.slug` (all rows for now)

## Out of scope (v1)

- Persisting “repasada” to IndexedDB (local toggle only)
- Per-course unique deck content
- Rich text / HTML in ledes
