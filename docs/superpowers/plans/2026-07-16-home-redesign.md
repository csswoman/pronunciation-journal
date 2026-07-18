# Home Redesign — Notebook Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild authenticated home as a Notebook Command Center (utility bar → review banner → plan | progress split) and raise the global typography floor so UI text is readable and Fraunces is gone from home chrome.

**Architecture:** Approach B — recompose with existing cards and existing `page.tsx` props. New shell components (`HomeUtilityBar`, `HomeReviewBanner`, `HomeCommandGrid`, `HomeLearnRow`, `WeakSoundCard`) replace numbered Today/Reviews/Learn sections. Phase 0 bumps type tokens globally; Phase 1 migrates home only. No new queries.

**Tech Stack:** Next.js App Router, React 19, Tailwind v4, CSS tokens (`tokens.css` / `theme.css`), Vitest + Testing Library, Dexie live queries (existing cards).

**Spec:** `docs/superpowers/specs/2026-07-16-home-redesign-design.md`

**Note on WIP:** Working tree may contain uncommitted “visual hardening” edits under `components/home/*`. This redesign **supersedes** that polish-only work. Prefer implementing against the approved redesign; discard or overwrite conflicting hardening-only layout CSS (large `.home-intro` hero) as needed.

---

## File Map

| File | Responsibility |
| --- | --- |
| `app/styles/tokens.css` | Raise `--font-caption` to 13px; add `--font-body-md`, `--font-kicker`; deprecate tiny for new UI |
| `app/styles/theme.css` | Align `--text-caption`, add `--text-body-md` / kicker size tokens |
| `app/styles/utilities.css` | `.font-kicker`, `.font-body-md`, home shell (`.home-command-*`); retire hero intro sizing |
| `DESIGN.md` | Document Notebook Utility type rules + floors |
| `components/home/HomeReviewBanner.tsx` | **Create** — compact due banner |
| `components/home/HomeUtilityBar.tsx` | **Create** — discreet greeting + streak + CTA |
| `components/home/HomeLearnRow.tsx` | **Create** — mini-lesson + concept under plan |
| `components/home/WeakSoundCard.tsx` | **Create** — phoneme-only card (from ReviewProgressCard) |
| `components/home/HomeCommandGrid.tsx` | **Create** — desktop split layout |
| `components/home/HomeLayout.tsx` | Wire new shell; stop rendering old sections |
| `components/home/HomeMobileView.tsx` | Reordered stack + Quick Access retained |
| `components/home/HomeDailyCard.tsx` | Restyle primary surface + type |
| `components/home/Core1000ProgressCard.tsx` | `CORE` kicker + type floors |
| `components/home/HomeWordOfDayCard.tsx` | `WORD` kicker; no Fraunces on word chrome |
| `components/home/HomeAiPracticeCard.tsx` | `AI` kicker + type floors |
| `components/home/__tests__/HomeReviewBanner.test.tsx` | **Create** — visibility tests |
| `components/home/__tests__/WeakSoundCard.test.tsx` | **Create** — empty + data states |
| `components/home/__tests__/ReviewProgressCard.test.tsx` | Keep if ReviewProgressCard still used elsewhere; otherwise migrate asserts to WeakSoundCard |

**Leave unused but do not delete in this PR** (safer rollback): `HomeStatusHero.tsx`, `HomeTodaySection.tsx`, `HomeReviewsSection.tsx`, `HomeLearnSection.tsx`, `HomeSectionHeader.tsx`, `HomeStreakCard.tsx` — stop importing them from `HomeLayout` / mobile. Optional follow-up PR to delete.

**Do not modify:** palette/`--hue` generation, `page.tsx` fetch surface (only prop wiring if needed), BottomNav, `course-path.css`.

---

### Task 1: Phase 0 — Typography tokens

**Files:**
- Modify: `app/styles/tokens.css`
- Modify: `app/styles/theme.css`
- Modify: `app/styles/utilities.css`
- Modify: `DESIGN.md`

- [ ] **Step 1: Update composite fonts in `tokens.css`**

In the typography scale section (~lines 178–194), replace caption/tiny and add body-md + kicker:

```css
  /* ── 12. Typography scale ────────────────────────────────────────────── */
  /* UI/body: DM Sans. Kickers/metadata: DM Mono. Fraunces = content-only (not chrome). */
  --font-ui:      var(--font-sans);
  --font-heading: var(--font-sans);
  --font-ipa:     var(--font-sans);
  --font-phoneme: var(--font-editorial);

  --font-display: var(--font-editorial), serif;
  --font-h1:      700 clamp(1.875rem, 4vw, 2.625rem) / 1.2 var(--font-sans), sans-serif;
  --font-h2:      700 clamp(1.5rem, 3vw, 2rem) / 1.3 var(--font-sans), sans-serif;
  --font-h3:      600 clamp(1.25rem, 2.5vw, 1.5rem) / 1.4 var(--font-sans), sans-serif;
  --font-h4:      600 1.125rem / 1.4 var(--font-sans), sans-serif;
  --font-body:    400 1rem / 1.6 var(--font-sans), sans-serif;
  --font-body-md: 400 0.9375rem / 1.55 var(--font-sans), sans-serif; /* 15px */
  --font-body-sm: 400 0.875rem / 1.5 var(--font-sans), sans-serif;   /* 14px lists */
  --font-caption: 400 0.8125rem / 1.45 var(--font-sans), sans-serif; /* 13px UI floor */
  --font-label:   500 0.8125rem / 1.4 var(--font-sans), sans-serif;
  --font-kicker:  500 0.75rem / 1.4 var(--font-mono-var), "Fira Code", monospace; /* 12px mono */
  --font-tiny:    500 0.75rem / 1.4 var(--font-sans), sans-serif; /* raised to 12px; prefer caption/kicker */
  --font-mono:    400 0.875rem / 1.6 var(--font-mono-var), "Fira Code", monospace;
```

- [ ] **Step 2: Align Tailwind theme sizes in `theme.css`**

Update the typography block (~128–165):

```css
  --text-h4: 1.125rem;
  --text-h4--line-height: 1.4;
  --text-h4--font-weight: 600;

  --text-body-lg: 1.125rem;
  --text-body-lg--line-height: 1.6;

  --text-body-md: 0.9375rem;
  --text-body-md--line-height: 1.55;

  --text-body-sm: 0.875rem;
  --text-body-sm--line-height: 1.5;

  --text-label: 0.8125rem;
  --text-label--line-height: 1.4;
  --text-label--font-weight: 500;

  --text-caption: 0.8125rem;
  --text-caption--line-height: 1.45;

  --text-kicker: 0.75rem;
  --text-kicker--line-height: 1.4;
  --text-kicker--font-weight: 500;
  --text-kicker--letter-spacing: 0.08em;

  /* Keep xxs/tiny for legacy CSS outside home; do not use in new home UI */
  --text-xxs: 0.75rem;
  --text-tiny: 0.75rem;
```

- [ ] **Step 3: Add utilities**

In `app/styles/utilities.css` typography helpers section, add:

```css
.font-body-md { font: var(--font-body-md); }
.font-kicker {
  font: var(--font-kicker);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/** Prefer .font-kicker over .type-overline for new UI */
.type-overline {
  font: var(--font-kicker);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.type-stat {
  font-family: var(--font-sans), sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}
```

- [ ] **Step 4: Document in `DESIGN.md`**

Update the `typography:` block caption to `0.8125rem`, add `body-md` and `kicker`, and add a short note under typography:

```yaml
  body-md:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  kicker:
    fontFamily: "DM Mono, Fira Code, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
```

Add prose note: UI minimum 12px; preferred label/caption 13px; no Fraunces on app chrome (home first).

- [ ] **Step 5: Commit**

```bash
git add app/styles/tokens.css app/styles/theme.css app/styles/utilities.css DESIGN.md
git commit -m "feat(type): raise caption floor and add body-md/kicker tokens"
```

---

### Task 2: `HomeReviewBanner` (TDD)

