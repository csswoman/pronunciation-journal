# Design System Refresh — English Journal

**Date:** 2026-05-27  
**Branch:** design-system-enforcement  
**Scope:** Tokens, typography, global utilities, and three home components

---

## Goal

Apply a coherent visual direction across the app: minimal/technical aesthetic, Fraunces display + DM Sans UI + DM Mono, mixed CTAs (dark primary / ghost-with-hue secondary), and intentional use of the dynamic hue color in decorative/icon elements only — not in primary actions.

---

## Design Direction (validated)

| Decision | Choice |
|---|---|
| Visual aesthetic | Minimal / Technical |
| Display font | Fraunces 300 (italic for emphasis) |
| UI font | DM Sans 400/500/600 |
| Mono font | DM Mono 400/500 |
| Primary CTA | `--text-primary` background / `--bg` text (dark in light, light in dark) |
| Secondary CTA | Transparent + `--primary-border` border + `--primary` text |
| Hue color usage | Decorative: icon backgrounds, left-border accents, waveforms, progress bars, badges — NOT primary buttons |
| Sidebar nav | Unchanged (existing collapsible left sidebar) |
| Page background | `oklch(0.93 0.012 var(--hue))` — tinted off-white, existing behavior |

---

## 1. Typography — `app/layout.tsx`

**Replace** Noto Sans with DM Sans. Keep Fraunces. Add DM Mono.

```
DM Sans       → --font-sans      (was Noto Sans)
Fraunces      → --font-editorial (unchanged)
DM Mono       → --font-mono-var  (new variable)
```

Weights to load:
- DM Sans: 300, 400, 500, 600, 700 — subsets: latin, latin-ext
- Fraunces: variable, normal + italic — subsets: latin — axes: opsz (unchanged)
- DM Mono: 400, 500 — subsets: latin

`--font-mono` in tokens currently points to `ui-monospace, "Fira Code"`. Update to use `var(--font-mono-var), "Fira Code", monospace` so DM Mono is picked up.

---

## 2. Tokens — `app/styles/tokens.css`

### 2a. CTA tokens (new)

Add to `:root` and `.dark`:

```css
/* ── CTA — always-contrast actions ──────────────────────── */
--cta-bg:          var(--text-primary);   /* dark in light, near-white in dark */
--cta-fg:          var(--bg);             /* bg of the page = contrast pair */
--cta-bg-hover:    oklch from --text-primary darkened ~5%;

--cta-outline-border: color-mix(in oklch, var(--primary) 28%, transparent);
--cta-outline-color:  var(--primary);
--cta-outline-bg-hover: color-mix(in oklch, var(--primary) 6%, transparent);
```

### 2b. Decorative hue tokens (new)

```css
--hue-icon-bg:   color-mix(in oklch, var(--primary) 12%, transparent);  /* icon wrap bg */
--hue-blob:      color-mix(in oklch, var(--primary) 7%, transparent);   /* radial blob */
--hue-bar:       var(--primary);                                         /* progress/waveform */
```

### 2c. Font mono update

```css
--font-mono: 400 0.875rem / 1.6 var(--font-mono-var), "Fira Code", monospace;
```

### 2d. Shadow refinement (optional, non-breaking)

Current shadows use `oklch(0 0 0 / 0.05–0.10)`. Keep as-is — already clean.

---

## 3. Utilities — `app/styles/utilities.css`

### 3a. Remap `.btn-primary` → always-contrast

```css
.btn-primary {
  background-color: var(--cta-bg);
  color: var(--cta-fg);
}
.btn-primary:hover { background-color: var(--cta-bg-hover); }
```

### 3b. Remap `.btn-secondary` → ghost with hue border

```css
.btn-secondary {
  background: transparent;
  color: var(--cta-outline-color);
  border: 1px solid var(--cta-outline-border);
}
.btn-secondary:hover {
  background-color: var(--cta-outline-bg-hover);
  border-color: var(--primary);
}
```

### 3c. New utility classes

```css
.icon-wrap-hue  { background: var(--hue-icon-bg); color: var(--primary); }
.hue-left-bar   { border-left: 2px solid var(--primary); }
.hue-blob::before { background: radial-gradient(...var(--hue-blob)...); }
```

---

## 4. Home Components

### 4a. `HomeHeader.tsx` + `HomeHeaderGreeting.tsx` + `HomeHeaderActions.tsx`

**Current:** Bold sans-serif h1 with name, gradient card background, primary-colored CTA button.

