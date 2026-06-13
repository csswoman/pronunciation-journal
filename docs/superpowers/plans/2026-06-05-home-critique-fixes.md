# Home Page Critique Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five issues identified in the home page critique: language split (P0), broken recording feature (P1), duplicate hero CTAs (P2), inline font styles (P2), and minor bugs (date key, retry button, accessibility labels).

**Architecture:** All changes are isolated to `components/home/` and `components/daily/`. No new routes, no new API calls, no schema changes. Task 1 is the language fix (highest trust impact). Tasks 2–5 are independent and can be done in any order after Task 1. Task 6 bundles the small bugs.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, Lucide icons. The `.font-display` Tailwind utility already exists in `app/styles/utilities.css:130`. The `.font-editorial` utility does not exist yet and must be added.

---

## File Map

| File | Change |
|---|---|
| `app/styles/utilities.css` | Add `.font-editorial` utility (Task 5) |
| `components/home/HomeDailyCard.tsx` | Translate strings (Task 1), remove inline fontFamily (Task 5), fix expandedKey padding (Task 6), remove redundant step ordinal (Task 6) |
| `components/home/HomeReviewQueueCard.tsx` | Translate strings (Task 1), add retry button on error (Task 6) |
| `components/home/HomeHeaderActions.tsx` | Demote to ghost/secondary buttons (Task 3) |
| `components/home/HomeWordOfDayCard.tsx` | Remove fake "Play my recording" button (Task 2) |
| `components/home/HomeGoalRing.tsx` | Remove inline fontFamily (Task 5), add aria-label to outer div (Task 6) |
| `components/home/HomeSectionHeader.tsx` | Remove inline fontFamily (Task 5) |
| `components/home/HomeStreakBadge.tsx` | Remove inline fontFamily (Task 5), add accessible label to streak count (Task 6) |
| `components/home/HomeRetentionCard.tsx` | Remove inline fontFamily (Task 5) |
| `components/home/HomeReviewWordRow.tsx` | Remove inline fontFamily (Task 5) |
| `components/home/HomeDiscoveryCard.tsx` | Remove inline fontFamily (Task 5) |
| `components/home/HomeMiniLessonCard.tsx` | Remove inline fontFamily (Task 5) |
| `components/home/HomeHeaderGreeting.tsx` | Remove inline fontFamily, add font-editorial (Task 5) |
| `components/daily/DailyChecklist.tsx` | Translate strings (Task 1) |

---

## Task 1: Translate Spanish strings to English

**Context:** `HomeDailyCard`, `HomeReviewQueueCard`, and `DailyChecklist` contain Spanish UI strings — badge labels, headings, descriptions, CTAs, loading states, error messages, and success states. Every surrounding component is English. This is the P0 issue.

**Files:**
- Modify: `components/home/HomeDailyCard.tsx`
- Modify: `components/home/HomeReviewQueueCard.tsx`
- Modify: `components/daily/DailyChecklist.tsx`

- [ ] **Step 1: Translate HomeDailyCard.tsx**

Replace every Spanish string in `components/home/HomeDailyCard.tsx`. The file has two render paths (collapsed and expanded) plus a loading/error/done state inside the expanded view.

Change these strings:

```
Badge label="Plan de hoy"                   → label="Today's plan"
"Tu diaria"                                 → "Your daily"
"Empieza con una mezcla de sonidos, pares mínimos y un concepto nuevo — sin necesidad de avance previo."
  → "Start with a mix of sounds, minimal pairs, and a new concept — no prior progress needed."
"Una mezcla equilibrada de repaso, tus sonidos débiles y algo nuevo."
  → "A balanced mix of review, your weak sounds, and something new."
"Practicar de nuevo"                        → "Practice again"
"Empezar plan de hoy"                       → "Start today's plan"
"Preparando tu plan de hoy…"               → "Preparing your plan…"
"No se pudo preparar tu plan de hoy."      → "Couldn't prepare your plan."
"¡Diaria cumplida!"                        → "Daily complete!"
"Completaste tus {steps.length} pasos de hoy. Tu racha sigue viva."
  → "You completed all {steps.length} steps today. Your streak is alive."
"Ejercicios libres"                        → "Free practice"
```

