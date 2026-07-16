# Home Hierarchy Fix — Attention, Language, Density

**Date:** 2026-07-16  
**Status:** Approved — implemented  
**Supersedes (for this wave):** polish-only hierarchy gaps left after Notebook Command Center shell  
**Related:** `2026-07-16-home-redesign-design.md` (shell already shipped); this spec is the **critique pass** on attention, language, and right-column narrative  
**Approach:** B — recompose hierarchy with existing components; no new queries

## Goal

Fix the home so attention is directed: urgency and the day’s action lead; chrome is consistent Spanish (L1); learning content stays English; decorative noise and dead space go away. Preserve what already works (syllable word, chromatic restraint, actionable daily list).

## Problems (user critique, accepted as requirements)

1. **Broken hierarchy** — everything weighs the same; due-for-review is another grey card; monospace date leads the eye
2. **Decorative step icons** — pale circles don’t communicate exercise type
3. **Language mix without rule** — EN chrome + mixed ES/EN step titles
4. **Uneven density** — thread chips inside step 05 break list rhythm
5. **“0 of 5”** — demotivating and poorly placed
6. **Dead header space** — Explore courses floats in empty band
7. **Right column junk drawer** — Core / Weak sound / Word of day / AI practice with no narrative; WeakSound and “Practice sounds” duplicate
8. **Word of the day oversized** for passive content

## Constraints

### In scope

- `components/home/*` hierarchy, copy, density, aside narrative
- `components/daily/DailyStepList`, `DailyStepTitle`, `StepThreadHints`, `dailyIcons` (as needed)
- Step title/subtitle strings in `lib/practice/daily-plan/step-builders.ts`, `async-step-builders.ts` (and tests)
- Compact Word of Day; merge/remove `HomeAiPracticeCard` from home aside
- Spanish chrome copy for home UI strings touched in this pass
- Minimal CSS in `app/styles/utilities.css` if banner/aside need a surface variant

### Out of scope

- New Supabase queries or hooks
- Full-app i18n framework
- Palette / `--hue` changes
- Deleting unused legacy home files (leave unimported)
- Rewriting mobile into a different product; apply the same hierarchy rules where the same components render

## Language rule (fixed)

| Layer | Language | Examples |
| --- | --- | --- |
| Chrome (UI chrome) | **Spanish** | Pendiente de repasar, Plan de hoy, Palabra del día, Explorar cursos, Escuchar, Añadir a palabras |
| Learning content | **English** | Mini-lesson titles, word of the day lemma/definition/example, IPA |
| Daily step titles/subtitles | **Spanish** (unify builders) | Sonido /dʒ/, Pares mínimos, Escucha y escribe, Palabras nuevas |

Meta under each step (`N ejercicios`, `N palabras`, `lectura`, `≈N min`) → Spanish.

## Architecture

### Attention order (desktop)

```
1. HomeReviewBanner     ← ONLY if due > 0; elevated surface (not grey twin)
2. HomeCommandGrid
   ├─ main: HomeDailyCard (héroe) → HomeLearnRow
   └─ aside (narrative stack):
        1. PronunciationCard   ← merge WeakSound + Practice sounds CTA
        2. Core1000ProgressCard
        3. HomeWordOfDayCard   ← compact
3. HomeUtilityBar        ← demoted: single compact meta line; NO Explore courses here
```

**Explore courses / Continue course:** move to daily empty-state (already) and/or a text link under Learn row — not a floating primary in the header void.

### Mobile

Same priority: banner → daily plan → progress row (Core + Pronunciation) → Quick Access. Spanish chrome on touched strings. No AI practice card. Word of day stays desktop-aside-only unless already present (do not force onto mobile in this pass).

### Removed / demoted

| Item | Action |
| --- | --- |
| `HomeAiPracticeCard` on home | **Remove from `HomeCommandGrid`**. Topics discovery is not home’s job; pronunciation CTA lives on Pronunciation card |
| Decorative circular Lucide icons in `DailyStepList` | **Remove**. Keep index `01`–`05` + optional domain kicker |
| Thread chips inside each step row | **Move out** of the row |
| Utility bar primary CTA | **Remove** from `HomeUtilityBar` |

## Component design

### `HomeReviewBanner`

- When due > 0: stronger than sibling cards — `border` with primary/accent, `bg-primary-soft` or wash, `font-label`+ title weight, primary CTA (“Repasar ahora”)
- Copy ES: “Pendiente de repasar”, “N pendientes · X palabras · Y sonidos”
- Still hidden when total = 0

### `HomeUtilityBar`

- One compact row: date · saludo corto · nombre · streak
- Max visual weight = caption/kicker; no competing primary button
- Date locale: `es-ES` short form (or keep numeric clarity without English weekday abbreviations)