**New:**
- Card background: `bg-surface-raised border border-border-subtle` (no gradient) + decorative radial blob via `::before` using `--hue-blob`
- Greeting: Fraunces 300, name in italic + primary color (`font-editorial font-light`)
- Eyebrow: date label with CalendarDays icon, uppercase tracking
- Sub: accuracy/streak insight line in `text-secondary`
- Stat pills: 3 items (streak, accuracy, time) — each with `icon-wrap-hue` background, semantic icon color (warning/success/primary), value + label
- CTAs: "Start today's plan" → `btn-primary` (dark), "Browse courses" → plain ghost (border only, no hue tint since it's a navigation action, not a hue-accented secondary)

`HomeHeaderGreeting` becomes: eyebrow date + Fraunces title with italic name.  
`HomeHeaderActions` becomes: two buttons with updated classes.  
Stat pills live in `HomeHeader` directly (no new subcomponent needed — 3 pills fits inline).

### 4b. `HomePracticeCard.tsx` → "Practice with AI" card

**Current:** Dark `bg-surface-tooltip` card with primary-colored CTA button and white text throughout.

**New:**
- Background: `bg-surface-raised border` with `--cta-outline-border` border (hue-tinted subtle border)
- Decorative radial blob top-right (hue)
- Icon wrap: `icon-wrap-hue` (36×36, rounded-lg)
- Icon: `Bot` or `Sparkles` from lucide in primary color
- Title: 13px semibold, dark
- Sub: 11px secondary text
- Chips: "Conversation", "Pronunciation feedback", "Adaptive" — `bg: var(--hue-icon-bg)`, `color: var(--primary)`
- CTA row: "Start session" → `btn-primary` dark, "Topics" → `btn-ghost-hue` (outline)
- **Beta badge** kept as small pill

### 4c. `HomeCoursesSection.tsx` → list rows instead of carousel

**Current:** Horizontal scroll carousel with `CourseCard` (full LibraryItemCard).

**New:** Vertical list of compact rows — same data, denser layout fitting the home context.

Each row:
- `icon-wrap-hue` left (36×36) with a course-appropriate Lucide icon (Headphones, BookOpen, MessageSquare — derived from course title via a small helper)
- Course name (13px semibold) + subtitle (11px tertiary: unit · lesson count)  
- Progress %  + 3px bar right-aligned, bar color = `--primary` (all courses use same hue, bar color = the user's current hue)
- Tap → navigates to `/courses/[slug]`

The carousel + `CourseCard` / `LibraryItemCard` are **not deleted** — they're still used in `/courses` page. `HomeCoursesSection` just gets a new internal render path for the home context.

Max 3 courses shown on home. "View all →" link to `/courses`.

---

## 5. Files Changed

| File | Change |
|---|---|
| `app/layout.tsx` | Swap Noto Sans → DM Sans, add DM Mono |
| `app/styles/tokens.css` | Add CTA tokens, decorative hue tokens, update --font-mono |
| `app/styles/utilities.css` | Remap btn-primary/secondary, add icon-wrap-hue, hue-left-bar |
| `components/home/HomeHeader.tsx` | New layout: no gradient, blob, stat pills, Fraunces greeting |
| `components/home/HomeHeaderGreeting.tsx` | Fraunces italic name, eyebrow date |
| `components/home/HomeHeaderActions.tsx` | Updated button variants |
| `components/home/HomePracticeCard.tsx` | Redesigned: light bg, hue border/blob, dark CTA |
| `components/home/HomeCoursesSection.tsx` | Replace carousel with compact list rows (max 3) |

---

## 6. What Does NOT Change

- Sidebar nav (Sidebar.tsx, AppShell.tsx) — untouched
- HomeTodo, HomeWordsToReview, HomeWordOfDay, HomeWeakPhoneme, HomeShadowingDrill, HomeTheoryOfDay — untouched
- All non-home pages — tokens and utility class remaps will propagate naturally; no page-specific changes
- Semantic colors (success, warning, error, info) — unchanged
- Spacing scale, radius scale, transition tokens — unchanged
- Dark mode token structure — new CTA/decorative tokens follow same `:root` / `.dark` pattern

---

## 7. Self-review

- No placeholders or TBDs remaining
- CTA token approach (`--cta-bg = var(--text-primary)`) automatically inverts in dark mode since `--text-primary` is near-white in dark — no separate dark override needed
- `HomeCoursesSection` list approach doesn't break the `/courses` page since `CourseCard` is untouched
- DM Sans covers latin-ext (IPA characters) same as Noto Sans — no IPA rendering regression
- `--font-mono` update is backwards compatible (DM Mono → Fira Code fallback preserved)
