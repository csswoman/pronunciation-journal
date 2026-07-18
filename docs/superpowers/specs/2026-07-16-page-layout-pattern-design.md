# Page Layout Pattern — Canonical Authenticated Shell

**Date:** 2026-07-16  
**Status:** Draft — awaiting user review before implementation plan  
**Related:** `2026-07-16-home-redesign-design.md`, `2026-07-16-home-hierarchy-critique-design.md`  
**Approach:** A — document canonical page pattern + shared shell contract; migrate all sidebar routes after docs land  
**Skills:** `/brainstorming`, `/impeccable` (product register)

## Goal

Freeze the **page layout pattern** proven on Home as the mandatory shell for every authenticated route in the sidebar menu. Patterns only — not a new token system. Configurable theme (`--hue`), spacing scale, and fonts must keep working when the user changes preferences.

## Decisions (user-validated)

| Decision | Choice |
| --- | --- |
| What to freeze first | Layout patterns (header, density, CTAs, kickers, cards) — not tokens |
| Home vs other pages | Home is the **mandatory** template for structure and rules |
| Immersive practice sessions | Same AppShell + page header (compact). Chrome does **not** disappear |
| First-pass scope | All sidebar routes except Admin |
| Theme/spacing/fonts | Consume semantic tokens only; never hardcode Home-specific px/hex/fonts |
| Docs before code | Spec + `DESIGN.md` / `PRODUCT.md` first; component migration in a later plan |

## Problem

`AppShell` (sidebar + main) is shared, but pages diverge under it:

- `PageLayout` still offers a full-page card wrapper vs Home’s open canvas
- Headers are reinvented per route (`PageIntro`, `WordsHero`, ad-hoc eyebrows, Fraunces on chrome)
- CTA weight, spacing rhythm (`gap-7`, etc.), and language mix without a single rule
- `PRODUCT.md` still says sessions should have “no chrome,” which contradicts the approved shell rule

## Constraints

### In scope (docs phase)

- Spec (this file)
- `DESIGN.md` section: Page Layout Pattern
- `PRODUCT.md` update: session principle aligned with persistent AppShell
- Contract for `PageLayout` + `PageHeader` (API shape; implementation later)

### In scope (implementation phase — later plan)

- Harden `PageLayout` / `PageHeader` to the contract
- Migrate all sidebar hubs and their child/session routes:
  - Practice: Sound Lab, Essential Words (+ sessions)
  - Learn: Ruta (Courses), Decks, Mini Lessons (+ detail)
  - Reference: IPA Chart, Words
  - Tracking: Review, Progress

### Out of scope

- Admin / Seed Data
- New color/spacing/font tokens or palette redesign
- Product logic (SRS, Gemini, queries)
- Per-page visual “delight” beyond conforming to the pattern
- Full i18n framework

## Architecture

### Hierarchy (every authenticated page)

```
AppShell                    ← always on (sidebar desktop / BottomNav mobile)
└─ PageLayout               ← canonical gutters + vertical rhythm; NO page card-wrapper
   ├─ PageHeader            ← kicker? → title → subtitle? → actions?
   └─ Content               ← page-owned columns/sections; same visual vocabulary
```

### AppShell

- Sidebar 256px desktop; bottom nav mobile
- Theme/hue/font/spacing preferences inherited globally
- **No route may hide AppShell** for “immersion”
- Sessions may use a narrower content max-width inside main; chrome stays

### PageLayout

- Single canonical mode aligned with Home (`cardWrapper={false}` equivalent)
- Deprecate / stop using full-page card wrapper for sidebar destinations
- Outer padding and max-width via existing layout utilities/tokens only
- Lesson/session content may tighten inner width; outer shell unchanged

### PageHeader contract

Required anatomy (order fixed):

1. Optional **kicker** (`font-kicker` / system kicker — not ad-hoc `uppercase tracking`)
2. **Title** (DM Sans / UI scale — never Fraunces on page chrome)
3. Optional **subtitle** (Spanish UI chrome)
4. Optional **actions** (primary + secondary)

Variants:

- `default` — hubs and list pages
- `compact` — in-session / detail; same anatomy, less air; optional functional progress

Deprecate for new work:

- `hero-compact` as a distinct chrome language
- Local headers that bypass this contract (`PageIntro`, decorative heroes, Fraunces titles on app chrome)

### CTAs

- One solid primary action per view/zone
- Secondary = outline / ghost / soft (existing button system)
- Do not duplicate the same primary CTA on sibling cards

### Sections & cards

- Flat sections by default
- Cards only for interactive units (clickable row, stateful widget, step list)
- Nested cards prohibited (already in DESIGN.md)
- No decorative icons that only repeat the label
- Vertical rhythm via spacing tokens (`gap-3` / `gap-4` / `gap-6`); avoid one-off gaps like `gap-7`

### Language (chrome vs content)

| Layer | Language |
| --- | --- |
| UI chrome (labels, subtitles, states, empty states) | Spanish |
| Learning content (lemmas, IPA, lesson titles when teaching English) | English allowed |
| Same phrase | No Spanglish mix |

Aligns with home hierarchy language rule.

### Theme preservation

Patterns reference Tailwind semantic utilities / CSS variables only (`bg-surface-raised`, `text-fg`, `font-kicker`, spacing scale, `--hue`). Changing theme preferences must retheme every migrated page without per-page rewrites.

## COMPONENT / API sketch (implementation later)

```tsx
// Planned structure:
// <AppShell>
//   <PageLayout>
//     <PageHeader
//       kicker?
//       title
//       subtitle?
//       primaryAction?
//       secondaryAction?
//       compact?
//       progress?          // compact sessions only, functional
//     />
//     {children}
//   </PageLayout>
// </AppShell>
```

Props stay ≤8 where possible; compose actions rather than expanding the surface.

## Migration order (preview)

1. Docs land (this phase)
2. `PageLayout` + `PageHeader` hardened to contract
3. Sidebar hubs (Sound Lab, Essential Words, Ruta, Decks, Mini Lessons, IPA, Words, Review, Progress)
4. Child / session routes with `compact` header

## Success criteria

- [ ] `DESIGN.md` documents Page Layout Pattern
- [ ] `PRODUCT.md` no longer requires “no chrome” in sessions
- [ ] Spec reviewed and approved by user
- [ ] Later: every in-scope route uses `PageLayout` + `PageHeader` contract
- [ ] Later: checklist per page — shell, one primary CTA, Spanish chrome, no nested page cards, tokens only
- [ ] Later: changing `--hue` / spacing / font prefs still applies globally

## Non-goals reminder

This is not a redesign of Home. Home is the **source of truth**. Other pages conform to it.