After editing, the collapsed card section (lines ~109–156) should look like:

```tsx
<Badge label="Today's plan" variant="default" className="self-start mb-3.5" />
<h3 className="text-2xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
  Your daily
</h3>
<p className="mt-1 text-[15px] text-[var(--text-secondary)] leading-snug">
  {isNewUser
    ? 'Start with a mix of sounds, minimal pairs, and a new concept — no prior progress needed.'
    : 'A balanced mix of review, your weak sounds, and something new.'}
</p>
```

The CTA button (line ~147):
```tsx
{completedToday ? 'Practice again' : "Start today's plan"}
```

The expanded loading state (line ~172):
```tsx
<span className="animate-pulse text-fg-subtle">Preparing your plan…</span>
```

The expanded error state (line ~178):
```tsx
<p className="text-error">Couldn't prepare your plan.</p>
<Button type="button" variant="primary" size="sm" onClick={() => void load()}>
  Retry
</Button>
```

The expanded done state (lines ~191–197):
```tsx
<p className="text-lg font-medium text-[var(--text-primary)]">Daily complete!</p>
<p className="max-w-xs text-[13px] text-[var(--text-secondary)]">
  You completed all {steps.length} steps today. Your streak is alive.
</p>
<Link href="/practice/sounds">
  <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
    Free practice
  </Button>
</Link>
```

The expanded badge (line ~162):
```tsx
<Badge label="Today's plan" variant="default" />
```

- [ ] **Step 2: Translate HomeReviewQueueCard.tsx**

Three Spanish strings in this file:

Line ~118 — the Anchor link label:
```tsx
<Anchor
  href="/daily"
  icon={<ArrowRight size={14} />}
  iconPosition="right"
  className="shrink-0 text-caption"
>
  View daily
</Anchor>
```

Line ~238 — the done state:
```tsx
<div className="mt-3 rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-3 text-center text-sm text-[var(--text-secondary)]">
  Review complete! Come back tomorrow.
</div>
```

Line ~252 — loading CTA label:
```tsx
{reviewState.phase === "loading" ? "Preparing…" : "Start review"}
```

Line ~258 — error text:
```tsx
<p className="mt-2 text-center text-xs text-[var(--error)]">
  Couldn't load the review. Try again.
</p>
```

- [ ] **Step 3: Translate DailyChecklist.tsx**

Five Spanish strings in this file:

```
Line 50: "Preparando tu plan de hoy…"           → "Preparing your plan…"
Line 59: "No se pudo preparar tu plan de hoy. Inténtalo de nuevo." → "Couldn't prepare your plan. Please try again."
Line 61: "Reintentar"                            → "Retry"
Line 93: "¡Diaria cumplida!"                    → "Daily complete!"
Line 96: "Completaste tus {steps.length} pasos de hoy. Tu racha sigue viva — vuelve mañana para..."
  → "You completed all {steps.length} steps today. Your streak is alive — come back tomorrow."
Line 107: "Ejercicios libres"                   → "Free practice"
Line 120: Badge label="Plan de hoy"             → label="Today's plan"
Line 122: "Tu diaria"                           → "Your daily"
```

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeDailyCard.tsx components/home/HomeReviewQueueCard.tsx components/daily/DailyChecklist.tsx
git commit -m "fix(i18n): translate all Spanish UI strings to English in home and daily components"
```

---

## Task 2: Remove fake "Play my recording" button from HomeWordOfDayCard

**Context:** When `useSpeechInput` finishes, it returns a text transcript (string). The component wraps this in `new Blob([transcript], { type: "text/plain" })` and passes the object URL to `new Audio()`. A text blob is not playable audio. The button appears to record the user's voice but plays nothing. This is a P1 functional bug. The fix is to remove the fake playback button entirely — real OGG/Opus recording is handled elsewhere in the app and is out of scope here.

**File:**
- Modify: `components/home/HomeWordOfDayCard.tsx`

- [ ] **Step 1: Remove the fake recording playback state and button**

In `HomeWordOfDayCard.tsx`, make these deletions:

1. Remove the `recordedUrl` and `playingRecording` state declarations and the `audioRef`:
```tsx
// DELETE these three lines:
const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
const [playingRecording, setPlayingRecording] = useState(false);
const audioRef = useRef<HTMLAudioElement | null>(null);
```

2. Remove the `playRecording` function entirely (lines ~53–65).

3. Remove the `useEffect` that sets `recordedUrl` from the transcript (lines ~45–51):
```tsx
// DELETE this useEffect:
useEffect(() => {
  if (state !== "done") return;
  const transcript = result?.transcript ?? "";
  if (!transcript) return;
  const blob = new Blob([transcript], { type: "text/plain" });
  setRecordedUrl(URL.createObjectURL(blob));
}, [state, result]);
```

4. Remove the `stopRecording` function's call to `setRecordedUrl(null)`:
```tsx
async function stopRecording() {
  await stop();
  setIsRecording(false);
  // DELETE: setRecordedUrl(null)  ← this line goes
}
```

Wait — `setRecordedUrl(null)` was inside `startRecording`. Fix that too:
```tsx
async function startRecording() {
  // DELETE: setRecordedUrl(null)
  await start();
  setIsRecording(true);
}
```

5. Remove the conditional "Play my recording" button block (~lines 169–181):
```tsx
// DELETE this entire block:
{recordedUrl && (
  <Button
    variant="secondary"
    size="sm"
    icon={<Play size={14} />}
    onClick={playRecording}
    disabled={playingRecording}
    fullWidth
    className="mt-2"
  >
    {playingRecording ? "Playing…" : "Play my recording"}
  </Button>
)}
```

6. Update the `WaveformVisualizer` — remove `playingRecording` from `isActive`:
```tsx
<WaveformVisualizer
  isActive={speaking}
  isRecording={isRecording}
  color="gradient"
  className="mt-3 h-8"
/>
```

7. Remove now-unused imports: `useRef`, `Play` (from lucide-react). Verify `Square` is still used (it is, for the stop-recording button). The updated imports should be:
```tsx
import { useState, useEffect } from "react";
import { Volume2, Mic, Square, Loader2, RotateCcw } from "lucide-react";
```

- [ ] **Step 2: Add aria-label to the RotateCcw refresh button**

The refresh button currently only has `title="Refresh"`. Add `aria-label`:
```tsx
<button
  type="button"
  onClick={() => refresh()}
  className="text-fg-subtle transition-colors hover:text-fg-muted"
  aria-label="Refresh word of the day"
  title="Refresh word of the day"
>
  <RotateCcw size={13} />
</button>
```

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeWordOfDayCard.tsx
git commit -m "fix(home): remove fake audio playback from word-of-day card; add aria-label to refresh button"
```

---

## Task 3: Demote hero CTAs to ghost buttons

**Context:** `HomeHeaderActions` renders a primary and a secondary button in the hero before any section content. These compete with the more specific section-01 CTAs ("Start today's plan") and route users away from the recommended daily action. Demoting both to ghost style makes them available as quick-access shortcuts without fighting for attention against the daily card.

**File:**
- Modify: `components/home/HomeHeaderActions.tsx`

- [ ] **Step 1: Change button variants to ghost**

Replace the current button variants. The component currently has `variant="primary"` and `variant="secondary"`. Change both to `variant="ghost"`:

```tsx
export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="ghost"
        size="md"
        icon={<Play size={16} className="fill-current" />}
        onClick={() => router.push("/courses")}
      >
        {hasStartedLearning ? "Continue learning" : "Start learning"}
      </Button>
      <Button
        variant="ghost"
        size="md"
        icon={<BookOpen size={16} />}
        onClick={() => router.push("/vocabulary")}
      >
        Explore vocabulary
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/HomeHeaderActions.tsx
git commit -m "fix(home): demote hero CTAs to ghost variant to reduce competition with daily-plan CTA"
```

---

## Task 4: Fix AI Practice card destination and label

**Context:** `HomeAiPracticeCard` has a "Start session" button that links to `/practice/sounds` — the phoneme sound lab, not an AI conversation session. This is a mismatch between label and destination that will confuse users who click expecting AI-driven practice.

