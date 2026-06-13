# Home Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-first home view with a quick-actions grid and review carousel, plus visual polish to the BottomNav, without touching the existing desktop layout.

**Architecture:** `app/page.tsx` renders `HomeMobileView` (new, `md:hidden`) alongside the existing desktop sections (`hidden md:block`). `HomeMobileView` receives the same already-fetched props — no new queries. BottomNav polish is CSS-only on existing components.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, lucide-react, existing hooks (`useDailyPlan`, `buildReviewPlan`, `useAuth`)

---

## File Map

| File | Action |
|------|--------|
| `components/home/HomeQuickActionsGrid.tsx` | Create — Server Component, static 2×3 grid |
| `components/home/HomeReviewCarousel.tsx` | Create — Client Component, horizontal scroll carousel |
| `components/home/HomeMobileView.tsx` | Create — Server Component, composes mobile layout |
| `app/page.tsx` | Modify — wrap existing sections in `hidden md:block`, add `md:hidden` block |
| `components/layout/BottomNavTab.tsx` | Modify — pill indicator + hide label when inactive |
| `components/layout/BottomNav.tsx` | Modify — backdrop-blur bg, pt-3 padding |

---

## Task 1: `HomeQuickActionsGrid`

**Files:**
- Create: `components/home/HomeQuickActionsGrid.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/home/HomeQuickActionsGrid.tsx
import Link from "next/link";
import { Layers, MicVocal, BookOpen, BarChart2, Grid2x2, GraduationCap } from "lucide-react";
import type { ElementType } from "react";

// Planned structure:
// <HomeQuickActionsGrid>
//   <QuickActionCell /> × 6
// </HomeQuickActionsGrid>

const actions = [
  { title: "Decks", description: "Your vocabulary decks", href: "/words?tab=decks", Icon: Layers },
  { title: "Practice", description: "Sounds and pronunciation", href: "/practice/sounds", Icon: MicVocal },
  { title: "Courses", description: "Continue your course", href: "/courses", Icon: BookOpen },
  { title: "Progress", description: "Your stats and streaks", href: "/progress", Icon: BarChart2 },
  { title: "IPA Chart", description: "Phoneme reference table", href: "/ipa-chart", Icon: Grid2x2 },
  { title: "Mini Lesson", description: "Today's grammar bite", href: "/mini-lessons", Icon: GraduationCap },
] as const;

function QuickActionCell({
  title,
  description,
  href,
  Icon,
}: {
  title: string;
  description: string;
  href: string;
  Icon: ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
        <Icon size={18} aria-hidden />
      </span>
      <div>
        <p className="font-body-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="font-caption text-[var(--text-tertiary)]">{description}</p>
      </div>
    </Link>
  );
}

export default function HomeQuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <QuickActionCell key={action.href} {...action} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeQuickActionsGrid.tsx
git commit -m "feat(home): add HomeQuickActionsGrid for mobile quick access"
```

---

## Task 2: `HomeReviewCarousel`

**Files:**
- Create: `components/home/HomeReviewCarousel.tsx`

This component mirrors the review-session logic from `HomeReviewQueueCard` but renders as a horizontal snap carousel.

- [ ] **Step 1: Create the component**

