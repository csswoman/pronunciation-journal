# Home Visual Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden home (desktop + mobile) typography, surfaces, and interaction polish per `docs/superpowers/specs/2026-07-16-home-visual-hardening-design.md`—without changing palette/`--hue` logic or home section order.

**Architecture:** Prefer extending existing utilities in `app/styles/utilities.css` (`.bg-daily-card`, `.home-card-lift`) and semantic type tokens in `theme.css`. Apply className-only changes in `components/home/*`. One global base tweak in `base.css` + `antialiased` on root. No new data hooks, queries, or routes.

**Tech Stack:** Next.js App Router, React 19, Tailwind v4, design tokens in `app/styles/tokens.css` + `theme.css`, Vitest for existing home tests.

**Spec:** `docs/superpowers/specs/2026-07-16-home-visual-hardening-design.md`  
**Skills:** `better-typography`, `better-ui` (contrast via L only if needed; no palette recipe changes)

---

## File Map

| File | Responsibility |
| --- | --- |
| `app/styles/base.css` | Remove 94%/15.5px downscale; keep reduced-motion |
| `app/layout.tsx` | Add `antialiased` on `<html>` or `<body>` |
| `app/styles/utilities.css` | Add `.home-hero-wash`; extend `.home-card-lift` with active press |
| `components/home/HomeStatusHero.tsx` | Hero hierarchy + tokenized wash |
| `components/home/HomeHeaderGreeting.tsx` | Mobile greeting type scale |
| `components/home/HomeHeaderActions.tsx` | Promote primary CTA weight (size/variant) |
| `components/home/HomeSectionHeader.tsx` | Semantic heading scale + `text-balance` |
| `components/home/HomeTodaySection.tsx` | Daily-vs-sidebar depth |
| `components/home/HomeDailyCard.tsx` | Dominant surface (shadow + lift rules) |
| `components/home/HomeWordOfDayCard.tsx` | Quiet sidebar card + hit areas + wrap |
| `components/home/HomeAiPracticeCard.tsx` | Quiet sidebar card polish |
| `components/home/HomeStreakCard.tsx` | Quiet sidebar + tabular-nums |
| `components/home/HomeQuickActionCard.tsx` | Press + hit area |
| `components/home/HomeDiscoveryCard.tsx` | Learn cards: scale title + press (already has lift) |
| `components/home/HomeMiniLessonCard.tsx` | Same as discovery if one-offs exist |
| `components/home/HomeMobileView.tsx` | Touch hit areas + press on tiles |
| `components/home/ReviewProgressCard.tsx` / `Core1000ProgressCard.tsx` | Only if one-offs / hit areas fail checklist |

**Do not modify:** `tokens.css` primary/semantic palette generation, dark-mode L mapping, home section composition in `HomeLayout.tsx` (structure stays).

---

### Task 1: Base typography (~16px + antialiased)

**Files:**
- Modify: `app/styles/base.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `base.css` body/html sizing**

In `app/styles/base.css`, replace:

```css
html {
  font-size: 94%; /* ~15px — scales the entire rem system down slightly */
}

body {
  font-size: 15.5px;
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

with:

```css
body {
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

Leave `html, body { overflow-x: hidden; }` and the rest of the file unchanged.

- [ ] **Step 2: Add `antialiased` on root**

In `app/layout.tsx`, add `antialiased` to the `<html>` `className` string (alongside font variables):

```tsx
<html
  lang="en"
  suppressHydrationWarning
  className={`${dmSans.variable} ${fraunces.variable} ${dmMono.variable} antialiased`}
>
```

- [ ] **Step 3: Verify no remaining downscale**

Run:

```bash
rg "font-size:\s*94%|15\.5px" app/styles/base.css
```

Expected: no matches.

- [ ] **Step 4: Commit** (only if the user asked for commits in this session)

```bash
git add app/styles/base.css app/layout.tsx
git commit -m "$(cat <<'EOF'
fix(ui): restore ~16px body and root antialiased

EOF
)"
```

---

### Task 2: Shared home surface utilities

**Files:**
- Modify: `app/styles/utilities.css`

- [ ] **Step 1: Add `.home-hero-wash` next to `.bg-daily-card`**

After `.bg-daily-card { ... }`, add:

```css
.home-hero-wash {
  background-color: var(--surface-raised);
  background-image: linear-gradient(
    135deg,
    var(--primary-100) 0%,
    var(--surface-raised) 55%
  );
}
```

This replaces the inline `style={{ backgroundImage: ... }}` in `HomeStatusHero` without changing palette values.

- [ ] **Step 2: Extend `.home-card-lift` for press feedback**

Replace the existing `.home-card-lift` block with:

```css
.home-card-lift {
  transition:
    transform 150ms var(--ease-out-expo),
    border-color 150ms var(--ease-out-expo);
}
.home-card-lift:hover {
  transform: translateY(-2px);
  border-color: var(--accent-border);
}
.home-card-lift:active {
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .home-card-lift:hover,
  .home-card-lift:active {
    transform: none;
  }
}
```

Do **not** use `transition: all`.

- [ ] **Step 3: Commit** (if committing)

```bash
git add app/styles/utilities.css
git commit -m "$(cat <<'EOF'
feat(ui): add home hero wash and card press feedback