**File:**
- Modify: `components/home/HomeAiPracticeCard.tsx`

- [ ] **Step 1: Rename the button label to match its actual destination**

The "Start session" button links to `/practice/sounds`. That route is the sound lab. Rename the label to reflect what the user will actually get:

```tsx
<Link href="/practice/sounds">
  <Button variant="primary" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
    Practice sounds
  </Button>
</Link>
```

The "Topics" button already points to `/practice` with the correct label — leave it unchanged.

- [ ] **Step 2: Commit**

```bash
git add components/home/HomeAiPracticeCard.tsx
git commit -m "fix(home): rename AI card CTA from 'Start session' to 'Practice sounds' to match actual route"
```

---

## Task 5: Replace inline fontFamily with .font-display / .font-editorial Tailwind utilities

**Context:** `app/styles/utilities.css` already defines `.font-display { font-family: var(--font-display), serif; }` at line 130, but no `.font-editorial` utility exists. `HomeHeaderGreeting` uses `var(--font-editorial)` — the editorial/display serif used for the h1 greeting. There are 14 inline `style={{ fontFamily: ... }}` occurrences across home components. All can be replaced with the existing or new utility class. This removes runtime style props that bypass the token system.

**Files:**
- Modify: `app/styles/utilities.css`
- Modify: `components/home/HomeDailyCard.tsx`
- Modify: `components/home/HomeDiscoveryCard.tsx`
- Modify: `components/home/HomeGoalRing.tsx`
- Modify: `components/home/HomeHeaderGreeting.tsx`
- Modify: `components/home/HomeMiniLessonCard.tsx`
- Modify: `components/home/HomeRetentionCard.tsx`
- Modify: `components/home/HomeReviewQueueCard.tsx`
- Modify: `components/home/HomeReviewWordRow.tsx`
- Modify: `components/home/HomeSectionHeader.tsx`
- Modify: `components/home/HomeStreakBadge.tsx`

- [ ] **Step 1: Add .font-editorial to utilities.css**

In `app/styles/utilities.css`, add the `.font-editorial` utility immediately after `.font-display` (line 130):

```css
.font-display  { font-family: var(--font-display), serif; }
.font-editorial { font-family: var(--font-editorial), serif; }
```

- [ ] **Step 2: Replace inline fontFamily in HomeSectionHeader.tsx**

Current (lines ~12 and ~18):
```tsx
<span
  className="text-base italic text-[var(--primary)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```
```tsx
<h2
  className="text-2xl font-medium tracking-tight text-[var(--text-primary)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```

Replace — add `font-display` to className, remove `style`:
```tsx
<span className="font-display text-base italic text-[var(--primary)]">
```
```tsx
<h2 className="font-display text-2xl font-medium tracking-tight text-[var(--text-primary)]">
```

- [ ] **Step 3: Replace inline fontFamily in HomeStreakBadge.tsx**

Current (line ~49):
```tsx
<b
  className="text-2xl block leading-none text-[var(--text-primary)] mt-0.5"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```

Replace:
```tsx
<b className="font-display text-2xl block leading-none text-[var(--text-primary)] mt-0.5">
```

- [ ] **Step 4: Replace inline fontFamily in HomeGoalRing.tsx**

Current (line ~52):
```tsx
<b
  className="text-xl leading-none text-[var(--text-primary)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```

Replace:
```tsx
<b className="font-display text-xl leading-none text-[var(--text-primary)]">
```

- [ ] **Step 5: Replace inline fontFamily in HomeRetentionCard.tsx**

Two occurrences. Line ~33:
```tsx
<p
  className="mt-1.5 text-h2 leading-none text-[var(--primary)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```
→
```tsx
<p className="font-display mt-1.5 text-h2 leading-none text-[var(--primary)]">
```

Line ~70:
```tsx
<b
  className="shrink-0 text-[var(--warning-value)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```
→
```tsx
<b className="font-display shrink-0 text-[var(--warning-value)]">
```

- [ ] **Step 6: Replace inline fontFamily in HomeReviewQueueCard.tsx**