```tsx
// components/home/HomeReviewCarousel.tsx
"use client";

// Planned structure:
// <HomeReviewCarousel>
//   <HomeSectionHeader />
//   <div scroll-container>
//     <WordCard /> × n
//     <SoundCard /> × n
//     <StartReviewCard />   ← or EmptyCard
//   </div>
//   <PracticeSession overlay (when active) />
// </HomeReviewCarousel>

import { useState, useCallback } from "react";
import { Check, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import PracticeSession from "@/components/practice/PracticeSession";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";
import { getWordStrength } from "@/lib/word-bank/strength";
import { buildReviewPlan } from "@/lib/practice/daily-plan";
import { useAuth } from "@/components/auth/AuthProvider";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";
import type { DailyStep } from "@/lib/practice/types";

interface HomeReviewCarouselProps {
  words?: WordBankEntry[];
  dueCount?: number;
  soundsDue?: SoundDueHome[];
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return "";
  return ipa.startsWith("/") ? ipa : `/${ipa.replace(/^\/|\/$/g, "")}/`;
}

type ReviewState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "session"; steps: DailyStep[]; stepIndex: number }
  | { phase: "done" };

export default function HomeReviewCarousel({
  words = [],
  dueCount = 0,
  soundsDue = [],
}: HomeReviewCarouselProps) {
  const { user } = useAuth();
  const [reviewState, setReviewState] = useState<ReviewState>({ phase: "idle" });
  const [sessionKey, setSessionKey] = useState(0);

  const totalDue = dueCount + soundsDue.length;

  const handleStartReview = useCallback(async () => {
    if (!user) return;
    setReviewState({ phase: "loading" });
    try {
      const plan = await buildReviewPlan(user.id);
      if (plan.nothingDue || plan.steps.length === 0) {
        setReviewState({ phase: "done" });
        return;
      }
      setSessionKey((k) => k + 1);
      setReviewState({ phase: "session", steps: plan.steps, stepIndex: 0 });
    } catch {
      setReviewState({ phase: "error" });
    }
  }, [user]);

  const handleStepComplete = useCallback(() => {
    setReviewState((prev) => {
      if (prev.phase !== "session") return prev;
      const next = prev.stepIndex + 1;
      if (next >= prev.steps.length) return { phase: "done" };
      return { phase: "session", steps: prev.steps, stepIndex: next };
    });
  }, []);

  const handleExit = useCallback(() => setReviewState({ phase: "idle" }), []);

  if (reviewState.phase === "session") {
    const step = reviewState.steps[reviewState.stepIndex];
    return (
      <div className="fixed inset-0 z-50 bg-[var(--surface-base)]">
        <PracticeSession
          key={`${sessionKey}-${reviewState.stepIndex}`}
          context="daily"
          exercises={step.exercises}
          sessionLength={step.exercises.length}
          sessionLabel={step.title}
          onSessionComplete={handleStepComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  const nothingDue = totalDue === 0;

  return (
    <section>
      <HomeSectionHeader number="02" title="Due for review" />
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex snap-x snap-mandatory gap-3 pb-3">
          {nothingDue ? (
            <div className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                <Check size={18} />
              </span>
              <p className="font-body-sm font-medium text-[var(--text-primary)]">All caught up</p>
              <p className="font-caption text-[var(--text-tertiary)]">Come back tomorrow</p>
            </div>
          ) : (
            <>
              {words.map((w) => (
                <div
                  key={w.id}
                  className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4"
                >
                  <div>
                    <p className="font-display text-xl font-semibold leading-tight text-[var(--text-primary)]">
                      {w.text}
                    </p>
                    {w.ipa ? (
                      <p className="font-ipa mt-0.5 text-sm text-[var(--primary)]">{formatIpa(w.ipa)}</p>
                    ) : null}
                  </div>
                  <WordStrengthBars strength={getWordStrength(w)} size={14} />
                </div>
              ))}
              {soundsDue.map((s) => (
                <div
                  key={s.soundId}
                  className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4"
                >
                  <div>
                    <p className="font-ipa text-3xl font-bold leading-none text-[var(--primary)]">
                      {formatIpa(s.ipa)}
                    </p>
                    {s.example ? (
                      <p className="font-body-sm mt-1 text-[var(--text-secondary)]">{s.example}</p>
                    ) : null}
                  </div>
                  <p className="font-caption text-[var(--text-tertiary)]">
                    {s.accuracy}% · {s.daysOverdue > 0 ? `${s.daysOverdue}d overdue` : "due today"}
                  </p>
                </div>
              ))}
              <div className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 text-center">
                <p className="type-stat text-2xl">{totalDue}</p>
                <p className="font-body-sm text-[var(--text-secondary)]">
                  {totalDue === 1 ? "item" : "items"} due
                </p>
                {reviewState.phase === "done" ? (
                  <p className="font-body-sm text-[var(--success)]">Review complete!</p>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    icon={reviewState.phase === "loading" ? undefined : <ArrowRight size={14} />}
                    iconPosition="right"
                    disabled={reviewState.phase === "loading"}
                    onClick={handleStartReview}
                  >
                    {reviewState.phase === "loading" ? "Preparing…" : "Start review"}
                  </Button>
                )}
                {reviewState.phase === "error" ? (
                  <p className="font-caption text-[var(--error)]">Couldn&apos;t load. Tap to retry.</p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeReviewCarousel.tsx
git commit -m "feat(home): add HomeReviewCarousel for mobile review queue"
```

