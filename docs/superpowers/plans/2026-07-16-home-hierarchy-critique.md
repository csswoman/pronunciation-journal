# Home Hierarchy Critique — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Direct home attention to urgency + daily action; Spanish chrome; remove decorative icons, header CTA void, AI junk-drawer card, and in-row thread density.

**Architecture:** Recompose existing home/daily components per `docs/superpowers/specs/2026-07-16-home-hierarchy-critique-design.md`. Unify EN step titles to ES in builders. No new queries.

**Tech Stack:** Next.js App Router, React 19, Tailwind v4, Vitest

**Spec:** `docs/superpowers/specs/2026-07-16-home-hierarchy-critique-design.md`

---

## File Map

| File | Change |
| --- | --- |
| `lib/practice/daily-plan/step-builders.ts` | ES titles/subtitles for phoneme/pairs/listening |
| `lib/practice/daily-plan/async-step-builders.ts` | ES for connected_speech |
| `lib/home/queries.ts` | Align SSR preview step strings to ES |
| `components/daily/DailyStepList.tsx` | Remove icons; no in-row hints; meta ES |
| `components/daily/DailyStepTitle.tsx` | Keep index + IPA styling |
| `components/daily/StepThreadHints.tsx` | ES labels; used below list |
| `components/daily/DailyThreadStrip.tsx` | **Create** — aggregate hints under `<ol>` |
| `components/home/HomeReviewBanner.tsx` | Elevated surface + ES copy |
| `components/home/HomeUtilityBar.tsx` | Compact; remove Explore CTA |
| `components/home/HomeDailyCard.tsx` | Progress copy; ES chrome |
| `components/home/HomeCommandGrid.tsx` | Aside order; drop AiPractice |
| `components/home/WeakSoundCard.tsx` | Pronunciation merge + ES |
| `components/home/HomeWordOfDayCard.tsx` | Compact + ES |
| `components/home/Core1000ProgressCard.tsx` | ES chrome |
| `components/home/HomeLearnRow.tsx` | ES kickers/CTA |
| `components/home/HomeMobileView.tsx` | ES quick access labels |
| Tests for builders / banner / weak sound / step-thread | Update assertions |

---

### Task 1: Unify step titles to Spanish

- [ ] Update `step-builders.ts` phoneme/pairs/listening strings
- [ ] Update `async-step-builders.ts` connected_speech
- [ ] Update `lib/home/queries.ts` preview strings
- [ ] Fix any failing daily-plan / step-builders tests

### Task 2: Daily list density + thread strip

- [ ] Remove icon column from `DailyStepList`
- [ ] Spanish meta (`ejercicios`, `palabras`, `lectura`)
- [ ] Create `DailyThreadStrip` (max 2 chips + +N); place below `<ol>`
- [ ] ES labels in `StepThreadHints` / strip

### Task 3: Banner + utility bar hierarchy

- [ ] Elevate `HomeReviewBanner` (primary wash + ES)
- [ ] Strip CTA from `HomeUtilityBar`; compact ES meta

### Task 4: Daily progress copy + ES chrome

- [ ] `HomeDailyCard`: never “0 de 5”; ES titles/buttons

### Task 5: Aside narrative

- [ ] Drop `HomeAiPracticeCard` from grid; order WeakSound → Core → Word
- [ ] WeakSound = Pronunciación card with single CTA
- [ ] Compact Word of day + ES
- [ ] Core1000 + LearnRow ES

### Task 6: Mobile chrome ES + verify

- [ ] Mobile quick access / labels ES where touched
- [ ] Run vitest on touched tests + type-check if needed
