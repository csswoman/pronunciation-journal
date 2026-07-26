# Pronunciation learning route (plan 068)

- **Status**: Thin vertical shipped (2026-07-25).
- **Plan**: `plans/068-build-pronunciation-learning-route.md`
- **Spec**: `docs/superpowers/specs/2026-07-25-plan-068-pronunciation-learning-route-design.md`
- **Implementation plan**: `docs/superpowers/plans/2026-07-25-pronunciation-learning-route.md`

## Role

`/courses/pronunciation` is an **orchestrator**, not a source of truth. It groups
canonical targets from the registry (066), surfaces completion (059) and spoken
evidence (063), and recommends a next action using diagnostic priorities (067).

It does **not** invent target ids, completion rows, or acoustic scores
(071 = NO-SHIP for vowel formants).

## Five stages

| Stage id | Focus |
|---|---|
| `sounds` | High-impact segmental contrasts + schwa |
| `word-stress` | Word stress |
| `sentence-prosody` | Sentence stress + rhythm |
| `connected` | Reductions, linking, elision, assimilation |
| `intonation-transfer` | Rising questions + transfer slot (mission 070 TBD) |

Derived in `lib/pronunciation/path/curriculum.ts` from registry ids + `content-map`.

## Unit states

`not_started | learning | ready_for_transfer | retained` — pure derivation in
`lib/pronunciation/path/unit-state.ts`.

- Visit ≠ progress.
- Only `SpokenAttempt` / path evidence with `outcome === 'scored'` counts.
- `masteryEligible: false` targets never become `retained` from STT alone.
- Diagnostic `needs_evidence` is a UI badge, not a fifth state.

## Recommendation order

1. Non-retained diagnostic `priority` targets (order preserved).
2. Else first non-retained unit in canonical stage order.
3. Else `all_retained` → explore / re-diagnose copy.

## Source-of-truth matrix

| Concern | Owner |
|---|---|
| Target identity / capabilities | `lib/pronunciation/targets/*` (066) |
| Lesson completion | Dexie `completedLessons` (059) |
| Spoken evidence contract | `SpokenAttempt` (063) |
| Diagnostic priorities | `pronunciation_assessments` / local mirror (067) |
| Path grouping / recommend / UI | `lib/pronunciation/path/*` + `components/courses/pronunciation-path/*` |

## Deferred (same plan, later ships)

- Content coverage audit gate / new lesson authoring
- Daily reason → exact unit
- Sound Lab completion → next path action
- Real transfer missions (070)
- Primary sidebar nav item (capacity TBD)

## Related

- Registry ADR: `docs/architecture/pronunciation-targets.md`
- Diagnostic: `/assessment/pronunciation`
- Deep links: `?target=<id>`, `?stage=<id|1-5>`
- Copy flag: `NEXT_PUBLIC_PRONUNCIATION_PATH_COPY` (default on)
