# Course Path: Real Life English & Elective Tracks Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-level "English for every day" scenarios (phrases + vocab cards) inside each level panel, and move the elective tracks (Tech, Biz, Connected Speech) from the global page footer into the C1 panel where they belong contextually.

**Architecture:** New types `RealLifeScenario` / `RealLifeVocabItem` added to `lib/courses/types.ts`. Static scenario data attached directly to each level in `curriculum.ts` (bypasses `buildLevel`, appended after). Two new display-only components — `CoursePathRealLife` (collapsible section) and `CoursePathRealLifeCard` (card) — plus `CoursePathC1Electives` (wraps existing `CoursePathElectiveTrack`). `CoursePathLevelPanel` receives an optional `electiveTracks` prop and renders both sections at its tail. `CoursePathPage` removes the global electives section and forwards `electiveTracks` to the panel.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 CSS custom properties (`course-path.css`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/courses/types.ts` | Add `RealLifeVocabItem`, `RealLifeScenario`, `realLife?` field on `CoursePathLevel` |
| Modify | `lib/courses/curriculum.ts` | Attach `realLife` scenarios to each level; no changes to `electiveTracks` |
| Create | `components/courses/CoursePathRealLife.tsx` | Collapsible "English for every day" section |
| Create | `components/courses/CoursePathRealLifeCard.tsx` | Single scenario card (phrases + vocab) |
| Create | `components/courses/CoursePathC1Electives.tsx` | Wraps `CoursePathElectiveTrack` × 3 for C1 |
| Modify | `components/courses/CoursePathLevelPanel.tsx` | Accept `electiveTracks?` prop; render tail sections |
| Modify | `components/courses/CoursePathPage.tsx` | Remove global electives section; pass `electiveTracks` |
| Modify | `app/styles/course-path.css` | Add IRL card styles; add C1 electives wrapper styles |

---

## Task 1: Add types

**Files:**
- Modify: `lib/courses/types.ts`

- [ ] **Step 1: Add the new types**

Open `lib/courses/types.ts`. After the `CoursePathLegendItem` interface, add:

```ts
export interface RealLifeVocabItem {
  word: string;
  meaning: string;
}

export interface RealLifeScenario {
  id: string;
  title: string;
  emoji?: string;
  phrases: string[];
  vocab: RealLifeVocabItem[];
}
```

Then add `realLife?: RealLifeScenario[];` to `CoursePathLevel`:

```ts
export interface CoursePathLevel {
  id: CoursePathTrackId;
  spineLabel: string;
  spineSubtitle: string;
  title: string;
  hours?: string;
  units: CoursePathUnit[];
  isElective?: boolean;
  spineIcon?: ElectiveSpineIcon;
  realLife?: RealLifeScenario[];   // ← add this line
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/courses/types.ts
git commit -m "feat(courses): add RealLifeScenario types to CoursePathLevel"
```

---

## Task 2: Add scenario data to curriculum

**Files:**
- Modify: `lib/courses/curriculum.ts`

The `buildLevel` return value is a plain object — we can spread `realLife` onto it after the call. Pattern: `{ ...buildLevel(...), realLife: [...] }`.

- [ ] **Step 1: Add A1 scenarios**

In `curriculum.ts`, change the A1 `buildLevel(...)` call from:

```ts
buildLevel(
  "a1",
  "A1",
  "Principiante",
  "Inglés Básico A1",
  "20 h",
  [ ... ]
),
```

to:

```ts
{
  ...buildLevel(
    "a1",
    "A1",
    "Principiante",
    "Inglés Básico A1",
    "20 h",
    [ ... ]
  ),
  realLife: [
    {
      id: "a1-restaurant",
      title: "At a restaurant",
      emoji: "🍽️",
      phrases: [
        "A table for two, please.",
        "Can I see the menu?",
        "I'd like the chicken, please.",
        "Can we get the bill?",
      ],
      vocab: [
        { word: "menu", meaning: "lista de comidas y precios" },
        { word: "bill", meaning: "la cuenta" },
        { word: "tip", meaning: "propina" },
        { word: "waiter", meaning: "mesero" },
      ],
    },
    {
      id: "a1-introduction",
      title: "Your first introduction",
      emoji: "👋",
      phrases: [
        "Nice to meet you, I'm [name].",
        "What do you do?",
        "I'm a [job]. And you?",
        "Where are you from?",
      ],
      vocab: [
        { word: "nice to meet you", meaning: "mucho gusto" },
        { word: "work", meaning: "trabajo / trabajar" },
        { word: "hobby", meaning: "pasatiempo" },
        { word: "from", meaning: "de (origen)" },
      ],
    },
    {
      id: "a1-daily-routine",
      title: "Talking about your day",
      emoji: "☀️",
      phrases: [
        "I usually wake up at seven.",
        "I have breakfast at home.",
        "I go to work by bus.",
        "I go to bed early.",
      ],
      vocab: [
        { word: "usually", meaning: "normalmente" },
        { word: "wake up", meaning: "despertar" },
        { word: "routine", meaning: "rutina" },
        { word: "tired", meaning: "cansado/a" },
      ],
    },
  ],
},
```

- [ ] **Step 2: Add A2 scenarios**

Change the A2 `buildLevel(...)` to spread pattern with `realLife`:

```ts
{
  ...buildLevel(
    "a2",
    "A2",
    "Elemental",
    "Inglés Básico A2",
    "19 h",
    [ ... ]
  ),
  realLife: [
    {
      id: "a2-shopping",
      title: "Shopping",
      emoji: "🛍️",
      phrases: [
        "How much does this cost?",
        "Do you have this in another size?",
        "I'll take it.",
        "Can I pay by card?",
      ],
      vocab: [
        { word: "price", meaning: "precio" },
        { word: "receipt", meaning: "recibo / ticket" },
        { word: "size", meaning: "talla / tamaño" },
        { word: "cash", meaning: "efectivo" },
      ],
    },
    {
      id: "a2-making-plans",
      title: "Making plans",
      emoji: "📅",
      phrases: [
        "Are you free on Saturday?",
        "What do you want to do?",
        "Let's meet at six.",
        "Sorry, I can't. Maybe next time.",
      ],
      vocab: [
        { word: "free", meaning: "libre / disponible" },
        { word: "plans", meaning: "planes" },
        { word: "meet up", meaning: "quedar / encontrarse" },
        { word: "next time", meaning: "la próxima vez" },
      ],
    },
    {
      id: "a2-directions",
      title: "Asking for directions",
      emoji: "🗺️",
      phrases: [
        "Excuse me, where is the bank?",
        "Turn left at the traffic light.",
        "It's next to the supermarket.",
        "How far is it?",
      ],
      vocab: [
        { word: "turn left / right", meaning: "girar a la izquierda / derecha" },
        { word: "straight ahead", meaning: "todo recto" },
        { word: "corner", meaning: "esquina" },
        { word: "far", meaning: "lejos" },
      ],
    },
  ],
},
```

- [ ] **Step 3: Add B1 scenarios**

```ts
{
  ...buildLevel(
    "b1",
    "B1",
    "Intermedio",
    "Inglés Intermedio B1",
    "28 h",
    [ ... ]
  ),
  realLife: [
    {
      id: "b1-doctor",
      title: "At the doctor's",
      emoji: "🏥",
      phrases: [
        "I've had a headache for two days.",
        "It hurts when I move it.",
        "I've been feeling really tired lately.",
        "Should I take anything for it?",
      ],
      vocab: [
        { word: "symptoms", meaning: "síntomas" },
        { word: "prescription", meaning: "receta médica" },
        { word: "follow up", meaning: "cita de seguimiento" },
        { word: "dizzy", meaning: "mareado/a" },
      ],
    },
    {
      id: "b1-storytelling",
      title: "Telling a story",
      emoji: "📖",
      phrases: [
        "So what happened was…",
        "I couldn't believe it.",
        "Eventually, everything worked out.",
        "You're not going to believe this, but…",
      ],
      vocab: [
        { word: "suddenly", meaning: "de repente" },
        { word: "eventually", meaning: "finalmente / con el tiempo" },
        { word: "meanwhile", meaning: "mientras tanto" },
        { word: "turn out", meaning: "resultar (que)" },
      ],
    },
    {
      id: "b1-work-email",
      title: "Writing a work email",
      emoji: "✉️",
      phrases: [
        "I'm writing to follow up on…",
        "Please let me know if you need anything else.",
        "I'd appreciate a response by Friday.",
        "Looking forward to hearing from you.",
      ],
      vocab: [
        { word: "follow up", meaning: "dar seguimiento" },
        { word: "regarding", meaning: "con respecto a" },
        { word: "attached", meaning: "adjunto" },
        { word: "appreciate", meaning: "agradecer / valorar" },
      ],
    },
  ],
},
```

- [ ] **Step 4: Add B2 scenarios**

```ts
{
  ...buildLevel(
    "b2",
    "B2",
    "Int. alto",
    "Inglés Intermedio Alto B2",
    "21 h",
    [ ... ]
  ),
  realLife: [
    {
      id: "b2-opinions",
      title: "Giving your opinion",
      emoji: "💬",
      phrases: [
        "I'd argue that…",
        "To be honest, I think…",
        "It's a valid point, but…",
        "From my perspective…",
      ],
      vocab: [
        { word: "perspective", meaning: "perspectiva" },
        { word: "valid point", meaning: "punto válido" },
        { word: "nuance", meaning: "matiz" },
        { word: "argue", meaning: "argumentar / sostener" },
      ],
    },
    {
      id: "b2-anecdote",
      title: "Telling an anecdote",
      emoji: "😄",
      phrases: [
        "I was just about to leave when…",
        "The thing is, I had no idea that…",
        "Looking back on it now, I realize…",
        "It was one of those moments where…",
      ],
      vocab: [
        { word: "just about to", meaning: "estar a punto de" },
        { word: "looking back", meaning: "mirando atrás" },
        { word: "realize", meaning: "darse cuenta" },
        { word: "end up", meaning: "terminar / acabar haciendo algo" },
      ],
    },
    {
      id: "b2-negotiation",
      title: "Negotiating at work",
      emoji: "🤝",
      phrases: [
        "I understand your position, however…",
        "Could we find a middle ground?",
        "I'd be willing to if you could…",
        "Let's revisit this next week.",
      ],
      vocab: [
        { word: "middle ground", meaning: "punto intermedio" },
        { word: "willing", meaning: "dispuesto/a" },
        { word: "revisit", meaning: "retomar / volver a ver" },
        { word: "trade-off", meaning: "concesión mutua" },
      ],
    },
  ],
},
```

- [ ] **Step 5: Add C1 scenarios**

```ts
{
  ...buildLevel(
    "c1",
    "C1",
    "Avanzado",
    "Inglés Avanzado C1",
    "15 h",
    [ ... ]
  ),
  realLife: [
    {
      id: "c1-ambiguity",
      title: "Navigating ambiguity",
      emoji: "🌫️",
      phrases: [
        "I see where you're coming from, but…",
        "That depends on how you look at it.",
        "There's more to it than meets the eye.",
        "It's a bit of a grey area.",
      ],
      vocab: [
        { word: "implication", meaning: "implicación / consecuencia sobreentendida" },
        { word: "subtext", meaning: "subtexto / lo que no se dice" },
        { word: "grey area", meaning: "zona gris / no claro" },
        { word: "nuanced", meaning: "matizado / con muchos ángulos" },
      ],
    },
    {
      id: "c1-humor",
      title: "Humor and irony",
      emoji: "😏",
      phrases: [
        "Oh, obviously that went exactly as planned.",
        "Well, that was fun. Said no one ever.",
        "Right, because that makes total sense.",
        "I'm sure that'll go brilliantly.",
      ],
      vocab: [
        { word: "understatement", meaning: "decir menos de lo que se siente (ironía suave)" },
        { word: "sarcasm", meaning: "sarcasmo" },
        { word: "deadpan", meaning: "humor seco / sin expresión" },
        { word: "tongue-in-cheek", meaning: "irónico / no completamente en serio" },
      ],
    },
    {
      id: "c1-persuasion",
      title: "Persuading subtly",
      emoji: "🎯",
      phrases: [
        "You might want to consider…",
        "It's worth bearing in mind that…",
        "One could make the case that…",
        "I'd be remiss not to mention…",
      ],
      vocab: [
        { word: "hedging", meaning: "suavizar afirmaciones para sonar menos directo" },
        { word: "softener", meaning: "expresión que mitiga el impacto" },
        { word: "conviction", meaning: "convicción / certeza firme" },
        { word: "remiss", meaning: "negligente / que falla en su deber" },
      ],
    },
  ],
},
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/courses/curriculum.ts
git commit -m "feat(courses): add Real Life English scenarios to all CEFR levels"
```

---

## Task 3: Create `CoursePathRealLifeCard`

**Files:**
- Create: `components/courses/CoursePathRealLifeCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
// Planned structure:
// <CoursePathRealLifeCard>
//   <header (emoji + title)>
//   <phrases list>
//   <vocab list>
// </CoursePathRealLifeCard>

import type { RealLifeScenario } from "@/lib/courses/types";

interface CoursePathRealLifeCardProps {
  scenario: RealLifeScenario;
}

export default function CoursePathRealLifeCard({ scenario }: CoursePathRealLifeCardProps) {
  return (
    <div className="course-path__irl-card">
      <div className="course-path__irl-card-head">
        {scenario.emoji && <span aria-hidden>{scenario.emoji}</span>}
        <span>{scenario.title}</span>
      </div>
      <ul className="course-path__irl-phrases" aria-label="Example phrases">
        {scenario.phrases.map((phrase, i) => (
          <li key={i}>{phrase}</li>
        ))}
      </ul>
      <dl className="course-path__irl-vocab">
        {scenario.vocab.map((item) => (
          <div key={item.word} className="course-path__irl-vocab-row">
            <dt>{item.word}</dt>
            <dd>{item.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/courses/CoursePathRealLifeCard.tsx
git commit -m "feat(courses): add CoursePathRealLifeCard component"
```

---

## Task 4: Create `CoursePathRealLife`

**Files:**
- Create: `components/courses/CoursePathRealLife.tsx`

- [ ] **Step 1: Create the file**

```tsx
// Planned structure:
// <CoursePathRealLife>
//   <button (toggle header)>
//   <grid of CoursePathRealLifeCard />
// </CoursePathRealLife>

"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RealLifeScenario } from "@/lib/courses/types";
import CoursePathRealLifeCard from "@/components/courses/CoursePathRealLifeCard";

interface CoursePathRealLifeProps {
  scenarios: RealLifeScenario[];
}

export default function CoursePathRealLife({ scenarios }: CoursePathRealLifeProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("course-path__irl", open && "course-path__irl--open")}>
      <button
        type="button"
        className="course-path__irl-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>🌍 English for every day</span>
        <ChevronRight className="course-path__irl-chev" size={16} aria-hidden />
      </button>
      <div className="course-path__irl-body-wrap">
        <div className="course-path__irl-grid">
          {scenarios.map((s) => (
            <CoursePathRealLifeCard key={s.id} scenario={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/courses/CoursePathRealLife.tsx
git commit -m "feat(courses): add CoursePathRealLife collapsible section"
```

---

## Task 5: Create `CoursePathC1Electives`

**Files:**
- Create: `components/courses/CoursePathC1Electives.tsx`

- [ ] **Step 1: Create the file**

```tsx
// Planned structure:
// <CoursePathC1Electives>
//   <header>
//   <CoursePathElectiveTrack /> × n
// </CoursePathC1Electives>

import type { CoursePathLevel } from "@/lib/courses/types";
import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";

interface CoursePathC1ElectivesProps {
  tracks: CoursePathLevel[];
}

export default function CoursePathC1Electives({ tracks }: CoursePathC1ElectivesProps) {
  return (
    <section className="course-path__c1-electives" aria-labelledby="c1-electives-heading">
      <h3 id="c1-electives-heading" className="course-path__c1-electives-title">
        After C1<span aria-hidden> · </span>elective tracks
      </h3>
      <p className="course-path__c1-electives-sub">
        Specific purposes and business English. Optional courses within each track appear at the end
        of each list.
      </p>
      <div className="course-path__rutas">
        {tracks.map((track, i) => (
          <CoursePathElectiveTrack key={track.id} level={track} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/courses/CoursePathC1Electives.tsx
git commit -m "feat(courses): add CoursePathC1Electives wrapper component"
```

---

## Task 6: Update `CoursePathLevelPanel`

**Files:**
- Modify: `components/courses/CoursePathLevelPanel.tsx`

- [ ] **Step 1: Add `electiveTracks` prop and tail sections**

Add the import and prop at the top of the file:

```tsx
import CoursePathRealLife from "@/components/courses/CoursePathRealLife";
import CoursePathC1Electives from "@/components/courses/CoursePathC1Electives";
```

Update the interface:

```ts
interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  openUnits?: Record<string, boolean>;
  onToggleUnit?: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  electiveTracks?: CoursePathLevel[];
}
```

Update the function signature to destructure `electiveTracks`:

```ts
export default function CoursePathLevelPanel({ level, compactHead, openUnits: openUnitsProp, onToggleUnit, electiveTracks }: CoursePathLevelPanelProps) {
```

At the end of the returned fragment, after `</div>` that closes `.course-path__units`, add:

```tsx
{level.realLife && level.realLife.length > 0 && (
  <CoursePathRealLife scenarios={level.realLife} />
)}
{level.id === "c1" && electiveTracks && electiveTracks.length > 0 && (
  <CoursePathC1Electives tracks={electiveTracks} />
)}
```

The full return block tail should look like:

```tsx
      <div className="course-path__units">
        {/* ...existing units map... */}
      </div>

      {level.realLife && level.realLife.length > 0 && (
        <CoursePathRealLife scenarios={level.realLife} />
      )}
      {level.id === "c1" && electiveTracks && electiveTracks.length > 0 && (
        <CoursePathC1Electives tracks={electiveTracks} />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/courses/CoursePathLevelPanel.tsx
git commit -m "feat(courses): render RealLife and C1 electives inside level panel"
```

---

## Task 7: Update `CoursePathPage`

**Files:**
- Modify: `components/courses/CoursePathPage.tsx`

- [ ] **Step 1: Remove the global electives section and pass `electiveTracks` down**

Remove these imports (no longer needed at page level):
```tsx
import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";
```

Remove the `MicVocal` and `ArrowRight` imports if only used in the electives section (check — they are used in the `course-path__why` block, so keep them).

Remove the entire `<section className="course-path__electives">` block (lines 102–115 in the current file).

Add `electiveTracks` prop to the `CoursePathLevelPanel` call:

```tsx
<CoursePathLevelPanel
  level={level}
  openUnits={openUnitsForLevel}
  onToggleUnit={setOpenUnitsForLevel}
  electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
/>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/courses/CoursePathPage.tsx
git commit -m "feat(courses): move elective tracks to C1 panel, remove global footer section"
```

---

## Task 8: Add CSS for IRL cards and C1 electives

**Files:**
- Modify: `app/styles/course-path.css`

- [ ] **Step 1: Add IRL section styles**

At the end of the file (before `@media` blocks), add:

```css
/* ── Real Life English section ───────────────────────────── */

.course-path__irl {
  margin-top: var(--space-6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-raised);
}

.course-path__irl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  gap: var(--space-2);
}

.course-path__irl-header:hover {
  background: var(--surface-sunken);
}

.course-path__irl-header:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
  border-radius: var(--radius-lg);
}

.course-path__irl-chev {
  color: var(--text-tertiary);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), color 0.15s;
  flex-shrink: 0;
}

.course-path__irl--open .course-path__irl-chev {
  transform: rotate(90deg);
  color: var(--primary);
}

.course-path__irl-body-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.22s cubic-bezier(0.25, 1, 0.5, 1);
}

.course-path__irl--open .course-path__irl-body-wrap {
  grid-template-rows: 1fr;
}

.course-path__irl-body-wrap > * {
  overflow: hidden;
}

.course-path__irl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.course-path__irl-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.course-path__irl-card-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.course-path__irl-phrases {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.course-path__irl-phrases li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
  padding-left: var(--space-3);
  border-left: 2px solid color-mix(in oklch, var(--primary) 35%, var(--border-subtle));
}

.course-path__irl-vocab {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
}

.course-path__irl-vocab-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.course-path__irl-vocab-row dt {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--primary);
}

.course-path__irl-vocab-row dd {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin: 0;
}

/* ── C1 electives inside level panel ─────────────────────── */

.course-path__c1-electives {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-subtle);
}

.course-path__c1-electives-title {
  font-family: var(--font-editorial), Georgia, serif;
  font-weight: 480;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.course-path__c1-electives-sub {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.course-path__c1-electives > .course-path__rutas {
  margin-top: var(--space-3);
}
```

- [ ] **Step 2: Add reduced-motion rules for IRL section**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .course-path__irl-body-wrap {
    transition: none;
  }

  .course-path__irl-chev {
    transition: none;
  }
```

- [ ] **Step 3: Remove now-unused electives CSS (optional cleanup)**

The `.course-path__electives` and `.course-path__electives-title` and `.course-path__electives-sub` classes are no longer used. Remove them (lines ~628–651 in the current file — the block starting with `/* ── Electives section ───────── */`).

Keep `.course-path__rutas`, `.course-path__ruta`, `.course-path__rrow`, and all related elective track classes — they are still used by `CoursePathElectiveTrack`.

- [ ] **Step 4: Verify TypeScript and build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/styles/course-path.css
git commit -m "feat(courses): add IRL card and C1 electives CSS"
```

---

## Task 9: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Navigate to `http://localhost:3000/courses`.

- [ ] **Step 2: Verify A1 panel**

- Select A1 in the spine. Scroll to the bottom of the panel.
- "🌍 English for every day" section appears collapsed.
- Click it — 3 cards expand: "At a restaurant", "Your first introduction", "Talking about your day".
- No "After C1 · elective tracks" section is visible anywhere on the page.

- [ ] **Step 3: Verify C1 panel**

- Select C1 in the spine.
- "🌍 English for every day" section appears with 3 C1 scenarios.
- Below it, "After C1 · elective tracks" section appears with Tech, Biz, Connected Speech accordions.
- Each elective track expands and shows its lessons exactly as before.

- [ ] **Step 4: Verify other levels (A2, B1, B2)**

- Each shows "English for every day" at the bottom.
- No elective tracks visible.

- [ ] **Step 5: Final commit if any last tweaks**

```bash
git add -p
git commit -m "fix(courses): post-verification tweaks"
```
