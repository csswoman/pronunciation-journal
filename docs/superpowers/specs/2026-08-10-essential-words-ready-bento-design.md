# Essential Words Ready Bento Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Register:** product  
**Surface:** `/practice/essential-words` phase `ready` (`SessionReady` + related)  
**Approach:** 1 — Bento layout + Dexie adapters (offline-first)

## Goal

Replace the equal-weight card stack on Essential Words ready with a two-column bento that surfaces **actionable SRS data already in Dexie**, fixes demotivating empty progress copy, elevates session controls (size + route), and records real session duration for last-session recap.

Empty viewport space is not a layout bug when there is little evidence yet: **omit widgets without signal** rather than inventing vanity metrics.

## Problem (current)

- Level progress reads as broken/loading: ~0% bar + “Te faltan 740 palabras” (A1 wall).
- “Racha” and “Mañana” each own a full card for one number (bad space/information ratio).
- “Sesión recomendada” (route) is the most useful control and is buried in muted `details` under the CTA.
- Vault shows a count, not the words.
- Uniform stack: same surface, radius, padding, width — no size hierarchy (not bento).
- Session duration is always 0 because `buildEssentialWordExerciseResult` hardcodes `timeMs: 0`.

## Decisions (approved)

| Topic | Choice |
| --- | --- |
| Architecture | Dexie adapters + client UI; not Supabase-first for these widgets |
| Session controls | **Both** size (Corta 5 / Recomendada 9 / Larga 15) **and** route picker, with clear hierarchy |
| Vocabulary legend | **Four** buckets: Nuevas · Aprendiendo · En repaso · Dominadas |
| Last session | Show `correct/practiced` + duration when `duration_ms > 0`; **fix the timer** so duration becomes real |
| Mobile order | Hero → forecast → vocabulario → racha → retención → leeches → baúl → heatmap |
| Empty widgets | Do not render (collapse); no decorative zeros |

## Constraints

### In scope

- `SessionReady` composition and child widgets under `components/practice/essential-words/`
- Pure adapters under `lib/essential-words/` (forecast, retention, leeches, state distribution, heatmap, last session)
- Session size preference persistence (guest/local or existing prefs pattern)
- Wiring size into session plan / new-card ceiling
- Fix exercise/session timing (`timeMs`, wall-clock session, `activity_sessions.duration_ms`)
- Page shell width only if the bento needs slightly more than `--layout-session-max` (document choice in plan)

### Out of scope

- XP, badges, lifetime practice time
- App-wide heatmap/retention (Progress page) — widgets are **Essential Words only**
- Rewriting FSRS / skill-model scheduler
- Inventing a persisted “consolidating” field (map from existing statuses)
- Perfect duration for sessions completed before the timer fix (historical rows may stay 0)

## Composition

### Desktop (≥768px)

```
[ PageHeader — Práctica / Palabras esenciales ]

[ Hero — full width, primary visual weight ]
[ Recap última sesión — full width, only if data ]

[ Forecast 7d          ] [ Racha + day marks ]
[ Vocabulario (4 buckets) ] [ Retención 30d ]
                           [ Leeches ]
                           [ Baúl + word chips ]

[ Heatmap 12 semanas — full width ]
```

Hero spans the content column; main column holds forecast + vocabulary; rail holds compact insight cards. Heatmap spans both.

### Mobile (&lt;768px)

Single column, order:

1. Hero  
2. Forecast  
3. Vocabulario  
4. Racha  
5. Retención  
6. Leeches  
7. Baúl  
8. Heatmap  

Recap sits under hero when present.

### Visual hierarchy

- **One** primary surface: Hero (larger pad, stronger title, sole solid CTA).
- Secondary widgets: quieter raised surfaces, compact padding, denser rail.
- Tokens only (`surface-*`, `border-subtle`, `primary` / `primary-soft` for heatmap intensity). No side stripes, gradient text, or vanity metric templates.
- Heatmap intensity uses theme primary ramp (not a hard-coded green from the mock).

## Hero controls

Order inside the primary card:

1. Title + estimated minutes (recomputed from chosen size).
2. Compact breakdown: `N nuevas · M repasos · …`.
3. **Session size** segmented control: `Corta · 5` / `Recomendada · 9` / `Larga · 15`.
   - Persist preference (same family as CEFR/guest prefs).
   - Drives new-card / plan ceiling for the next `beginSession`.
4. **Route** control — visible chips or picker (not muted `details` under CTA).
   - Default: “Sesión recomendada” (no route filter).
5. Primary CTA: `Empezar` / `Continuar`.
6. Optional last-session recap adjacent (under CTA or immediately below hero).

Resume copy (“Continuar donde lo dejaste”) still outranks fresh start when learning cards remain.

## Data contracts

