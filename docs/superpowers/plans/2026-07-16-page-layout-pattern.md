# Page Layout Pattern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every authenticated sidebar route (hubs + sessions, except Admin) use the Home-canonical shell: `AppShell` → `PageLayout` → `PageHeader` → content, with Spanish chrome, one primary CTA, token-only styling, and configurable theme preserved.

**Architecture:** Harden shared `PageLayout` / `PageHeader` to the contract in `docs/superpowers/specs/2026-07-16-page-layout-pattern-design.md`, then migrate each sidebar destination to that contract. Domain chrome (Sound Lab continue bar, Words tab actions) becomes **content under** `PageHeader`, not a second hero language. Do not invent new tokens.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-07-16-page-layout-pattern-design.md`  
**Design refs:** `DESIGN.md` § Page Layout Pattern; Home reference: `components/home/*`

---

## File Map

| File | Responsibility |
| --- | --- |
| `components/layout/page-header/types.ts` | Canonical `PageHeader` props (`kicker`, `title`, `subtitle`, actions, `compact`, progress) |
| `components/layout/page-header/CanonicalHeader.tsx` | **Create** — quiet header matching Home chrome (no card shell, no Fraunces, kicker system) |
| `components/layout/page-header/DefaultCompactHeader.tsx` | Keep temporarily as legacy adapter OR delete after call-site migration |
| `components/layout/page-header/HeroCompactHeader.tsx` | Mark unused for new work; migrate call sites off it |
| `components/layout/PageHeader.tsx` | Route to `CanonicalHeader` for `default`/`compact`; stop preferring hero chrome |
| `components/layout/PageLayout.tsx` | Canonical open canvas only for default; deprecate `cardWrapper` true path for sidebar pages |
| `components/layout/__tests__/PageHeader.canonical.test.tsx` | **Create** — contract tests |
| `components/layout/__tests__/PageLayout.canonical.test.tsx` | **Create** — no page card-wrapper by default |
| Hub pages / headers listed per task below | Replace local heroes with `PageHeader` + ES chrome |
| Session/detail routes | `PageHeader compact` + optional progress |

**Out of this plan:** Admin/Seed, new tokens, product logic, Home redesign.

---

### Task 1: Canonical PageHeader — failing tests

**Files:**
- Create: `components/layout/__tests__/PageHeader.canonical.test.tsx`
- Modify later: `components/layout/page-header/types.ts`, `CanonicalHeader.tsx`, `PageHeader.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PageHeader from "@/components/layout/PageHeader";

describe("PageHeader canonical contract", () => {
  it("renders kicker → title → subtitle → primary action in order", () => {
    render(
      <PageHeader
        kicker="Practice"
        title="Sound Lab"
        subtitle="Elige un sonido para practicar"
        primaryCta={{ label: "Empezar", onClick: vi.fn() }}
      />,
    );

    const header = screen.getByRole("banner");
    expect(header.textContent).toMatch(/Practice.*Sound Lab.*Elige un sonido/s);
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("does not use Fraunces/display font class on the title", () => {
    const { container } = render(<PageHeader title="Progress" />);
    const title = container.querySelector("h1");
    expect(title?.className).not.toMatch(/font-display|font-fraunces/);
  });

  it("compact variant still exposes the same anatomy", () => {
    render(
      <PageHeader
        variant="compact"
        kicker="Sesión"
        title="Minimal pairs"
        subtitle="2 de 8"
        progress={25}
      />,
    );
    expect(screen.getByRole("banner").textContent).toMatch(/Sesión/);
    expect(screen.getByText("Minimal pairs")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec vitest run components/layout/__tests__/PageHeader.canonical.test.tsx
```

Expected: FAIL (missing `role="banner"`, and/or current header still card/eyebrow based).

- [ ] **Step 3: Commit the failing test**

```bash
git add components/layout/__tests__/PageHeader.canonical.test.tsx
git commit -m "test(layout): add failing canonical PageHeader contract tests"
```

---

### Task 2: Implement CanonicalHeader + wire PageHeader

**Files:**
- Create: `components/layout/page-header/CanonicalHeader.tsx`
- Modify: `components/layout/page-header/types.ts`
- Modify: `components/layout/PageHeader.tsx`
- Modify: `components/layout/page-header/PageHeaderButtons.tsx` (only if needed for tokens)

- [ ] **Step 1: Extend types (keep `CTAButton`; add aliases)**

In `types.ts`, ensure:

```ts
export interface PageHeaderProps {
  /** Prefer over legacy `badge` for new call sites */
  kicker?: string;
  badge?: string; // legacy alias → maps to kicker
  title: string;
  subtitle?: string;
  description?: string; // legacy; prefer subtitle for chrome
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
  variant?: "default" | "compact" | "hero-compact"; // hero-compact deprecated
  progress?: number;
  lessonTitle?: string;
  phonemeLabel?: string;
  onContinue?: () => void;
  className?: string;
  /** illustration deprecated for canonical chrome — ignored when variant !== hero-compact */
  illustration?: ReactNode;
}
```

Resolve display kicker as `kicker ?? badge`. Prefer `subtitle` over `description` when both exist for the chrome line under the title.

- [ ] **Step 2: Implement `CanonicalHeader`**

```tsx
// Planned structure:
// <header>
//   kicker?
//   h1 title
//   subtitle?
//   actions? | progress?
// </header>

