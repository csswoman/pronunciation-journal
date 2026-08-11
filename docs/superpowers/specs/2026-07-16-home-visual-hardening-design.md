# Home Visual Hardening Design

**Date:** 2026-07-16  
**Status:** Approved for planning  
**Skills applied:** `better-colors` (contrast/L only, no palette logic), `better-typography`, `better-ui`  
**Approach:** B — polish + visual hierarchy (no section reordering)

## Goal

Harden the home screen (desktop + mobile) so it feels denser, clearer, and more intentional—without changing color palette logic (`--hue`, primary scales, semantic hues, dark-mode derivation) and without restructuring home information architecture.

## Constraints

### In scope

- All UI under `components/home/*`
- Minimal global base tweaks that benefit home and the rest of the app:
  - `antialiased` on root
  - Restore body reading size to ~16px (remove `html { font-size: 94% }` and `body { font-size: 15.5px }`)
- Typography: replace one-off sizes with the existing semantic type scale in `theme.css` / `tokens.css`
- UI polish: concentric radii, hit areas, press feedback, layered shadows where appropriate, specific transitions
- Contrast fixes via lightness only if a home pairing fails APCA/WCAG floors—never by changing chroma/hue of the palette system

### Out of scope

- Changing `--hue`, `--primary-*` generation, semantic color recipes, or dark-mode L mapping strategy
- Reordering or merging Today / Reviews / Learn sections
- Data/hooks/queries changes
- Broad refactor of `components/ui/*` (only fix inconsistencies that home surfaces if unavoidable)
- Landing/marketing redesign

## Visual hierarchy (approved)

### 1. Hero (`HomeStatusHero`, mobile greeting)

| Before | After |
| --- | --- |
| Inline `style={{ backgroundImage: gradient }}` | Tokenized CSS class (no static inline style) |
| One-off `clamp` / `text-[11px]` | Scale tokens (`text-h2`, `font-tiny` / caption + tracking) |
| Name + stats compete for attention | Primary CTA dominates; stats quieter (`tabular-nums` + caption labels) |
| Fraunces on name (keep) | Keep editorial name; rest of greeting on UI sans |

### 2. Cards (Today main + sidebar)

| Rule | Application |
| --- | --- |
| Depth | Daily card = primary surface (`shadow-sm` + `border-subtle`). Sidebar cards quieter (border-only or softer shadow). |
| Concentric radii | Outer `rounded-xl` / `rounded-2xl`; inner chips/buttons = outer − padding |
| Press | Clickable cards/links: `active:scale-[0.96]` + `transition-transform` (never `transition-all`) |
| Hit areas | Icon buttons ≥ 40×40 desktop, ≥ 44×44 touch |

### 3. Typography (home-wide)

| Rule | Application |
| --- | --- |
| Section titles | Semantic scale (`text-h3` / `text-h4`), not loose `text-2xl` |
| Wrapping | Headings: `text-balance`; short descriptions: `text-pretty` |
| Numbers | Counters, minutes, due counts: `tabular-nums` |
| No new sizes | Do not invent font sizes outside `theme.css` scale |

### 4. Base typography (global)

| Before | After |
| --- | --- |
| `html { font-size: 94% }` + `body { font-size: 15.5px }` | Default rem root; body ~16px reading size |
| No root font smoothing | `antialiased` on `html` or `body` |

Note: rem-based spacing/type grows ~6% app-wide. Accepted by product decision (option A).

## Work order

1. Base (`app/styles/base.css` + root class if needed)
2. Hero + greeting + header actions
3. Today section cards (Daily, Word of Day, AI, Goal ring row, Streak, quick actions)
4. Reviews + Learn sections
5. Mobile view parity (`HomeMobileView` and related)

## Files expected

- `app/styles/base.css` (and possibly a small hero utility in an existing styles file)
- `components/home/HomeStatusHero.tsx`
- `components/home/HomeHeaderGreeting.tsx`
- `components/home/HomeHeaderActions.tsx`
- `components/home/HomeSectionHeader.tsx`
- `components/home/HomeTodaySection.tsx`
- `components/home/HomeDailyCard.tsx`
- `components/home/HomeWordOfDayCard.tsx`
- `components/home/HomeAiPracticeCard.tsx`
- `components/home/HomeStreakCard.tsx`
- `components/home/HomeQuickActionCard.tsx`
- `components/home/HomeReviewsSection.tsx` (+ review cards / Core1000 as needed)
- `components/home/HomeLearnSection.tsx` (+ mini-lesson / discovery cards as needed)
- `components/home/HomeMobileView.tsx`

Exact file list may shrink if a component already meets checklist.

## Done criteria

- [ ] No font-size one-offs outside the type scale in home components touched
- [ ] No static inline styles for color/gradient on home
- [ ] Clickable cards have press feedback; icon controls meet hit-area floors
- [ ] Daily card reads as visually dominant vs Today sidebar
- [ ] Headings use `text-balance` where multi-line; live numbers use `tabular-nums`
- [ ] Palette / `--hue` system unchanged
- [ ] Existing home tests still pass; no new business logic

## Non-goals (explicit)

- New home sections or IA changes
- New color tokens beyond optional shadow/outline helpers that reference existing neutrals
- Motion redesign (GSAP timelines, etc.)—only CSS transition polish per `better-ui`

## Next step

Write an implementation plan (`writing-plans`) and execute in the work order above.