Dual path: prefer **skill** tables (`learningItems`, `attemptLogs`) when skill model is active; fall back to **legacy** `srsData` / compatible fields when not. Adapters must not call Supabase from UI.

### Forecast (7 days)

- Source: `learningItems.dueAt` or `srsData.nextReview`.
- Bucket by local calendar day for today → today+6.
- Empty days = 0; still show the chart (zeros are meaningful load foresight).

### Vocabulario (state distribution)

Four buckets (product labels → derivation):

| Label | Derivation (skill-first) |
| --- | --- |
| Nuevas | unseen / New / not yet introduced |
| Aprendiendo | learning / Learning / Relearning / provisional |
| En repaso | review / Review (scheduled, not mature) |
| Dominadas | vault `mastered` and/or mature FSRS |

- Segmented bar proportional to counts among **words the learner has touched** (or active deck subset — plan must pick one consistent universe and test it).
- **Forbidden copy:** “Te faltan N palabras para completar el nivel …” as the primary progress story.
- Replace `SessionReadyLevelProgress` CEFR-wall messaging for this surface (CEFR frontier may remain elsewhere, e.g. Home, if still useful).

### Retención (30 days)

- Source: `attemptLogs` with review-eligible events (reuse scheduled-review eligibility ideas from simulation retention helpers where practical).
- Value: `%` correct.
- **Hide** widget if attempt count &lt; 10 (configurable constant).
- Optional secondary: delta vs previous 30d only if cheap; otherwise omit in v1.

### Leeches

- Source: `lapses >= 3` on learning items (define word-level rollup: max or any skill).
- Show up to 3 word chips + link `Repasar las N difíciles`.
- CTA: start a focused session / filtered queue of those words (plan specifies exact entry point; must not invent a second SRS).
- Hide if none.

### Baúl

- Source: existing `useSrsVaultEntries` (`SRSData.word` already available).
- Show up to 3 word chips + open existing vault modal.
- Hide if count = 0.

### Racha

- Keep server/app streak number already passed into ready.
- Add texture: up to 7 day marks for recent Essential Words activity days (from `attemptLogs`), not a bare numeral card.

### Heatmap (12 weeks)

- Source: `attemptLogs.occurredAt`, EW-only.
- Day cells with intensity levels from attempt counts.
- Always show structure once the learner has any history; if zero history, omit entire heatmap.

### Last session recap

- Source: latest Essential Words `activity_sessions` row and/or last `sessionId` aggregation from `attemptLogs`.
- Display: `Última: {correct}/{practiced}` and `· mm:ss` when `duration_ms > 0`.
- Hide if no prior session.

## Session timer fix

**Root cause:** `buildEssentialWordExerciseResult` sets `timeMs: 0`; `recordActivitySession` persists `sessionResult.totalTimeMs` → `duration_ms`.

**Required behavior:**

1. On `beginSession`, record `sessionStartedAt`.
2. Per exercise, set `timeMs` to presentation → grade delta (ms). Stop hardcoding `0`.
3. On session complete, set total duration from wall-clock (`now - sessionStartedAt`) and/or sum of per-exercise `timeMs` (plan picks primary; wall-clock preferred for recap “5:42”).
4. Persist via existing `recordActivitySession` path.
5. Unit tests covering non-zero `timeMs` and non-zero `duration_ms` on complete.

Per-attempt `interactionDurationMs` in skill logs may remain separate; session recap uses activity session duration.

## Component map (expected)

```
SessionReady
  SessionReadyHero          — size + route + CTA (primary)
  SessionReadyRecap         — optional
  SessionReadyBento
    SessionReadyForecast
    SessionReadyVocabulary
    SessionReadyStreak
    SessionReadyRetention
    SessionReadyLeeches
    SessionReadyVaultRow    — word chips, not count-only
  SessionReadyHeatmap
```

Names can shift in the plan; responsibilities must not.

## Non-goals (explicit)

- Filling empty space with placeholder charts.
- Duolingo-style gamification.
- Nested cards.
- Blocking ready on network.

## Success criteria

1. New learner sees hero + controls without fake metrics; widgets appear as evidence accumulates.
2. No “te faltan 740” primary message on ready.
3. Route and session size are visible above/beside the CTA without hunting.
4. Vault shows real words when present.
5. After one completed session with the timer fix, recap can show duration.
6. Desktop matches two-column hierarchy; mobile follows approved order B.
7. Offline: all ready widgets resolve from Dexie.

## Open items for implementation plan

- Exact universe for vocabulary counts (touched words vs full NGSL subset).
- Exact leech CTA session entry (filter vs dedicated mini-plan).
- Whether ready page width stays `session` (720px) or uses a slightly wider max for the bento.
- Retention eligibility predicate (scheduled-review only vs all EW attempts).
