# Course Path: Real Life English & Elective Tracks Reorganization

**Date:** 2026-06-09  
**Status:** Draft

## Problem

The "After C1 · elective tracks" section renders at the bottom of `CoursePathPage` regardless of which level is active. A user on A1 scrolls past irrelevant advanced content. There is no contextual, situational English content attached to each level.

## Solution

1. Add a "English for every day" section inside each level panel — scenarios with phrases and vocabulary calibrated to that level.
2. Move the existing elective tracks (Tech, Biz, Connected Speech) into C1's panel, where they contextually belong.
3. Add new IRL scenarios for C1.
4. Remove `CoursePathElectiveTrack` from the global page layout.

## Data Model

### New types in `lib/courses/types.ts`

```ts
export interface RealLifeVocabItem {
  word: string;
  meaning: string;
}

export interface RealLifeScenario {
  id: string;
  title: string;
  emoji?: string;
  phrases: string[];          // example phrases in English
  vocab: RealLifeVocabItem[];
}

// Add to CoursePathLevel:
realLife?: RealLifeScenario[];
```

`CoursePathCurriculum.electiveTracks` stays in the type (elective tracks still use `CoursePathLevel`), but is no longer rendered at the page root — instead C1's panel renders them via a dedicated sub-section.

### Data in `lib/courses/curriculum.ts`

Each CEFR level gets a `realLife` array passed as a 4th argument to `buildLevel` (or equivalent). Elective tracks remain in `electiveTracks` but are also referenced from the C1 panel rendering logic.

**A1 scenarios (examples):**
- At a restaurant — "A table for two, please", "Can I see the menu?", vocab: menu, bill, tip
- Your first introduction — "Nice to meet you, I'm…", "What do you do?", vocab: name, work, hobby
- Talking about your day — "I usually wake up at…", vocab: morning, routine, tired

**A2 scenarios (examples):**
- Shopping — "How much does this cost?", "Do you have this in another size?", vocab: price, receipt, size
- Making plans — "Are you free on Saturday?", vocab: weekend, plans, meet up

**B1 scenarios (examples):**
- At the doctor's — "I've had a headache for two days", vocab: symptoms, prescription, follow up
- Telling a story — "So what happened was…", vocab: suddenly, eventually, meanwhile

**B2 scenarios (examples):**
- Giving your opinion — "I'd argue that…", "To be honest…", vocab: perspective, valid point, nuance
- Telling an anecdote — idioms, narrative connectors

**C1 scenarios (examples):**
- Navigating ambiguity — "I see where you're coming from, but…", vocab: implication, subtext
- Humor and irony — "Oh, obviously…", understatement, sarcasm markers
- Persuading subtly — hedging, softeners, conviction phrases

## Components

### New: `CoursePathRealLife`

```
// Planned structure:
// <CoursePathRealLife>
//   <header (colapsable button)>
//   <CoursePathRealLifeCard /> × n
// </CoursePathRealLife>
```

- Client component
- Collapsible section (starts collapsed)
- Receives `scenarios: RealLifeScenario[]`
- Renders a horizontal-scroll or wrapping grid of cards on open
- CSS class namespace: `course-path__irl`

### New: `CoursePathRealLifeCard`

```
// Planned structure:
// <CoursePathRealLifeCard>
//   <header (emoji + title)>
//   <phrases list>
//   <vocab list>
// </CoursePathRealLifeCard>
```

- Pure display, no state
- CSS class namespace: `course-path__irl-card`

### New: `CoursePathC1Electives`

```
// Planned structure:
// <CoursePathC1Electives>
//   <header>
//   <CoursePathElectiveTrack /> × 3
// </CoursePathC1Electives>
```

- Wraps the existing `CoursePathElectiveTrack` components
- Only rendered when `level.id === "c1"`
- Receives `electiveTracks: CoursePathLevel[]`
- CSS class namespace: `course-path__c1-electives`

### Modified: `CoursePathLevelPanel`

After `.course-path__units`, append:
1. `<CoursePathRealLife>` if `level.realLife` exists
2. `<CoursePathC1Electives>` if `level.id === "c1"` (receives `electiveTracks` prop)

New props:
```ts
electiveTracks?: CoursePathLevel[]; // passed only from CoursePathPage
```

### Modified: `CoursePathPage`

- Remove `<section className="course-path__electives">` and `CoursePathElectiveTrack` imports
- Pass `electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}` to `CoursePathLevelPanel`

### Deleted: `CoursePathElectiveTrack` — NO. Keep as-is, reused inside `CoursePathC1Electives`.

## CSS

New classes in `course-path.css`:

```css
.course-path__irl          /* collapsible section container */
.course-path__irl-header   /* toggle button */
.course-path__irl-grid     /* wrapping card grid */
.course-path__irl-card     /* individual scenario card */
.course-path__irl-card-head
.course-path__irl-phrases
.course-path__irl-vocab
.course-path__c1-electives /* wrapper for elective tracks inside C1 */
```

Visually: cards use `--surface-raised`, border subtle, `--radius-lg`, compact font. The section header matches the tone of the rest of the panel (muted, not competing with curriculum units).

## What Does NOT Change

- `CoursePathElectiveTrack` component: unchanged
- `buildCurriculum.ts`: no changes needed (realLife is raw data, not built)
- Routing, progress, Dexie, Supabase: untouched — IRL content is display-only, no progress tracking
- Offline mode: data is static in `curriculum.ts`, no network calls

## Acceptance Criteria

- [ ] Navigating to A1 shows no elective tracks section below the panel
- [ ] Each level panel shows "English for every day" at the bottom when scenarios exist
- [ ] C1 panel shows IRL scenarios + elective tracks (Tech, Biz, Connected Speech) below the curriculum units
- [ ] Elective tracks in C1 behave identically to current behavior (collapsible, full lesson list)
- [ ] No file exceeds 250 lines
- [ ] No inline styles added (CSS token classes only)