**Files:**
- Create: `components/home/__tests__/HomeReviewBanner.test.tsx`
- Create: `components/home/HomeReviewBanner.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";

describe("HomeReviewBanner", () => {
  it("renders nothing when there are no due items", () => {
    const { container } = render(
      <HomeReviewBanner wordsDueCount={0} soundsDueCount={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows total due and breakdown when items exist", () => {
    render(<HomeReviewBanner wordsDueCount={8} soundsDueCount={4} />);
    expect(screen.getByText(/12 due/i)).toBeInTheDocument();
    expect(screen.getByText(/8 words/i)).toBeInTheDocument();
    expect(screen.getByText(/4 sounds/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review now/i })).toHaveAttribute(
      "href",
      "/words?tab=review",
    );
  });

  it("omits zero sources from the breakdown", () => {
    render(<HomeReviewBanner wordsDueCount={5} soundsDueCount={0} />);
    expect(screen.getByText(/5 due/i)).toBeInTheDocument();
    expect(screen.getByText(/5 words/i)).toBeInTheDocument();
    expect(screen.queryByText(/sound/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `pnpm exec vitest run components/home/__tests__/HomeReviewBanner.test.tsx`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement `HomeReviewBanner.tsx`**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HomeReviewBannerProps {
  wordsDueCount?: number;
  soundsDueCount?: number;
}

export default function HomeReviewBanner({
  wordsDueCount = 0,
  soundsDueCount = 0,
}: HomeReviewBannerProps) {
  const total = wordsDueCount + soundsDueCount;
  if (total <= 0) return null;

  const parts = [
    wordsDueCount > 0 && `${wordsDueCount} word${wordsDueCount === 1 ? "" : "s"}`,
    soundsDueCount > 0 && `${soundsDueCount} sound${soundsDueCount === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <Link
      href="/words?tab=review"
      className="home-card-lift focus-ring flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-sunken px-4 py-3 transition-transform active:scale-[0.96]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-kicker">Review</span>
        <p className="font-label tabular-nums font-semibold text-fg">
          {total} due
          {parts.length > 0 ? (
            <span className="font-caption font-normal text-fg-muted">
              {" "}
              · {parts.join(" · ")}
            </span>
          ) : null}
        </p>
      </div>
      <span className="font-label inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
        Review now
        <ArrowRight size={14} aria-hidden />
      </span>
    </Link>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm exec vitest run components/home/__tests__/HomeReviewBanner.test.tsx`

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeReviewBanner.tsx components/home/__tests__/HomeReviewBanner.test.tsx
git commit -m "feat(home): add HomeReviewBanner with due visibility tests"
```

---

### Task 3: `HomeUtilityBar`

**Files:**
- Create: `components/home/HomeUtilityBar.tsx`
- Reuse: `components/home/HomeHeaderActions.tsx`

- [ ] **Step 1: Implement utility bar**

```tsx
"use client";

// Planned structure:
// <HomeUtilityBar>
//   mono metadata (date · greeting · name · streak)
//   <HomeHeaderActions />
// </HomeUtilityBar>

import { Flame } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import type { DailyStreakResult } from "@/lib/daily/streak-core";

interface HomeUtilityBarProps {
  streak?: DailyStreakResult;
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default function HomeUtilityBar({ streak }: HomeUtilityBarProps) {
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = isLoggedIn ? fullName.split(" ")[0] : "Guest";
  const hasStartedLearning = progressList.length > 0;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeOfDay = getTimeOfDay();
  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  return (
    <header className="home-utility-bar flex items-center justify-between gap-4 border-b border-border-subtle py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <p className="font-mono text-caption tabular-nums text-fg-muted">
          {dateLabel} · {timeOfDay} · {userName.toLowerCase()}
        </p>
        {current > 0 && (
          <span
            className="inline-flex items-center gap-1 font-caption tabular-nums text-fg"
            title={completedToday ? "Streak complete today" : "Keep your streak alive"}
          >
            <Flame
              size={14}
              className={completedToday ? "text-success" : "text-primary"}
              aria-hidden
            />
            {current}
          </span>
        )}
      </div>
      <div className="shrink-0">
        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Shrink CTA button if needed**

In `HomeHeaderActions.tsx`, keep `size="md"` or change to `size="sm"` if the bar feels tall. Prefer `size="sm"` for the discreet bar:

```tsx
    <Button
      variant="primary"
      size="sm"
      icon={<Play size={14} className="fill-current" />}
      onClick={() => router.push("/courses")}
    >
```

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeUtilityBar.tsx components/home/HomeHeaderActions.tsx
git commit -m "feat(home): add discreet HomeUtilityBar greeting"
```

---

### Task 4: `HomeLearnRow`

**Files:**
- Create: `components/home/HomeLearnRow.tsx`

- [ ] **Step 1: Implement learn row**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

interface HomeLearnRowProps {
  lesson: MiniLesson | null;
  concept: LanguageConcept | null;
}

function LearnChip({
  kicker,
  title,
  href,
  description,
}: {
  kicker: string;
  title: string;
  href: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="home-card-lift focus-ring flex min-h-11 flex-col gap-1 rounded-xl border border-border-subtle bg-surface-raised p-3 transition-transform active:scale-[0.96]"
    >
      <span className="font-kicker">{kicker}</span>
      <span className="font-label font-semibold text-balance text-fg">{title}</span>
      {description ? (
        <span className="font-caption text-pretty text-fg-muted line-clamp-2">{description}</span>
      ) : null}
      <span className="mt-auto inline-flex items-center gap-1 font-caption font-medium text-primary">
        Open <ArrowRight size={12} aria-hidden />
      </span>
    </Link>
  );
}

export default function HomeLearnRow({ lesson, concept }: HomeLearnRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {lesson ? (
        <LearnChip
          kicker="Mini lesson"
          title={lesson.title}
          href={lesson.href || `/mini-lessons/${lesson.slug}`}
          description={lesson.subtitle}
        />
      ) : (
        <LearnChip
          kicker="Mini lesson"
          title="Daily grammar bite"
          href="/mini-lessons"
          description="Short lessons on patterns you use every day."
        />
      )}
      {concept ? (
        <LearnChip
          kicker={concept.badge}
          title={concept.title}
          href={concept.href}
          description={concept.description}
        />
      ) : (
        <LearnChip
          kicker="Concept"
          title="Irregular verbs"
          href="/words?tab=decks"
          description="Study deck: base · past · participle."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/HomeLearnRow.tsx
git commit -m "feat(home): add HomeLearnRow under daily plan"
```

---

### Task 5: `WeakSoundCard` (TDD)

**Files:**
- Create: `components/home/__tests__/WeakSoundCard.test.tsx`
- Create: `components/home/WeakSoundCard.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WeakSoundCard from "@/components/home/WeakSoundCard";

describe("WeakSoundCard", () => {
  it("shows CTA when there is no phoneme data", () => {
    render(<WeakSoundCard weakestPhoneme={null} />);
    expect(screen.queryByText("/ð/")).not.toBeInTheDocument();
    expect(screen.getByText(/find your weakest sound/i)).toBeInTheDocument();
  });

  it("renders IPA and accuracy when data is present", () => {
    render(
      <WeakSoundCard
        weakestPhoneme={{
          ipa: "ð",
          accuracy: 40,
          totalAttempts: 12,
          label: "voiced dental fricative",
        }}
      />,
    );
    expect(screen.getByText("/ð/")).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/practice/sounds");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm exec vitest run components/home/__tests__/WeakSoundCard.test.tsx`

- [ ] **Step 3: Implement**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { WeakestPhonemeHome } from "@/lib/home/constants";

interface WeakSoundCardProps {
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

export default function WeakSoundCard({ weakestPhoneme = null }: WeakSoundCardProps) {
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  return (
    <div className="home-sidebar-card flex flex-col gap-2">
      <span className="font-kicker">Sound</span>
      {hasPhoneme ? (
        <Link
          href="/practice/sounds"
          className="focus-ring group flex items-center gap-3 rounded-lg transition-transform active:scale-[0.96]"
        >
          <span className="font-mono shrink-0 text-display-ipa font-bold leading-none text-warning">
            {formatIpaDisplay(weakestPhoneme!.ipa)}
          </span>
          <div className="min-w-0 flex-1">
            {weakestPhoneme!.label ? (
              <p className="font-caption text-fg-muted line-clamp-1">{weakestPhoneme!.label}</p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ProgressBar value={weakestPhoneme!.accuracy} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-warning-value">
                {weakestPhoneme!.accuracy}%
              </span>
            </div>
            <p className="font-caption mt-1.5 inline-flex items-center gap-1 text-primary group-hover:underline">
              Practice this sound <ArrowRight size={12} aria-hidden />
            </p>
          </div>
        </Link>
      ) : (
        <Link
          href="/practice/sounds"
          className="focus-ring inline-flex items-center gap-1.5 font-body-md text-primary hover:underline"
        >
          Find your weakest sound <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm exec vitest run components/home/__tests__/WeakSoundCard.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add components/home/WeakSoundCard.tsx components/home/__tests__/WeakSoundCard.test.tsx
git commit -m "feat(home): add WeakSoundCard for progress stack"
```

---

### Task 6: `HomeCommandGrid` + rewire `HomeLayout`

**Files:**
- Create: `components/home/HomeCommandGrid.tsx`
- Modify: `components/home/HomeLayout.tsx`
- Modify: `app/styles/utilities.css` (shell classes)

- [ ] **Step 1: Add shell CSS**

Replace oversized `.home-intro*` hero rules with compact command-center utilities (keep `.home-layout-shell` / mask if useful; remove large clamp title):

```css
.home-layout-shell {
  position: relative;
  width: 100%;
  max-width: 90rem;
  margin-inline: auto;
  isolation: isolate;
}

.home-layout-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.home-command-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
}

@media (min-width: 768px) {
  .home-command-grid {
    grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.9fr);
    align-items: start;
  }
}

.home-command-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-command-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
```

Remove or neutralize `.home-intro-title` clamp to `4.5rem` so leftover imports cannot resurrect the hero (optional: delete unused `.home-intro*` block entirely in this step).

- [ ] **Step 2: Implement `HomeCommandGrid.tsx`**

```tsx
import type { ReactNode } from "react";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeLearnRow from "@/components/home/HomeLearnRow";
import Core1000ProgressCard from "@/components/home/Core1000ProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeAiPracticeCard from "@/components/home/HomeAiPracticeCard";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

interface HomeCommandGridProps {
  conceptLesson: ConceptLesson | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  todaysLesson: MiniLesson | null;
  todaysConcept: LanguageConcept | null;
  /** Optional override for left column top (tests / composition). */
  dailyCard?: ReactNode;
}

export default function HomeCommandGrid({
  conceptLesson,
  weakestPhoneme = null,
  todaysLesson,
  todaysConcept,
  dailyCard,
}: HomeCommandGridProps) {
  return (
    <div className="home-command-grid">
      <div className="home-command-main">
        {dailyCard ?? <HomeDailyCard conceptLesson={conceptLesson} />}
        <HomeLearnRow lesson={todaysLesson} concept={todaysConcept} />
      </div>
      <aside className="home-command-aside">
        <Core1000ProgressCard />
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        <HomeWordOfDayCard />
        <HomeAiPracticeCard />
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `HomeLayout.tsx`**

```tsx
// Planned structure:
// <HomeLayout>
//   mobile: <HomeMobileView />
//   desktop: <HomeUtilityBar /> + <HomeReviewBanner /> + <HomeCommandGrid />
// </HomeLayout>

import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeMobileView from "@/components/home/HomeMobileView";
import HomeUtilityBar from "@/components/home/HomeUtilityBar";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

interface HomeLayoutProps {
  streak?: DailyStreakResult;
  wordsDueCount?: number;
  soundsDueCount?: number;
  conceptLesson?: ConceptLesson | null;
  dailyGoal?: DailyGoalProgress | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  reviewQueue?: ReviewQueueSummary;
  vocabularyProgress?: VocabularyProgressSeed | null;
  todaysLesson?: MiniLesson | null;
  todaysConcept?: LanguageConcept | null;
}

export default function HomeLayout({
  streak,
  wordsDueCount = 0,
  soundsDueCount = 0,
  conceptLesson = null,
  dailyGoal = null,
  weakestPhoneme = null,
  reviewQueue = { total: 0, newAvailable: 0, sources: [], preview: [] },
  vocabularyProgress = null,
  todaysLesson = null,
  todaysConcept = null,
}: HomeLayoutProps) {
  void dailyGoal;
  void reviewQueue;
  void vocabularyProgress;

  return (
    <div className="home-layout home-layout-shell">
      <div className="md:hidden">
        <HomeMobileView
          streak={streak}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
          weakestPhoneme={weakestPhoneme}
          dailyCard={<HomeDailyCard conceptLesson={conceptLesson} />}
        />
      </div>

      <div className="home-layout-sections hidden md:flex">
        <HomeUtilityBar streak={streak} />
        <HomeReviewBanner wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />
        <HomeCommandGrid
          conceptLesson={conceptLesson}
          weakestPhoneme={weakestPhoneme}
          todaysLesson={todaysLesson}
          todaysConcept={todaysConcept}
        />
      </div>
    </div>
  );
}
```

(If ESLint complains about unused props, remove them from the interface only after confirming `page.tsx` can keep passing them for future use — or prefix with underscore destructure. Prefer keeping props for API stability with `page.tsx`.)

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`

Expected: PASS (or only pre-existing errors unrelated to home)

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeCommandGrid.tsx components/home/HomeLayout.tsx app/styles/utilities.css
git commit -m "feat(home): wire Notebook Command Center desktop shell"
```

---

### Task 7: Restyle progress cards (kickers + no Fraunces)

**Files:**
- Modify: `components/home/Core1000ProgressCard.tsx`
- Modify: `components/home/HomeWordOfDayCard.tsx`
- Modify: `components/home/HomeAiPracticeCard.tsx`
- Modify: `components/home/HomeDailyCard.tsx`

- [ ] **Step 1: Core1000 — `CORE` kicker**

Replace the caption overline with:

```tsx
      <div className="flex items-baseline justify-between">
        <span className="font-kicker">Core</span>
        <span className="font-caption tabular-nums text-fg-muted">
          <span className="font-semibold text-fg">{learned}</span> / {CORE_1000_TARGET}
        </span>
      </div>
```

Also: when `learned === 0`, still render a quiet empty CTA instead of `return null` (optional but preferred so the right stack isn’t gappy):

```tsx
  if (learned === 0) {
    return (
      <Link
        href="/practice/core-1000"
        className="home-card-lift focus-ring flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-transform active:scale-[0.96]"
      >
        <span className="font-kicker">Core</span>
        <span className="font-label font-semibold text-fg">Essential words</span>
        <span className="font-caption text-fg-muted">Start the Core 1000 deck →</span>
      </Link>
    );
  }
```

- [ ] **Step 2: Word of Day — remove `font-display` on the word**

Find the word title class (currently `font-display text-display-word`) and change to:

```tsx
<p className="font-mono text-display-word font-semibold leading-none text-fg">
```

Add kicker at top of the card:

```tsx
<span className="font-kicker">Word</span>
```

- [ ] **Step 3: AI card**

```tsx
export default function HomeAiPracticeCard() {
  return (
    <div className="home-sidebar-card flex flex-col gap-3">
      <span className="font-kicker">AI</span>
      <div className="flex items-center gap-2">
        <span className="icon-wrap-hue flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Zap size={18} />
        </span>
        <span className="font-label font-semibold text-fg">Practice</span>
      </div>
      <p className="font-caption text-pretty leading-relaxed text-fg-muted">
        Jump into a sounds session or explore practice topics.
      </p>
      {/* buttons unchanged */}
    </div>
  );
}
```

- [ ] **Step 4: Daily card — primary surface + readable step copy**

Ensure outer card keeps `shadow-sm` + `rounded-xl` + `border-border-subtle`. Replace any `font-tiny` / `text-[11px]` inside with `font-kicker` or `font-caption`. Step titles should use at least `font-body-md` or `font-label font-semibold`.

- [ ] **Step 5: Grep home for Fraunces / tiny**

Run: `rg "font-editorial|font-display|font-tiny|text-\[|text-xxs" components/home`

Expected: no matches in chrome paths (IPA/word may use `font-mono` / `text-display-*` sizes, not Fraunces).

- [ ] **Step 6: Commit**

```bash
git add components/home/Core1000ProgressCard.tsx components/home/HomeWordOfDayCard.tsx components/home/HomeAiPracticeCard.tsx components/home/HomeDailyCard.tsx
git commit -m "style(home): apply Notebook Utility type to progress cards"
```

---

### Task 8: Restructure `HomeMobileView`

**Files:**
- Modify: `components/home/HomeMobileView.tsx`

- [ ] **Step 1: Update props + stack order**

New order:

1. Utility-style greeting (inline mono line OR import `HomeUtilityBar` without desktop CTA size conflict — prefer a slim inline bar to avoid double Continue buttons; mobile keeps Quick Access for Continue course)
2. `HomeReviewBanner`
3. `dailyCard`
4. Progress row: `Core1000ProgressCard` + `WeakSoundCard` in `grid grid-cols-2 gap-2`
5. Quick Access (keep PrimaryActionTile + SecondaryActionTile as today)

Skeleton:

```tsx
export default function HomeMobileView({
  streak,
  wordsDueCount = 0,
  soundsDueCount = 0,
  weakestPhoneme = null,
  dailyCard,
}: HomeMobileViewProps) {
  // resolve userName as today…
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <p className="font-mono text-caption text-fg-muted">
          {dateLabel} · {userName.toLowerCase()}
        </p>
        {(streak?.currentStreak ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 font-caption tabular-nums">
            <Flame size={14} className={streak?.completedToday ? "text-success" : "text-primary"} />
            {streak!.currentStreak}
          </span>
        )}
      </div>

      <HomeReviewBanner wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />

      {dailyCard}

      <div className="grid grid-cols-2 gap-2">
        <Core1000ProgressCard />
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
      </div>

      <section>
        <p className="font-kicker mb-3">Quick access</p>
        {/* existing PrimaryActionTile + SecondaryActionTile grid unchanged */}
      </section>
    </div>
  );
}
```

Remove the old mid-page review `Link` banner (replaced by `HomeReviewBanner`). Remove duplicate streak pill if already in the top bar.

- [ ] **Step 2: Pass `weakestPhoneme` from `HomeLayout`** (already in Task 6)

- [ ] **Step 3: Manual sanity** — Quick Access still 2+4; labels use `font-caption` not tiny

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeMobileView.tsx components/home/HomeLayout.tsx
git commit -m "feat(home): restructure mobile stack; keep Quick Access"
```

---

### Task 9: Update / retire old ReviewProgressCard tests

**Files:**
- Modify or leave: `components/home/__tests__/ReviewProgressCard.test.tsx`
- Optionally modify: `components/home/ReviewProgressCard.tsx` (unused on home)

- [ ] **Step 1: Decide**

If `ReviewProgressCard` is no longer imported anywhere:

```bash
rg "ReviewProgressCard" components app
```

- If only tests remain: update tests file comment that WeakSoundCard owns the phoneme assertions, and keep ReviewProgressCard tests passing OR delete the component in a follow-up. For this PR, **keep the file** and leave tests green without wiring it into home.
- If still imported elsewhere: leave as-is.

- [ ] **Step 2: Run home tests**

Run: `pnpm exec vitest run components/home`

Expected: all PASS

- [ ] **Step 3: Commit only if files changed**

```bash
git add components/home/__tests__/ReviewProgressCard.test.tsx
git commit -m "test(home): align review progress tests with WeakSoundCard split"
```

---

### Task 10: Verification + final commit

- [ ] **Step 1: Type-check**

Run: `pnpm type-check`  
Expected: PASS

- [ ] **Step 2: Lint home**

Run: `pnpm lint`  
Expected: no new errors in `components/home`

- [ ] **Step 3: Spec done-criteria checklist**

- [ ] Desktop: no `HomeSectionHeader` / 01-02-03
- [ ] Utility bar one line; no Fraunces greeting
- [ ] Review banner only when due > 0
- [ ] Learn under plan via `HomeLearnRow`
- [ ] Right stack: Core, Sound, Word, AI
- [ ] Mobile Quick Access retained
- [ ] Caption ≥ 13px tokens; home UI ≥ 12px
- [ ] `--hue` unchanged
- [ ] No new queries

- [ ] **Step 4: Grep guards**

```bash
rg "font-editorial|font-display" components/home
rg "HomeTodaySection|HomeReviewsSection|HomeLearnSection|HomeStatusHero" components/home/HomeLayout.tsx
```

Expected: no editorial/display in chrome; HomeLayout does not import old sections.

- [ ] **Step 5: Final docs touch if needed**

If implementation drifted, update `docs/superpowers/specs/2026-07-16-home-redesign-design.md` status line only — avoid rewriting the whole spec.

- [ ] **Step 6: Commit any leftover polish**

```bash
git add -A components/home app/styles DESIGN.md
git commit -m "chore(home): finish Notebook Command Center verification"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
| --- | --- |
| Global type tokens + DESIGN.md | Task 1 |
| HomeReviewBanner hide when due=0 | Task 2 |
| HomeUtilityBar discreet greeting | Task 3 |
| Learn under plan | Task 4 |
| Weak sound in right stack | Task 5 |
| Desktop Command Center shell | Task 6 |
| Card kickers / no Fraunces chrome | Task 7 |
| Mobile reorder + Quick Access A | Task 8 |
| Tests | Tasks 2, 5, 9, 10 |
| No new queries / hue unchanged | All tasks (constraint) |

**Deferred (explicit, not missing):** app-wide Fraunces removal, course-path.css, deleting unused home section files, ESLint ban on `text-[Npx]`.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-16-home-redesign.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
