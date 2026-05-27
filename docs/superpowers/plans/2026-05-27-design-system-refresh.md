# Design System Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a coherent minimal/technical visual direction — DM Sans + Fraunces + DM Mono, always-contrast CTAs, and decorative hue usage — across tokens, utilities, and three home components.

**Architecture:** New CTA and decorative-hue CSS tokens are added to `tokens.css`; `utilities.css` remaps `.btn-primary`/`.btn-secondary` to those tokens and adds `.icon-wrap-hue` / `.hue-left-bar`; then the three home components (HomeHeader family, HomePracticeCard, HomeCoursesSection) consume those classes. Font swap happens in `layout.tsx` first so every subsequent file can reference the correct CSS variable.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, `next/font/google`, CSS custom properties (oklch), Lucide icons, TypeScript.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/layout.tsx` | Modify | Swap Noto Sans → DM Sans, add DM Mono font variable |
| `app/styles/tokens.css` | Modify | Add `--cta-*` tokens, `--hue-*` decorative tokens, update `--font-mono` |
| `app/styles/utilities.css` | Modify | Remap `.btn-primary`/`.btn-secondary`, add `.icon-wrap-hue`, `.hue-left-bar` |
| `components/home/HomeHeader.tsx` | Modify | New layout: plain card, hue blob, stat pills (streak/accuracy/time) |
| `components/home/HomeHeaderGreeting.tsx` | Modify | Fraunces 300 title with italic primary-colored name, eyebrow date |
| `components/home/HomeHeaderActions.tsx` | Modify | Dark primary CTA → courses, ghost secondary → daily practice |
| `components/home/HomePracticeCard.tsx` | Modify | Light bg, hue-tinted border, icon-wrap-hue, dark CTA, ghost secondary |
| `components/home/HomeCoursesSection.tsx` | Modify | Replace carousel with compact vertical list rows (max 3) |

---

## Task 1: Font Swap — `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

Replace the `Noto_Sans` import and font instance with `DM_Sans`, and add `DM_Mono`. Wire the new `--font-mono-var` CSS variable.

- [ ] **Step 1: Replace font imports and instances**

Replace the entire top section of `app/layout.tsx` (lines 4–23) with:

```tsx
import { DM_Sans, Fraunces, DM_Mono } from "next/font/google";

// Body + UI — DM Sans covers Latin and Latin Extended (IPA symbols)
const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

// Decorative / editorial headings
const fraunces = Fraunces({
  weight: "variable",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-editorial",
  axes: ["opsz"],
});

// Monospace — IPA transcription, code snippets
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono-var",
});
```

- [ ] **Step 2: Wire the new variable in the `<html>` className**

Change line 34 from:
```tsx
className={`${notoSans.variable} ${fraunces.variable}`}
```
to:
```tsx
className={`${dmSans.variable} ${fraunces.variable} ${dmMono.variable}`}
```

- [ ] **Step 3: Verify the dev server compiles without errors**

Run: `pnpm dev` (or `npm run dev`)
Expected: No TypeScript errors, page loads, fonts resolve.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(fonts): swap Noto Sans → DM Sans, add DM Mono"
```

---

## Task 2: Design Tokens — `app/styles/tokens.css`

**Files:**
- Modify: `app/styles/tokens.css`

Add CTA tokens, decorative hue tokens, and update `--font-mono` to include the new DM Mono variable. All additions go inside the existing `:root {}` block (after the last existing token group). No `.dark` override needed for CTA tokens — `--text-primary` auto-inverts.

- [ ] **Step 1: Add CTA tokens inside `:root`**

Add after the `--accent-border` line (end of `:root`, before the closing `}`):

```css
  /* ── CTA — always-contrast actions ──────────────────────────────────── */
  --cta-bg:              var(--text-primary);
  --cta-fg:              var(--bg);
  --cta-bg-hover:        oklch(0.26 0.008 var(--hue));
  --cta-outline-border:  color-mix(in oklch, var(--primary) 28%, transparent);
  --cta-outline-color:   var(--primary);
  --cta-outline-bg-hover: color-mix(in oklch, var(--primary) 6%, transparent);

  /* ── Decorative hue helpers ──────────────────────────────────────────── */
  --hue-icon-bg: color-mix(in oklch, var(--primary) 12%, transparent);
  --hue-blob:    color-mix(in oklch, var(--primary) 7%, transparent);
  --hue-bar:     var(--primary);