EOF
)"
```

---

### Task 3: Hero + greeting + primary CTA

**Files:**
- Modify: `components/home/HomeStatusHero.tsx`
- Modify: `components/home/HomeHeaderGreeting.tsx`
- Modify: `components/home/HomeHeaderActions.tsx`

- [ ] **Step 1: Harden `HomeStatusHero`**

Replace the outer container so it uses `.home-hero-wash` and no inline style:

```tsx
<div className="home-hero-wash rounded-2xl border border-[var(--primary-200)] px-8 py-6">
```

Update eyebrow:

```tsx
<p className="mb-4 flex items-center gap-1.5 font-tiny font-semibold tracking-widest uppercase text-fg-subtle">
```

Update greeting heading:

```tsx
<h1 className="text-h2 text-balance text-fg">
  {greeting},{" "}
  <span className="font-editorial font-bold italic text-primary">
    {userName}
  </span>
</h1>
```

Keep streak/due numbers with `tabular-nums`. Soften stat column labels to `font-caption text-fg-subtle` (already mostly there). Ensure the CTA column feels primary: keep `HomeHeaderActions` under the title; do not enlarge stats beyond `text-h4` / `text-2xl` equivalent—prefer `text-h4 tabular-nums` if changing.

Remove any remaining `style={{ ... }}` from this file except runtime-computed values (there should be none after wash class).

- [ ] **Step 2: Harden `HomeHeaderGreeting`**

Replace:

```tsx
<p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-fg-subtle">
```

with:

```tsx
<p className="flex items-center gap-1.5 font-tiny font-semibold tracking-widest uppercase text-fg-subtle">
```

Replace the `h1` with:

```tsx
<h1 className="font-editorial text-h2 font-semibold tracking-tight text-balance text-fg">
  {greeting}
  {displayName && (
    <>, <span className="text-primary">{displayName}</span></>
  )}.
</h1>
```

Keep subtitle as `text-label text-fg-muted text-pretty`.

- [ ] **Step 3: Promote header CTA**

In `HomeHeaderActions.tsx`, change Button to primary weight so it beats stats visually:

```tsx
<Button
  variant="primary"
  size="md"
  icon={<Play size={14} className="fill-current" />}
  onClick={() => router.push("/courses")}
>
  {hasStartedLearning ? "Continue course" : "Explore courses"}
</Button>
```

- [ ] **Step 4: Grep check**

```bash
rg "style=\{\{|text-\[11px\]|backgroundImage" components/home/HomeStatusHero.tsx components/home/HomeHeaderGreeting.tsx
```

Expected: no static gradient/size one-offs.

- [ ] **Step 5: Commit** (if committing)

```bash
git add components/home/HomeStatusHero.tsx components/home/HomeHeaderGreeting.tsx components/home/HomeHeaderActions.tsx
git commit -m "$(cat <<'EOF'
style(home): harden hero hierarchy and primary CTA

EOF
)"
```

---

### Task 4: Section headers + Today depth split

**Files:**
- Modify: `components/home/HomeSectionHeader.tsx`
- Modify: `components/home/HomeTodaySection.tsx`

- [ ] **Step 1: Semantic titles in `HomeSectionHeader`**

Update title classes:

```tsx
const numClass =
  size === "lg"
    ? "font-display text-lg italic text-primary"
    : "font-display text-sm italic text-primary";