### `HomeDailyCard` progress

- `completedCount === 0`: show **“5 pasos · ≈X min”** (sum `estMinutes` if available; else omit minutes). **Never** “0 de 5”
- `completedCount > 0`: **“N de 5”** immediately beside the progress bar (same flex row, tight gap)
- Title: “Plan de hoy”

### `DailyStepList` / `DailyStepTitle`

- No icon circle column
- Row: index (tabular) + title (+ styled IPA when `step.ipa`) + short subtitle one line + chevron/status
- Uniform row height; truncate subtitle; no nested chips

### Thread hints

- Collect hints across the plan once
- Render **below the `<ol>`** as “Reaparecen hoy” with max **2** chips + “+N” if more
- Or omit section when empty
- Chip labels ES: “de Intro”, “de Repaso”, etc.

### Domain kickers (optional, informative)

If a one-word domain label helps without icons, map `DailyStepKind` → Spanish kicker (`Sonido`, `Pares`, `Dictado`, `Vocab`, `Contexto`, `Lectura`, `Concepto`). Render as mono/caption next to index — not a colored circle glyph. If title already states the domain, skip kicker (YAGNI: prefer no kicker if titles are clear after ES unify).

### Pronunciation aside card (merge)

Single card replacing `WeakSoundCard` + `HomeAiPracticeCard`:

- Title: “Pronunciación”
- If weak phoneme: large IPA + accuracy + CTA “Practicar este sonido” → `/practice/sounds`
- Else: CTA “Practicar sonidos” → `/practice/sounds`
- No second “Topics” button on home

Implementation options (pick one in plan):

1. Expand `WeakSoundCard` and delete aside usage of `HomeAiPracticeCard`
2. Rename to `HomePronunciationCard` wrapping the same logic

Prefer (1) to avoid file churn.

### `HomeWordOfDayCard` (compact)

- Keep: syllable word, IPA (`text-h4` or body-lg), Listen + Add buttons (`size="md"`)
- Collapse: definition to **1 line** (`line-clamp-1`) or hide behind “Ver definición”; drop example sentence from default view (or `line-clamp-1` max)
- Reduce vertical padding so it is **not** the tallest aside card

### `Core1000ProgressCard`

- Chrome ES: “Core 1000”, “Palabras esenciales”, “Empezar el mazo →” / progress nums unchanged
- Keep compact; no layout promotion

### `HomeLearnRow`

- Kickers ES: “Mini lección”, concept badge may stay as content language from JSON (Historia is content label — OK)
- CTA: “Abrir”

### Step builders (ES unify)

| Kind | title (ES) | subtitle direction |
| --- | --- | --- |
| `phoneme_focus` | `Sonido` + IPA via `step.ipa` (title plain “Sonido”) | “Tu sonido a reforzar hoy” / “Como en “{example}”” |
| `minimal_pairs` | `Pares mínimos` | Distinguir {ipa} de sonidos parecidos |
| `listening` | `Escucha y escribe` | Dictado con palabras nuevas |
| `connected_speech` | `Habla conectada` | (ES subtitle) |
| Existing vocab/reader/sentence | keep ES | keep ES |

Update unit tests that assert English titles.

## Data flow

No new fetches. `HomeCommandGrid` aside order becomes: WeakSound (pronunciation) → Core1000 → WordOfDay. Drop `HomeAiPracticeCard`.

## Error & empty states

Unchanged behaviorally; copy to Spanish where touched.

## Testing

- `step-thread` tests: still pass; hints aggregation for below-list UI
- Step-builder / daily-plan tests: expect Spanish phoneme/listening/pairs titles
- `HomeReviewBanner` visibility tests: update copy selectors if asserted
- `WeakSoundCard` tests: update strings
- Manual: first viewport — banner (if due) or plan leads; utility bar does not dominate; 5 equal-height steps; aside Word of day shorter than before

## Done criteria

- [ ] Due banner is visually louder than plan/aside cards when present
- [ ] Utility bar has no Explore courses button; header height reduced
- [ ] Daily step rows have no decorative icon circles; uniform density
- [ ] Thread chips not inside step rows
- [ ] No “0 de 5” / “0 of 5” at start of day
- [ ] Home chrome strings touched in this pass are Spanish
- [ ] Phoneme/listening/pairs/connected_speech step titles Spanish
- [ ] `HomeAiPracticeCard` not rendered on home
- [ ] Word of day compact (definition clamped or collapsed)
- [ ] Color tokens unchanged; no new queries

## Non-goals

- Building a full i18n dictionary for the whole app
- Redesigning `/practice` hub
- Gamified urgency animations beyond existing tokens
- Mobile Quick Access removal

## Next step

After user confirms this written spec: produce an implementation plan (file-by-file) and implement.