Two occurrences. Line ~107 (card heading):
```tsx
<h3
  className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```
→
```tsx
<h3 className="font-display text-xl font-semibold tracking-tight text-[var(--text-primary)]">
```

Line ~167 (word text in list):
```tsx
<span style={{ fontFamily: "var(--font-display), serif" }}>{w.text}</span>
```
→
```tsx
<span className="font-display">{w.text}</span>
```

- [ ] **Step 7: Replace inline fontFamily in HomeReviewWordRow.tsx**

One occurrence (line ~49):
```tsx
// Find the element with style={{ fontFamily: "var(--font-display), serif" }}
// Remove style prop, add font-display to className
```

Read the exact element first — it's a heading or word span. Apply the same pattern: remove `style={{ fontFamily: "var(--font-display), serif" }}`, add `font-display` to the className.

- [ ] **Step 8: Replace inline fontFamily in HomeDiscoveryCard.tsx**

One occurrence (line ~32). Same pattern: remove style prop, add `font-display` to className.

- [ ] **Step 9: Replace inline fontFamily in HomeMiniLessonCard.tsx**

One occurrence (line ~19):
```tsx
<h4
  className="text-lg font-medium leading-snug text-[var(--text-primary)]"
  style={{ fontFamily: "var(--font-display), serif" }}
>
```
→
```tsx
<h4 className="font-display text-lg font-medium leading-snug text-[var(--text-primary)]">
```

- [ ] **Step 10: Replace inline fontFamily in HomeHeaderGreeting.tsx**

One occurrence (line ~47). This element uses `var(--font-editorial)`, not `var(--font-display)`, and also sets `fontOpticalSizing: "auto"`. Replace the `fontFamily` part with the utility class, but keep `fontOpticalSizing` as a runtime style (it has no Tailwind equivalent):

```tsx
<h1
  className="font-editorial text-3xl font-light leading-tight tracking-tight"
  style={{ fontOpticalSizing: "auto" } as React.CSSProperties}
>
```

- [ ] **Step 11: Replace inline fontFamily in HomeDailyCard.tsx**

Two occurrences in the collapsed view. Line ~114:
```tsx
<h3 className="font-display text-2xl font-medium text-[var(--text-primary)]">
  Your daily
</h3>
```

Line ~130 (step ordinal span):
```tsx
<span className="font-display font-medium text-[var(--text-tertiary)]">
  {String(i + 1).padStart(2, '0')}
</span>
```

- [ ] **Step 12: Commit**

```bash
git add app/styles/utilities.css \
  components/home/HomeSectionHeader.tsx \
  components/home/HomeStreakBadge.tsx \
  components/home/HomeGoalRing.tsx \
  components/home/HomeRetentionCard.tsx \
  components/home/HomeReviewQueueCard.tsx \
  components/home/HomeReviewWordRow.tsx \
  components/home/HomeDiscoveryCard.tsx \
  components/home/HomeMiniLessonCard.tsx \
  components/home/HomeHeaderGreeting.tsx \
  components/home/HomeDailyCard.tsx
git commit -m "refactor(home): replace all inline fontFamily styles with .font-display / .font-editorial utilities"
```

---

## Task 6: Minor bugs and accessibility fixes

**Context:** Six small, independent fixes identified in the critique. Each is a one-line-or-fewer change. Bundled into one task to avoid micro-commits for trivial items.

**Files:**
- Modify: `components/home/HomeDailyCard.tsx`
- Modify: `components/home/HomeReviewQueueCard.tsx`
- Modify: `components/home/HomeGoalRing.tsx`
- Modify: `components/home/HomeStreakBadge.tsx`

- [ ] **Step 1: Fix expandedKey date zero-padding (HomeDailyCard.tsx)**

Current (line ~30–33):
```tsx
function expandedKey(userId: string): string {
  const now = new Date()
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  return `daily-expanded:${userId}:${date}`
}
```

Replace with zero-padded ISO date:
```tsx
function expandedKey(userId: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `daily-expanded:${userId}:${y}-${m}-${d}`
}
```

- [ ] **Step 2: Remove redundant step ordinal number from HomeDailyCard preview**