const titleClass =
  size === "lg"
    ? "text-h3 text-balance text-fg"
    : "text-h4 text-balance text-fg-muted";
```

Add `text-pretty` to the subtitle caption spans.

- [ ] **Step 2: Daily dominates sidebar in `HomeTodaySection`**

Wrap `dailyCard` so the main column gets dominant surface treatment at the section level **only if** Daily card itself does not already carry `shadow-sm`. Prefer applying on `HomeDailyCard` in Task 5.

In `HomeTodaySection`, keep grid as-is (`md:grid-cols-[1.7fr_1fr]`). On the goal ring row, ensure:

```tsx
<div className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-5">
```

Use token `rounded-xl` (maps to `--radius-xl`) instead of `rounded-[var(--radius-xl)]` when the Tailwind theme already exposes it (`theme.css` defines `--radius-xl`).

Minutes line must keep `tabular-nums`:

```tsx
<p className="font-label font-semibold tabular-nums text-fg">
  {dailyGoal.minutesDone} / {dailyGoal.goalMinutes} min
</p>
```

- [ ] **Step 3: Commit** (if committing)

```bash
git add components/home/HomeSectionHeader.tsx components/home/HomeTodaySection.tsx
git commit -m "$(cat <<'EOF'
style(home): semantic section titles and today type polish

EOF
)"
```

---

### Task 5: Today cards (Daily + sidebar)

**Files:**
- Modify: `components/home/HomeDailyCard.tsx`
- Modify: `components/home/HomeWordOfDayCard.tsx`
- Modify: `components/home/HomeAiPracticeCard.tsx`
- Modify: `components/home/HomeStreakCard.tsx`
- Modify: `components/home/HomeQuickActionCard.tsx`

- [ ] **Step 1: Make Daily card the dominant surface**

On the outer Daily card container, change to:

```tsx
<div className="bg-daily-card flex flex-col rounded-xl border border-border-subtle px-6 pb-6 pt-5 shadow-sm">
```

Keep progress width `style={{ transform: scaleX(...) }}` — that is runtime-computed and allowed.

Ensure completion / step counters use `tabular-nums` (already present on at least one span—audit the file).

- [ ] **Step 2: Quiet sidebar cards**

`HomeWordOfDayCard` / `HomeAiPracticeCard` / `HomeStreakCard`: keep `border-border-subtle bg-surface-raised`, **no** `shadow-sm` (Daily owns depth). Use `rounded-xl` token class. Descriptions: add `text-pretty` where multi-line.

For Word of Day listen/save icon buttons, enforce min hit area:

```tsx
className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-md ..."
```

(40×40 desktop minimum.)

- [ ] **Step 3: `HomeQuickActionCard` press + hit area**

```tsx
<Link
  href={href}
  className="home-card-lift focus-ring group flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-raised px-4 py-3"
>
  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-primary">
    {icon}
  </span>
  ...
</Link>
```

Remove redundant `transition-colors` if `.home-card-lift` covers transform/border; keep color hover via border from lift utility.

- [ ] **Step 4: Run existing home tests**

```bash
pnpm test -- components/home
```

Expected: pass (className-only changes).

- [ ] **Step 5: Commit** (if committing)

```bash
git add components/home/HomeDailyCard.tsx components/home/HomeWordOfDayCard.tsx components/home/HomeAiPracticeCard.tsx components/home/HomeStreakCard.tsx components/home/HomeQuickActionCard.tsx
git commit -m "$(cat <<'EOF'
style(home): daily depth vs quiet sidebar cards

EOF
)"
```

---

### Task 6: Reviews + Learn cards

**Files:**
- Modify: `components/home/HomeDiscoveryCard.tsx`
- Modify: `components/home/HomeMiniLessonCard.tsx` (if one-offs exist)
- Modify: `components/home/ReviewProgressCard.tsx` / `Core1000ProgressCard.tsx` only if checklist fails

- [ ] **Step 1: `HomeDiscoveryCard` title scale + pretty body**

```tsx
<h4 className={`${children ? "mt-2" : "mt-2.5"} text-h4 text-balance text-fg`}>
  {title}