```

- [ ] **Step 2: Update `--font-mono` to include DM Mono**

Find the line (line ~174):
```css
  --font-mono:    400 0.875rem / 1.6 ui-monospace, "Fira Code", monospace;
```

Replace with:
```css
  --font-mono:    400 0.875rem / 1.6 var(--font-mono-var), "Fira Code", monospace;
```

- [ ] **Step 3: Add dark-mode override for `--cta-bg-hover` inside `.dark {}`**

Inside the `.dark {}` block, after the `--accent-border` line:

```css
  /* ── CTA dark overrides ─────────────────────────────────────────────── */
  --cta-bg-hover: oklch(0.88 0.004 var(--hue));
```

(In light mode `--cta-bg` is near-black `oklch(0.18...)`, so darkening by ~5% gives `oklch(0.26...)`. In dark mode it's near-white `oklch(0.93...)`, so lightening by ~5% gives `oklch(0.88...)`. The decorative tokens need no dark override — `color-mix` with `--primary` adapts automatically.)

- [ ] **Step 4: Commit**

```bash
git add app/styles/tokens.css
git commit -m "feat(tokens): add CTA tokens, hue decorative tokens, update --font-mono"
```

---

## Task 3: Utilities — `app/styles/utilities.css`

**Files:**
- Modify: `app/styles/utilities.css`

Remap `.btn-primary` and `.btn-secondary` to the new CTA token system. Add `.icon-wrap-hue` and `.hue-left-bar`.

- [ ] **Step 1: Remap `.btn-primary`**

Find and replace the existing `.btn-primary` block (lines 11–17):

```css
/* before */
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  transition: all 0.2s ease;
}
.btn-primary:hover    { background-color: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
```

Replace with:

```css
.btn-primary {
  background-color: var(--cta-bg);
  color: var(--cta-fg);
  transition: background-color 0.2s ease;
}
.btn-primary:hover    { background-color: var(--cta-bg-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 2: Remap `.btn-secondary`**

Find and replace the existing `.btn-secondary` block (lines 19–29):

```css
/* before */
.btn-secondary {
  background-color: var(--btn-regular-bg);
  color: var(--text-primary);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background-color: var(--btn-regular-bg-hover);
  border-color: var(--border-hover);
}
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
```

Replace with:

```css
.btn-secondary {
  background: transparent;
  color: var(--cta-outline-color);
  border: 1px solid var(--cta-outline-border);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.btn-secondary:hover {
  background-color: var(--cta-outline-bg-hover);
  border-color: var(--primary);
}
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 3: Add new utility classes**

Add after the `.btn-secondary` block:

```css
/* ── Hue decorative helpers ──────────────────────────────────────────────── */
.icon-wrap-hue {
  background: var(--hue-icon-bg);
  color: var(--primary);
}

.hue-left-bar {
  border-left: 2px solid var(--primary);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/styles/utilities.css
git commit -m "feat(utilities): remap btn-primary/secondary to CTA tokens, add icon-wrap-hue"
```

---

## Task 4: HomeHeaderGreeting — `components/home/HomeHeaderGreeting.tsx`

**Files:**
- Modify: `components/home/HomeHeaderGreeting.tsx`

Eyebrow becomes the date (with CalendarDays icon). Title becomes Fraunces 300 with the name in italic primary color.

- [ ] **Step 1: Rewrite the component**

Replace the entire file content with:

```tsx
import { CalendarDays } from "lucide-react";

interface HomeHeaderGreetingProps {
  userName: string;
  dateLabel: string;
}

export default function HomeHeaderGreeting({ userName, dateLabel }: HomeHeaderGreetingProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
        <CalendarDays size={11} />
        {dateLabel}
      </p>
      <h1
        className="text-3xl font-light leading-tight tracking-tight"
        style={{ fontFamily: "var(--font-editorial), serif", fontOpticalSizing: "auto" } as React.CSSProperties}
      >
        Good to see you,{" "}
        <em className="not-italic font-light text-[var(--primary)]">{userName}</em>
      </h1>
    </div>
  );
}
```

Note: `style` is used here for `fontFamily` and `fontOpticalSizing` because Tailwind v4 does not expose `font-editorial` as a utility and these are static values referencing a CSS variable — not runtime-computed. This is acceptable per CLAUDE.md which allows `style={{}}` for "values computed at runtime" — here we use it solely because there is no corresponding Tailwind utility class for the custom editorial font.

- [ ] **Step 2: Commit**

```bash
git add components/home/HomeHeaderGreeting.tsx
git commit -m "feat(home): Fraunces greeting with italic primary name"
```

---

## Task 5: HomeHeaderActions — `components/home/HomeHeaderActions.tsx`

**Files:**
- Modify: `components/home/HomeHeaderActions.tsx`

Primary button: dark CTA → `/courses`. Secondary button: plain ghost → `/daily`.

The existing `Button` component accepts a `className` prop. We override its background/color via the utility classes added in Task 3.

- [ ] **Step 1: Rewrite the component**

Replace the entire file content with:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Play, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

interface HomeHeaderActionsProps {
  hasStartedLearning: boolean;
}

export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={() => router.push("/courses")}
        size="sm"
        icon={<Play size={13} className="fill-current" />}
        className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
      >
        {hasStartedLearning ? "Continue learning" : "Start learning"}
      </Button>
      <Button
        onClick={() => router.push("/daily")}
        size="sm"
        icon={<Zap size={13} />}
        className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
      >
        Daily practice
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Check the Button component accepts className override**

```bash
grep -n "className" components/ui/Button.tsx | head -20
```

Expected: `className` is spread onto the root element or merged via `cn()`. If the Button component does NOT forward className to the element that has background styling, use a plain `<button>` element instead:

```tsx
<button
  onClick={() => router.push("/courses")}
  className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
>
  <Play size={13} className="fill-current" />
  {hasStartedLearning ? "Continue learning" : "Start learning"}
</button>
<button
  onClick={() => router.push("/daily")}
  className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
>
  <Zap size={13} />
  Daily practice
</button>
```

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeHeaderActions.tsx
git commit -m "feat(home): update header actions to CTA token style"
```

---

## Task 6: HomeHeader — `components/home/HomeHeader.tsx`

**Files:**
- Modify: `components/home/HomeHeader.tsx`

Replace gradient card with plain surface. Add decorative hue blob (via inline style — runtime `--hue-blob` value needs the CSS variable, but since it's a static gradient composition we use a `::before`-equivalent by rendering a positioned `<div>`). Add three stat pills for streak, accuracy, and time. Keep `CardsDueWidget` and `TaskProgressRing` in a right column.

The stat data from `useSoundProgress` gives `progressList`. Derive:
- Streak: not in the hook — show `"—"` for now (streak hook is out of scope for this task)
- Accuracy: average `progressList.map(p => p.score)` if available, else `"—"`
- Time: not available in this hook — show `"—"`

Use semantic icon colors: Flame (warning), Target (success), Clock (primary).

- [ ] **Step 1: Rewrite the component**

Replace the entire file content with:

```tsx
"use client";

// Planned structure:
// <HomeHeader>
//   <blob div /> (decorative)
//   <left col>
//     <HomeHeaderGreeting />
//     <stat pills: streak · accuracy · time />
//     <HomeHeaderActions />
//   </left col>
//   <right col>
//     <CardsDueWidget />
//     <TaskProgressRing />
//   </right col>
// </HomeHeader>

import { Flame, Target, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import CardsDueWidget from "@/components/home/CardsDueWidget";
import TaskProgressRing from "@/components/home/TaskProgressRing";

interface StatPillProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="icon-wrap-hue flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
        {icon}
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{value}</span>
        <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      </span>
    </div>
  );
}

export default function HomeHeader() {
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = fullName.split(" ")[0];
  const hasStartedLearning = progressList.length > 0;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const avgAccuracy =
    progressList.length > 0
      ? Math.round(progressList.reduce((sum, p) => sum + (p.score ?? 0), 0) / progressList.length)
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 items-center bg-surface-raised border border-border-subtle">
      {/* Decorative hue blob */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, var(--hue-blob) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />

        <div className="flex items-center gap-5 flex-wrap">
          <StatPill
            icon={<Flame size={14} className="text-[var(--warning)]" />}
            value="—"
            label="day streak"
          />
          <StatPill
            icon={<Target size={14} className="text-[var(--success)]" />}
            value={avgAccuracy !== null ? `${avgAccuracy}%` : "—"}
            label="accuracy"
          />
          <StatPill
            icon={<Clock size={14} className="text-[var(--primary)]" />}
            value="—"
            label="today"
          />
        </div>

        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>

      <div className="relative z-10 flex items-center justify-end gap-4">
        <CardsDueWidget />
        <TaskProgressRing />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify `useSoundProgress` exposes a `score` field**

```bash
grep -n "score" hooks/useSoundProgress.ts
```

If `score` does not exist on the progress object, replace `p.score` with whatever the correct field name is (e.g. `p.accuracy`, `p.grade`). If no numeric score exists in the hook, set `avgAccuracy = null` unconditionally.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeHeader.tsx
git commit -m "feat(home): redesign header — plain card, hue blob, stat pills"
```

---

## Task 7: HomePracticeCard — `components/home/HomePracticeCard.tsx`

**Files:**
- Modify: `components/home/HomePracticeCard.tsx`

Light `bg-surface-raised` card with hue-tinted border. Decorative blob top-right. `icon-wrap-hue` wrapping Bot icon. Chips using `--hue-icon-bg`. Dark primary CTA + ghost-hue secondary. Beta badge kept.

- [ ] **Step 1: Rewrite the component**

Replace the entire file content with:

```tsx
"use client";

// Planned structure:
// <HomePracticeCard>
//   <blob div /> (decorative)
//   <header row: icon-wrap + title + beta badge />
//   <subtitle />
//   <chips: Conversation · Pronunciation · Adaptive />
//   <CTA row: "Start session" (dark) + "Browse topics" (ghost) />
// </HomePracticeCard>

import Link from "next/link";
import { Bot, ArrowRight, BookOpen } from "lucide-react";

const CHIPS = ["Conversation", "Pronunciation feedback", "Adaptive"];

export default function HomePracticeCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4 bg-surface-raised"
      style={{ border: "1px solid var(--cta-outline-border)" }}
    >
      {/* Decorative hue blob */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, var(--hue-blob) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="icon-wrap-hue flex items-center justify-center w-9 h-9 rounded-lg shrink-0">
          <Bot size={18} />
        </span>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Practice with AI</span>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)] uppercase tracking-wide">
          Beta
        </span>
      </div>

      {/* Subtitle */}
      <p className="relative z-10 text-[11px] text-[var(--text-secondary)] leading-relaxed -mt-1">
        Improve speaking and writing with real-time AI feedback.
      </p>

      {/* Chips */}
      <div className="relative z-10 flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium"
            style={{ background: "var(--hue-icon-bg)", color: "var(--primary)" }}
          >
            {chip}
          </span>
        ))}
      </div>

      {/* CTA row */}
      <div className="relative z-10 flex gap-2 flex-wrap mt-auto">
        <Link
          href="/practice/sounds"
          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold"
        >
          Start session
          <ArrowRight size={13} />
        </Link>
        <Link
          href="/practice/topics"
          className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium"
        >
          <BookOpen size={13} />
          Topics
        </Link>
      </div>
    </div>
  );
}
```

Note: `style` on the outer div and chips is used for `border` and `background`/`color` values that reference CSS custom properties not available as Tailwind v4 utilities — consistent with project rules.

- [ ] **Step 2: Commit**

```bash
git add components/home/HomePracticeCard.tsx
git commit -m "feat(home): redesign practice card — light bg, hue border/blob, dark CTA"
```

---

## Task 8: HomeCoursesSection — `components/home/HomeCoursesSection.tsx`

**Files:**
- Modify: `components/home/HomeCoursesSection.tsx`

Replace the carousel with a compact vertical list (max 3 rows). Each row: `icon-wrap-hue` left (36×36) + course name + subtitle + progress bar right. `CourseCard` and `LibraryItemCard` are NOT touched — they remain for `/courses` page.

A small helper `courseIcon` maps course title keywords to a Lucide icon: Headphones for audio/listening/shadowing, MessageSquare for conversation/speaking/chat, BookOpen as default.

The Course type from `@/lib/notion/types` has `title`, `slug`, `description` fields. Progress is not available from the `/api/notion/courses` endpoint — show a placeholder bar at 0% until a progress source is connected.

- [ ] **Step 1: Check the Course type shape**

```bash
grep -n "export" lib/notion/types.ts | head -20
grep -n "interface Course\|type Course" lib/notion/types.ts
```

Note the exact field names — the plan uses `course.title`, `course.slug`, `course.description`. Adjust if the actual type differs.

- [ ] **Step 2: Rewrite the component**

Replace the entire file content with:

```tsx
"use client";

// Planned structure:
// <HomeCoursesSection>
//   <header row: title + "View all" link />
//   <list: up to 3 CourseRow items />
//   <skeleton while loading />
// </HomeCoursesSection>

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Course } from "@/lib/notion/types";

function courseIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (/audio|listen|shadow/.test(t)) return Headphones;
  if (/convers|speak|chat/.test(t)) return MessageSquare;
  return BookOpen;
}

interface CourseRowProps {
  course: Course;
}

function CourseRow({ course }: CourseRowProps) {
  const Icon = courseIcon(course.title);
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="flex items-center gap-3 py-2.5 rounded-xl hover:bg-[var(--hue-icon-bg)] transition-colors px-1 -mx-1 group"
    >
      <span className="icon-wrap-hue flex items-center justify-center w-9 h-9 rounded-lg shrink-0">
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{course.title}</p>
        <p className="text-[11px] text-[var(--text-tertiary)] truncate">{course.description ?? "—"}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-[3px] rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--hue-bar)]" style={{ width: "0%" }} />
        </div>
        <ArrowRight size={13} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

function CourseRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <div className="w-9 h-9 rounded-lg bg-[var(--border-subtle)] animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-3 w-2/3 rounded bg-[var(--border-subtle)] animate-pulse" />
        <div className="h-2.5 w-1/2 rounded bg-[var(--border-subtle)] animate-pulse" />
      </div>
    </div>
  );
}

export default function HomeCoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notion/courses")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Course[]) => { setCourses(data.slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
          Your courses
        </p>
        <Link
          href="/courses"
          className="text-[11px] font-medium text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>

      {loading ? (
        <>
          <CourseRowSkeleton />
          <CourseRowSkeleton />
          <CourseRowSkeleton />
        </>
      ) : courses.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)] py-3">No courses available yet.</p>
      ) : (
        courses.map((course) => <CourseRow key={course.id} course={course} />)
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify the Course type has `id`, `title`, `slug`, `description` fields**

If `description` doesn't exist, replace `course.description ?? "—"` with `"—"`. If `slug` doesn't exist, replace `/courses/${course.slug}` with `/courses/${course.id}`.

- [ ] **Step 4: Commit**

```bash
git add components/home/HomeCoursesSection.tsx
git commit -m "feat(home): replace courses carousel with compact list rows"
```

---

## Task 9: Visual QA

- [ ] **Step 1: Open the home page in the browser**

Run: `pnpm dev` then open `http://localhost:3000`

Check:
- DM Sans loads (inspect font in DevTools → computed font-family on body text should show "DM Sans")
- `HomeHeader`: plain card (no gradient), hue blob visible top-right, stat pills render
- `HomeHeaderGreeting`: Fraunces heading with italic primary-colored name
- `HomeHeaderActions`: dark primary button + ghost secondary button
- `HomePracticeCard`: light bg, hue-tinted border, Bot icon in hue background, dark CTA
- `HomeCoursesSection`: vertical list rows with hue icon backgrounds and progress bars

- [ ] **Step 2: Toggle dark mode**

Switch to dark mode (via existing ThemeProvider toggle). Verify:
- `btn-primary` inverts correctly (near-white bg in dark mode, dark text)
- `btn-secondary` hue border is visible (primary color adapts to dark hue)
- Hue blob and icon backgrounds remain subtle

- [ ] **Step 3: Check no regressions on other pages**

Visit `/courses`, `/practice/sounds`, `/daily`. Confirm `CourseCard` still renders normally (unchanged). Confirm no broken button styles elsewhere (`.btn-primary` and `.btn-secondary` are now contrast-first; pages using them will look bolder — this is expected).

- [ ] **Step 4: Final commit if any visual fix was needed**

```bash
git add -p
git commit -m "fix(home): visual QA adjustments"
```