In the collapsed card's step list (lines ~123–135), the right-side `{String(i + 1).padStart(2, '0')}` ordinal number is redundant — the icon on the left already establishes sequence. Remove that span:

```tsx
<ol className="mt-5 flex flex-col gap-2.5">
  {previewSteps.map((step) => (
    <li key={step.id} className="flex items-center gap-3 text-[15px]">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-[var(--primary)]">
        <DailyStepIcon name={step.icon} size={14} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">{step.title}</span>
    </li>
  ))}
</ol>
```

Note: the loop variable `i` is no longer used after this change. Remove it from the `.map((step, i) =>` destructure → `.map((step) =>`.

- [ ] **Step 3: Add retry button to HomeReviewQueueCard error state**

Current (line ~256–259):
```tsx
{reviewState.phase === "error" ? (
  <p className="mt-2 text-center text-xs text-[var(--error)]">
    Couldn't load the review. Try again.
  </p>
) : null}
```

Replace with error + retry button:
```tsx
{reviewState.phase === "error" ? (
  <div className="mt-2 flex flex-col items-center gap-2">
    <p className="text-center text-xs text-[var(--error)]">Couldn't load the review.</p>
    <Button type="button" variant="secondary" size="sm" onClick={handleStartReview}>
      Retry
    </Button>
  </div>
) : null}
```

- [ ] **Step 4: Add accessible label to HomeGoalRing outer div**

The ring SVG is `aria-hidden`, but there's no accessible representation of the goal progress for screen readers. Add an `aria-label` to the wrapper:

```tsx
<div
  className="relative shrink-0"
  style={{ width: size, height: size }}
  aria-label={`Daily goal: ${pct}% complete`}
  role="img"
>
```

- [ ] **Step 5: Add accessible context to HomeStreakBadge streak count**

The `<b>` element renders a bare number like "5". Screen readers will announce "5" with no context. Wrap with a visually-hidden description:

```tsx
<b
  className="font-display text-2xl block leading-none text-[var(--text-primary)] mt-0.5"
  aria-label={`${current} day streak`}
>
  {current}
</b>
```

- [ ] **Step 6: Commit**

```bash
git add components/home/HomeDailyCard.tsx \
  components/home/HomeReviewQueueCard.tsx \
  components/home/HomeGoalRing.tsx \
  components/home/HomeStreakBadge.tsx
git commit -m "fix(home): expandedKey zero-padding, remove redundant step ordinal, add retry button, improve a11y labels"
```

---

## Self-Review

**Spec coverage:**
- P0 language split → Task 1 ✓
- P1 broken recording → Task 2 ✓
- P1 section grid monotony → NOT included. This is a layout restructuring task that requires visual judgment and is out of scope for a purely correctness-oriented fix plan. Recommend a follow-up `/impeccable layout` session.
- P2 hero CTAs compete → Task 3 ✓
- P2 token naming (fontFamily inline) → Task 5 ✓
- Minor: expandedKey date bug → Task 6 ✓
- Minor: redundant step ordinal → Task 6 ✓
- Minor: retry button on review error → Task 6 ✓
- Minor: AI card wrong route label → Task 4 ✓
- Minor: RotateCcw aria-label → Task 2 Step 2 ✓
- Minor: goal ring accessibility → Task 6 ✓
- Minor: streak count accessible label → Task 6 ✓

**Not included (out of scope):**
- Grid layout monotony (P1) — visual design decision; needs `/impeccable layout`
- Token naming consolidation (`--text-primary` vs `--fg-primary`) — codebase-wide refactor; separate plan needed

**Placeholder scan:** No TBDs. All steps have exact code. HomeReviewWordRow and HomeDiscoveryCard steps 7–8 instruct to "find the element" — these files weren't fully read. Adding concrete line context:
- `HomeReviewWordRow.tsx:49` — has a `<span>` or `<p>` with the word text; apply same pattern as other font-display replacements.
- `HomeDiscoveryCard.tsx:32` — has a heading element; same pattern.

**Type consistency:** No new types introduced. All edits are string replacements, className additions, and prop removals. No cross-task type dependencies.