</h4>
<p className="font-body-sm mt-1.5 flex-1 text-pretty leading-snug text-fg-muted">{description}</p>
```

Keep existing `home-card-lift` class (now includes `:active` scale from Task 2).

- [ ] **Step 2: Scan MiniLesson / progress cards**

```bash
rg "text-\[|style=\{\{|transition-all|h-7 w-7|h-8 w-8" components/home/HomeMiniLessonCard.tsx components/home/ReviewProgressCard.tsx components/home/Core1000ProgressCard.tsx
```

Fix only hits that violate: one-off font sizes, `transition-all`, icon hit areas &lt; 40px on interactive controls. Leave runtime `transform: scaleX` alone.

- [ ] **Step 3: Commit** (if committing)

```bash
git add components/home/HomeDiscoveryCard.tsx components/home/HomeMiniLessonCard.tsx components/home/ReviewProgressCard.tsx components/home/Core1000ProgressCard.tsx
git commit -m "$(cat <<'EOF'
style(home): harden learn and review card typography

EOF
)"
```

---

### Task 7: Mobile view parity

**Files:**
- Modify: `components/home/HomeMobileView.tsx`

- [ ] **Step 1: Primary tiles — press + touch target**

On `PrimaryActionTile` Link, add `home-card-lift` (or `active:scale-[0.96] transition-transform` if lift’s hover translateY feels wrong on accent tiles). Prefer:

```tsx
className={[
  "home-card-lift focus-ring flex items-center gap-3 rounded-xl border p-4",
  accent
    ? "border-primary bg-primary-soft text-primary"
    : "border-border-subtle bg-surface-raised text-fg hover:bg-surface-sunken",
].join(" ")}
```

Icon wrap: `h-11 w-11` (44px touch) with `rounded-lg` (concentric vs `rounded-xl` outer + `p-4`).

- [ ] **Step 2: Secondary tiles — min 44px tap**

```tsx
className="home-card-lift focus-ring flex min-h-11 flex-col items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-raised p-3"
```

Icon wrap at least `h-10 w-10`.

- [ ] **Step 3: Review banner**

Add `home-card-lift` (or active scale) + keep `tabular-nums` on counts already present via template strings—wrap the total in `tabular-nums` class on the label paragraph.

- [ ] **Step 4: Commit** (if committing)

```bash
git add components/home/HomeMobileView.tsx
git commit -m "$(cat <<'EOF'
style(home): mobile hit areas and press feedback

EOF
)"
```

---

### Task 8: Done-criteria verification sweep

**Files:** none new — audit only

- [ ] **Step 1: Grep for violations in home**

```bash
rg "text-\[11px\]|text-\[15px\]|transition-all|backgroundImage|font-size:\s*94%|15\.5px" components/home app/styles/base.css
rg "style=\{\{" components/home --glob "*.tsx"
```

Allowed `style={{}}`: only runtime transforms (progress bars, `scaleX`). Everything else must be classes/tokens.

- [ ] **Step 2: Run tests + typecheck**

```bash
pnpm test -- components/home
pnpm type-check
```

Expected: pass.

- [ ] **Step 3: Manual visual checklist (dev server)**

```bash
pnpm dev
```

Open `/` (logged in if possible). Confirm:

1. Hero CTA reads stronger than streak/due stats  
2. Daily card deeper than Word/AI/Streak sidebar  
3. Section titles use balanced wrapping on narrow widths  
4. Mobile quick tiles feel tappable (≥44px)  
5. Light + dark: no broken contrast on hero wash / daily wash (if fail, adjust **only** lightness of text/border usage—not `--primary-*` recipes)

- [ ] **Step 4: Final commit** (if committing)

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
style(home): complete visual hardening pass

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Body ~16px + antialiased | Task 1 |
| Tokenized hero gradient (no inline) | Tasks 2–3 |
| Hero hierarchy / CTA &gt; stats | Task 3 |
| Semantic type scale + balance/pretty + tabular-nums | Tasks 3–6 |
| Daily dominant vs quiet sidebar | Tasks 4–5 |
| Concentric radii / hit areas / press | Tasks 2, 5, 7 |
| No palette/`--hue` changes | All tasks (explicit non-touch) |
| Mobile parity | Task 7 |
| Done criteria grep + tests | Task 8 |

## Placeholder / consistency self-review

- No TBD steps; concrete class strings included  
- `.home-hero-wash` and extended `.home-card-lift` defined before consumers  
- Commits marked optional when user has not requested commits  
- Runtime `style` transforms explicitly preserved  