import { CtaButtons } from "./PageHeaderButtons";
import type { PageHeaderDerived } from "./types";
import { cn } from "@/lib/utils";

export function CanonicalHeader({
  kicker,
  badge,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  variant,
  hasProgress,
  safeProgress,
  lessonTitle,
  phonemeLabel,
  onContinue,
  className = "",
}: PageHeaderDerived) {
  const isCompact = variant === "compact";
  const chromeKicker = kicker ?? badge;
  const chromeSubtitle = subtitle ?? description;

  return (
    <header
      role="banner"
      className={cn(
        "flex flex-col",
        isCompact ? "gap-2 pb-4" : "gap-3 pb-6",
        className,
      )}
    >
      {chromeKicker ? (
        <span className="font-kicker text-fg-muted">{chromeKicker}</span>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex flex-col gap-1">
          <h1 className={cn("text-balance text-fg", isCompact ? "text-h3" : "text-h2")}>
            {title}
          </h1>
          {chromeSubtitle ? (
            <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
              {chromeSubtitle}
            </p>
          ) : null}
        </div>
        {!hasProgress && (primaryCta || secondaryCta) ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="md" />
          </div>
        ) : null}
      </div>
      {hasProgress ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {phonemeLabel ? (
              <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-caption text-fg">
                {phonemeLabel}
              </span>
            ) : null}
            {lessonTitle ? (
              <span className="truncate font-body-sm text-fg">{lessonTitle}</span>
            ) : null}
            <span className="ml-auto font-caption tabular-nums text-fg-muted">
              {safeProgress}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-fg transition-[width] duration-300 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          {onContinue && primaryCta == null ? (
            <CtaButtons
              primaryCta={{ label: "Continuar", onClick: onContinue }}
              rounded="md"
            />
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
```

Rules baked in:
- No `border` / `shadow` card around the header
- No Fraunces / `font-display`
- Progress bar uses `bg-fg` (neutral), not primary fill (One Voice / DESIGN)
- Tokens / Tailwind semantic classes only

- [ ] **Step 3: Wire `PageHeader.tsx`**

```tsx
"use client";

import { CanonicalHeader } from "./page-header/CanonicalHeader";
import { HeroCompactHeader } from "./page-header/HeroCompactHeader";
import type { PageHeaderProps } from "./page-header/types";

export default function PageHeader(props: PageHeaderProps) {
  const { variant = "default", progress, lessonTitle, onContinue } = props;
  const hasProgress = !!(progress !== undefined && (lessonTitle || props.subtitle) && (onContinue || props.primaryCta));
  // Prefer: hasProgress when progress is a number in compact mode even without onContinue
  const safeProgress =
    progress !== undefined ? Math.max(0, Math.min(100, Math.round(progress))) : 0;
  const derived = {
    ...props,
    hasProgress: progress !== undefined,
    safeProgress,
  };

  if (variant === "hero-compact") {
    return <HeroCompactHeader {...derived} />;
  }

  return <CanonicalHeader {...derived} />;
}
```

Tune `hasProgress` so the Task 1 compact test passes (`progress={25}` shows the bar).

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm exec vitest run components/layout/__tests__/PageHeader.canonical.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/page-header components/layout/PageHeader.tsx components/layout/__tests__/PageHeader.canonical.test.tsx
git commit -m "feat(layout): add canonical PageHeader matching Home chrome"
```

---

### Task 3: Canonical PageLayout — open canvas default

**Files:**
- Modify: `components/layout/PageLayout.tsx`
- Create: `components/layout/__tests__/PageLayout.canonical.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import PageLayout from "@/components/layout/PageLayout";

describe("PageLayout canonical", () => {
  it("does not wrap children in a page-level card by default", () => {
    const { container } = render(
      <PageLayout>
        <p>contenido</p>
      </PageLayout>,
    );
    expect(container.querySelector(".rounded-2xl")).toBeNull();
    expect(container.textContent).toContain("contenido");
  });

  it("ignores cardWrapper=true for default variant (warn via comment in impl)", () => {
    const { container } = render(
      <PageLayout cardWrapper>
        <p>x</p>
      </PageLayout>,
    );
    expect(container.querySelector(".rounded-2xl")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (current code wraps when `cardWrapper`/hero)

- [ ] **Step 3: Implement**

```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  hero?: ReactNode; // deprecated for sidebar pages; if passed, render above children without card wrap
  children: ReactNode;
  className?: string;
  variant?: "default" | "lesson";
  /** @deprecated Ignored for default variant — open canvas is mandatory */
  cardWrapper?: boolean;
}

export default function PageLayout({
  hero,
  children,
  className = "",
  variant = "default",
}: PageLayoutProps) {
  if (variant === "lesson") {
    return (
      <div className="flex flex-col">
        {hero}
        <div className={className}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full px-4 py-6 pb-12 sm:px-6 sm:py-8 sm:pb-16 lg:px-10",
        className,
      )}
    >
      {hero}
      {children}
    </div>
  );
}
```

Remove `contentStyle` / inline styles. Call sites that passed `contentStyle` must drop it (grep + fix in Task 4+).

- [ ] **Step 4: Run PageLayout tests PASS; fix any broken callers that relied on card wrapper in unit tests**

```bash
pnpm exec vitest run components/layout/__tests__/PageLayout.canonical.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/PageLayout.tsx components/layout/__tests__/PageLayout.canonical.test.tsx
git commit -m "feat(layout): make PageLayout open-canvas canonical by default"
```

---

### Task 4: AppShell — immersion = narrow content, not missing chrome

**Files:**
- Modify: `components/layout/AppShell.tsx`
- Modify: `components/layout/__tests__/AppShell.test.tsx` (add assertion)

- [ ] **Step 1: Confirm sidebar + bottom nav still render on immersive paths**

Existing immersive paths:

```ts
pathname.startsWith("/practice/sounds/sound/") ||
pathname === "/daily" ||
pathname === "/practice/review"
```

Keep max-width narrowing for those paths. Add a short comment citing the spec: chrome stays.

- [ ] **Step 2: Test**

```tsx
it("keeps sidebar on immersive practice routes", () => {
  mockPathname = "/practice/sounds/sound/ae";
  render(<AppShell><div>session</div></AppShell>);
  expect(screen.getByTestId("sidebar")).toBeTruthy();
  expect(screen.getByTestId("bottom-nav")).toBeTruthy();
});
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/AppShell.tsx components/layout/__tests__/AppShell.test.tsx
git commit -m "fix(layout): document immersive narrow content without hiding AppShell"
```

---

### Task 5: Migrate Progress (`/progress`)

**Files:**
- Modify: `app/(authenticated)/progress/page.tsx`

- [ ] Replace `PageIntro` with:

```tsx
<PageHeader
  kicker="Seguimiento"
  title="Progreso"
  subtitle="Racha, consistencia y perfil de habilidades a partir de lo que practicas."
/>
```

- [ ] Keep `PageLayout` (no `cardWrapper` prop needed).
- [ ] Spanish chrome for any remaining EN labels touched in this file.
- [ ] Manual check: one composition, no Fraunces title, tokens only.
- [ ] Commit: `feat(progress): adopt canonical PageHeader`

---

### Task 6: Migrate Sound Lab hub (`/practice/sounds`)

**Files:**
- Modify: `components/phoneme-practice/SoundLabPage.tsx`
- Modify: `components/phoneme-practice/SoundLabHeader.tsx`

- [ ] Wrap page in `PageLayout` if not already.
- [ ] Top: canonical `PageHeader`:

```tsx
<PageHeader
  kicker="Practice"
  title="Sound Lab"
  subtitle={/* Spanish stats line — translate headerStatsLine */}
  primaryCta={showResume ? { label: continueCtaLabelEs(heroLesson), onClick: onResume } : undefined}
/>
```

- [ ] Move `SoundLabContinuingBar` **below** the header as content (not inside a hero card).
- [ ] Delete the `sound-lab__hero-card` wrapper chrome (bordered mega-card). Keep list cards as interactive units.
- [ ] Translate chrome strings to Spanish (`N sonidos en curso`, `Continuar /æ/`, etc.).
- [ ] Update any Sound Lab header tests.
- [ ] Commit: `feat(sounds): Sound Lab hub uses canonical page shell`

---

### Task 7: Migrate Essential Words hub (`/practice/core-1000`)

**Files:**
- Modify: `app/(authenticated)/practice/core-1000/page.tsx`
- Modify: whatever client header lives under `components/practice/core-1000/*`

- [ ] Ensure `PageLayout` + `PageHeader` (`kicker="Practice"`, title product name or ES label, Spanish subtitle).
- [ ] One primary CTA for the main practice action.
- [ ] Commit: `feat(core-1000): adopt canonical page shell`

---

### Task 8: Migrate Review hub (`/practice/review`)

**Files:**
- Modify: `app/(authenticated)/practice/review/page.tsx`
- Modify: `components/practice/review/ReviewHubClient.tsx`

- [ ] `PageHeader` with Spanish chrome; keep queue content below.
- [ ] Remove duplicate page-level card wrappers.
- [ ] Commit: `feat(review): adopt canonical page shell`

---

### Task 9: Migrate Decks hub (`/practice/decks`)

**Files:**
- Modify: `app/(authenticated)/practice/decks/page.tsx`
- Modify: `components/practice/decks/DecksIndexClient.tsx`

- [ ] Canonical header + open layout.
- [ ] Commit: `feat(decks): adopt canonical page shell`

---

### Task 10: Migrate Mini Lessons (`/mini-lessons` + `[slug]`)

**Files:**
- Modify: `app/(authenticated)/mini-lessons/page.tsx`
- Modify: `components/mini-lessons/MiniLessonsBrowser.tsx` (or equivalent)
- Modify: `app/(authenticated)/mini-lessons/[slug]/page.tsx` (+ detail chrome)

- [ ] Hub: `PageHeader` kicker `Learn` / ES equivalent, Spanish subtitle.
- [ ] Detail: `variant="compact"` header with lesson title; body unchanged.
- [ ] Commit: `feat(mini-lessons): adopt canonical page shell`

---

### Task 11: Migrate Ruta / Courses (`/courses` + study/lesson children)

**Files:**
- Modify: `components/courses/CoursePathPage.tsx` (and related path headers)
- Child routes under `app/(authenticated)/courses/**` as needed

- [ ] Hub uses `PageLayout` + `PageHeader`.
- [ ] Study/lesson flows: compact header; do **not** hide AppShell.
- [ ] Avoid nested full-page cards.
- [ ] Commit: `feat(courses): adopt canonical page shell`

---

### Task 12: Migrate IPA Chart (`/ipa`)

**Files:**
- Modify: `components/ipa/IPAPageHeader.tsx` → thin wrapper around `PageHeader` **or** replace call site in `IPAChart.tsx`
- Modify: `components/ipa/IPAChart.tsx`

- [ ] Replace eyebrow `ipa-chart__eyebrow` with `PageHeader` kicker.
- [ ] Primary CTA: Sound Lab (one solid primary); secondary: “Practicar aquí” ghost/outline.
- [ ] Spanish chrome for buttons already partly ES — unify.
- [ ] Commit: `feat(ipa): adopt canonical page shell`

---

### Task 13: Migrate Words (`/words`)

**Files:**
- Modify: `components/words/WordsClient.tsx`
- Modify: `components/words/WordsHero.tsx` (refactor to actions row under `PageHeader`, or delete)
- Modify: tab runtimes that inject `WordsHero`

- [ ] Page-level:

```tsx
<PageHeader
  kicker="Reference"
  title="Words"
  subtitle="Tu colección y mazos"
  primaryCta={{ label: activeTab === "my-words" ? "Nueva palabra" : "Nuevo mazo", onClick: ... }}
/>
```

- [ ] Remove EN “New Word” / “New Deck” chrome; stats line in Spanish.
- [ ] Commit: `feat(words): adopt canonical page shell`

---

### Task 14: Session / detail routes — compact header

**Files (at minimum):**
- `app/(authenticated)/practice/sounds/sound/[soundId]/page.tsx` (and client shell)
- Core-1000 session UI entry
- Deck study session headers (`StudySessionHeader` / `StudyHeader`) — align chrome, don’t necessarily delete domain controls
- `app/(authenticated)/daily/page.tsx` if still a destination

- [ ] Each session root: `PageHeader variant="compact"` with Spanish subtitle/progress where real.
- [ ] Keep exercise body focused; no second competing hero.
- [ ] Verify AppShell sidebar still visible on desktop.
- [ ] Commit per area or one: `feat(sessions): compact canonical headers on practice flows`

---

### Task 15: Legacy cleanup + verification

**Files:**
- Grep: `hero-compact`, `cardWrapper={true}`, `font-display` on page titles, `PageIntro`, `contentStyle`
- Modify: `components/practice/PracticeLessonsPage.tsx` if still using old `PageHeader` props oddly
- Optional: leave `HeroCompactHeader.tsx` with a file-top `@deprecated` comment until zero imports

- [ ] **Step 1: Grep cleanup**

```bash
pnpm exec rg "hero-compact|cardWrapper=\{true\}|PageIntro|contentStyle" app components --glob "*.tsx"
```

Fix remaining in-scope hits.

- [ ] **Step 2: Tests + types**

```bash
pnpm exec vitest run components/layout
pnpm type-check
```

Expected: PASS.

- [ ] **Step 3: Per-route checklist (manual)**

For each sidebar href in `navConfig.ts` (except Admin):

- [ ] AppShell visible
- [ ] Canonical header anatomy
- [ ] ≤1 solid primary CTA in the header zone
- [ ] Spanish chrome / no Spanglish phrase
- [ ] No full-page card wrapper
- [ ] No Fraunces on chrome title
- [ ] Changing `--hue` in theme still recolors primary actions

- [ ] **Step 4: Final commit**

```bash
git commit -m "chore(layout): finish canonical page shell migration checklist"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| AppShell always on (incl. sessions) | 4, 14 |
| PageLayout open canvas | 3 |
| PageHeader anatomy + compact | 1–2, 14 |
| One primary CTA | 5–14 |
| Cards only for interaction; no page card wrap | 3, 6–13 |
| Spanish chrome / EN content | 5–13 |
| Tokens / theme preservation | 2–3 (utilities only) |
| All sidebar routes except Admin | 5–14 |
| Docs already done | prior commit `3aefd43f` |

## Placeholder scan

No TBD steps. Migration tasks 5–14 are file-specific; implementers must still read each page’s current JSX and port content under the header without inventing new queries.

## Type consistency

- Prefer props: `kicker`, `title`, `subtitle`, `primaryCta`, `secondaryCta`, `variant: "default" | "compact"`, `progress`.
- Legacy `badge` / `description` / `illustration` / `hero-compact` only for back-compat during migration; new call sites must not use them.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-16-page-layout-pattern.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