---

## Task 3: `HomeMobileView`

**Files:**
- Create: `components/home/HomeMobileView.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/home/HomeMobileView.tsx

// Planned structure:
// <HomeMobileView>
//   <HomeHeaderGreeting />
//   <HomeQuickActionsGrid />
//   <HomeDailyCard />
//   <HomeStreakCard />
//   <HomeReviewCarousel />
// </HomeMobileView>

import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeQuickActionsGrid from "@/components/home/HomeQuickActionsGrid";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import HomeReviewCarousel from "@/components/home/HomeReviewCarousel";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";
import type { ConceptLesson } from "@/hooks/useDailyPlan";

interface HomeMobileViewProps {
  userName: string;
  dateLabel: string;
  streak?: DailyStreakResult;
  conceptLesson?: ConceptLesson | null;
  words?: WordBankEntry[];
  dueCount?: number;
  soundsDue?: SoundDueHome[];
}

export default function HomeMobileView({
  userName,
  dateLabel,
  streak,
  conceptLesson = null,
  words,
  dueCount,
  soundsDue,
}: HomeMobileViewProps) {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-24">
      <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />
      <HomeQuickActionsGrid />
      <HomeDailyCard conceptLesson={conceptLesson} />
      <HomeStreakCard streak={streak} />
      <HomeReviewCarousel words={words} dueCount={dueCount} soundsDue={soundsDue} />
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeMobileView.tsx
git commit -m "feat(home): add HomeMobileView shell for mobile layout"
```

---

## Task 4: Wire `HomeMobileView` into `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

The page needs to compute `userName` and `dateLabel` server-side (currently done in `HomeStatusHero` client-side via `useUserPreferences`). For the mobile view we pass them directly from server data already available.

- [ ] **Step 1: Add `HomeMobileView` import and conditional blocks**

In `app/page.tsx`, add the import and modify the return JSX:

```tsx
// Add to imports at top of app/page.tsx:
import HomeMobileView from "@/components/home/HomeMobileView";
```

Replace the `return` block with:

```tsx
return (
  <PageLayout className="max-w-[1080px] mx-auto">
    {/* Mobile view */}
    <div className="md:hidden">
      <HomeMobileView
        userName="there"
        dateLabel={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        streak={dailyStreak}
        conceptLesson={
          todaysLesson
            ? { slug: todaysLesson.slug, title: todaysLesson.title, subtitle: todaysLesson.subtitle }
            : null
        }
        words={dueWords}
        dueCount={dueCount}
        soundsDue={soundsDue}
      />
    </div>

    {/* Desktop/tablet view — unchanged */}
    <div className="hidden md:block">
      <HomeStatusHero />
      <HomeTodaySection
        streak={dailyStreak}
        conceptLesson={
          todaysLesson
            ? { slug: todaysLesson.slug, title: todaysLesson.title, subtitle: todaysLesson.subtitle }
            : null
        }
      />
      <HomeReviewsSection
        words={dueWords}
        dueCount={dueCount}
        soundsDue={soundsDue}
        lexicon={lexiconRetention}
        weakestPhoneme={weakestPhoneme}
      />
      <HomeLearnSection lesson={todaysLesson} concept={todaysConcept} />
    </div>
  </PageLayout>
);
```

> Note: `userName` is passed as `"there"` (fallback) because `useUserPreferences` is client-side. `HomeHeaderGreeting` in `HomeMobileView` will show "Good morning, there" until we optionally improve this later. The desktop `HomeStatusHero` still resolves the real name client-side as before.

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): wire HomeMobileView into page with responsive split"
```

---

## Task 5: BottomNavTab visual polish

**Files:**
- Modify: `components/layout/BottomNavTab.tsx`

Currently the active tab shows `bg-[var(--primary-soft)]` background + colored text. New design: pill indicator above icon, label visible only when active, no background fill.

- [ ] **Step 1: Rewrite the tab styles**

Replace the full content of `components/layout/BottomNavTab.tsx` with:

```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BottomNavTabProps {
  name: string;
  icon: ReactNode;
  active: boolean;
  href?: string;
  onClick?: () => void;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

const tabClass = (active: boolean) =>
  cn(
    "relative flex min-h-11 min-w-[3.25rem] flex-col items-center justify-end gap-0.5 rounded-[var(--radius-sm)] px-2 pb-1 pt-2",
    "transition-colors duration-[var(--transition-fast)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
    active ? "text-[var(--primary)]" : "text-[var(--text-tertiary)] hover:text-fg",
  );

export default function BottomNavTab({
  name,
  icon,
  active,
  href,
  onClick,
  ariaExpanded,
  ariaControls,
}: BottomNavTabProps) {
  const content = (
    <>
      {/* Pill indicator — visible only when active */}
      <span
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[var(--primary)] transition-all duration-[var(--transition-fast)]",
          active ? "w-5 opacity-100" : "w-0 opacity-0",
        )}
        aria-hidden
      />
      <span className="flex h-5 w-5 items-center justify-center" aria-hidden>
        {icon}
      </span>
      {/* Label — visible only when active */}
      <span
        className={cn(
          "text-[0.6875rem] font-medium leading-tight transition-all duration-[var(--transition-fast)]",
          active ? "max-h-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        {name}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={tabClass(active)}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaControls ? "dialog" : undefined}
    >
      {content}
    </button>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/BottomNavTab.tsx
git commit -m "feat(nav): redesign BottomNavTab with pill indicator and active-only label"
```

---

## Task 6: BottomNav backdrop-blur polish

**Files:**
- Modify: `components/layout/BottomNav.tsx`

- [ ] **Step 1: Update nav background and padding**

In `components/layout/BottomNav.tsx`, find the `<nav>` element className and update:

Current:
```tsx
"fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 items-end border-t border-[var(--line-divider)] bg-[var(--card-bg)] px-1 pt-2",
```

Replace with:
```tsx
"fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 items-end border-t border-[var(--line-divider)] bg-[var(--card-bg)]/90 backdrop-blur-md px-1 pt-3",
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/BottomNav.tsx
git commit -m "feat(nav): add backdrop-blur and tighten padding on BottomNav"
```

---

## Self-Review Checklist

- [x] `HomeQuickActionsGrid` — static, no props, 6 items, all hrefs specified ✓
- [x] `HomeReviewCarousel` — same `buildReviewPlan` + `PracticeSession` flow as `HomeReviewQueueCard` ✓
- [x] `HomeMobileView` — all props typed, receives data from `HomePage` without new queries ✓
- [x] `app/page.tsx` — desktop sections wrapped in `hidden md:block`, mobile in `md:hidden` ✓
- [x] `BottomNavTab` — pill indicator, active-only label, no background fill ✓
- [x] `BottomNav` — backdrop-blur + pt-3 ✓
- [x] `AICoachTrigger nav variant` already has `boxShadow` glow — no change needed ✓
- [x] No placeholder text, all code is complete ✓
- [x] Type names consistent across tasks (`ConceptLesson`, `DailyStreakResult`, `SoundDueHome`, `WordBankEntry`) ✓
