# Home Redesign — Notebook Command Center

**Date:** 2026-07-16  
**Status:** Approved for planning  
**Supersedes:** `2026-07-16-home-visual-hardening-design.md` (polish-only scope; this spec includes IA + typography system)  
**Skills applied:** `better-ui`, `better-typography`, brainstorming visual companion  
**Approach:** B — recompose with existing components; no new queries

## Goal

Redesign the authenticated home so it feels like a personal pronunciation notebook: advance, save, review, and practice — not an empty “AI loop” dashboard. The home should surface meaningful progress (Core 1000, weak sounds, word of day, AI practice) with clear hierarchy, readable type, and intentional spacing — while respecting the existing color token system.

## Product intent (user-validated)

- **Primary job:** Center of the day — daily plan + review + light discovery
- **Feel:** Cuaderno vivo; progress is felt, not just counted (aligns with `PRODUCT.md`)
- **Pain today:** Vacío visual, letra pequeña, espacio desperdiciado, Fraunces/italic “editorial AI”, solo el color se respeta
- **Mobile:** Keep current flow identity (daily plan + Quick Access); improve structure and typography, do not remove Quick Access

## Constraints

### In scope

- Desktop: new home shell (Notebook Command Center layout)
- Mobile: reordered stack + typography; Quick Access block retained (2 primary + 4 secondary)
- Global typography tokens + migration rules (`tokens.css`, `theme.css`, `DESIGN.md`)
- Home components under `components/home/*` (new shell + restyle existing cards)
- Minimal CSS in `app/styles/utilities.css` for home shell utilities
- Sidebar/chrome typography alignment only where home tokens are reused (no full app rewrite in this PR)

### Out of scope

- New Supabase queries or hooks
- Replacing Fraunces app-wide in one PR (courses, assessment, auth panels stay until later waves)
- Rewriting `course-path.css` or other domain CSS files
- Landing/marketing pages
- BottomNav structure changes

## Architecture

### Desktop shell (top → bottom)

```
HomeLayout
├─ HomeUtilityBar          ← new: mono metadata line + optional streak + short CTA
├─ HomeReviewBanner        ← new: compact due strip; hidden when total due = 0
└─ HomeCommandGrid         ← new: split ~1.45fr / 0.9fr
   ├─ Left column
   │  ├─ HomeDailyCard     ← existing; restyle as primary surface
   │  └─ HomeLearnRow      ← new: mini-lesson + concept as compact row under plan
   └─ Right column (stack gap-3)
      ├─ Core1000ProgressCard
      ├─ WeakSoundCard     ← slimmed from ReviewProgressCard (phoneme focus)
      ├─ HomeWordOfDayCard
      └─ HomeAiPracticeCard
```

### Removed from home (desktop)

- `HomeStatusHero` (large greeting hero)
- Numbered sections `01 / 02 / 03` via `HomeSectionHeader`
- `HomeTodaySection`, `HomeReviewsSection`, `HomeLearnSection` as separate sections
- `HomeStreakCard` / `HomeGoalRing` as large sidebar cards (streak → utility bar metadata; goal ring deferred or compact inline later)
- `ReviewQueueIsland` as large island (due count lives in `HomeReviewBanner`)

### Mobile stack (restructured, same features)

1. `HomeUtilityBar` (discreet greeting + streak)
2. `HomeReviewBanner` (if due > 0)
3. `HomeDailyCard` (unchanged role — user likes this block)
4. Progress row: Core 1000 + weak sound (2-column)
5. Quick Access (unchanged pattern: Practice sounds + Continue course + 4-icon grid)

Word of Day and AI practice may appear below progress row or inside plan column on mobile if space allows; prefer not to push Quick Access below the fold.

### Data flow

No changes to `app/(authenticated)/page.tsx` fetch surface. Existing props:

| Prop | Consumer |
| --- | --- |
| `streak` | `HomeUtilityBar` |
| `reviewQueue`, `wordsDueCount`, `soundsDueCount` | `HomeReviewBanner` |
| `conceptLesson` | `HomeDailyCard` |
| `todaysLesson`, `todaysConcept` | `HomeLearnRow` |
| `weakestPhoneme` | `WeakSoundCard` |
| `vocabularyProgress` | optional compact hint in banner or Core card |
| `dailyGoal` | optional one-line in utility bar (not a large ring card) |

## Visual direction

### Layout — Notebook Command Center

- **Left:** Work surface (daily plan + integrated learn)
- **Right:** Progress and opportunity stack (Core, sound, word, AI)
- **Top:** Review urgency as banner, not a full section
- **Greeting:** One line, not a hero; no multi-line editorial title

### Typography — Notebook Utility (global system, home first)

| Role | Family | Size | Notes |
| --- | --- | --- | --- |
| Body default | DM Sans | 16px (`1rem`) | Reading floor |
| Body secondary | DM Sans | 15px (`0.9375rem`) | Replaces abuse of `body-sm` for primary copy |
| Body dense | DM Sans | 14px (`0.875rem`) | Lists only |
| Label / caption | DM Sans | 13px (`0.8125rem`) | UI minimum |
| Kicker / metadata | DM Mono | 12–13px | `REVIEW`, `TODAY`, date · time · name |
| H1–H4 | DM Sans | per scale | No Fraunces italic on home chrome |
| Display IPA/word | DM Sans or mono | existing display tokens | Serif optional only inside content, not chrome |

**Floors (anti small text):**

- UI text MUST NOT go below **12px** (0.75rem)
- Deprecate `font-tiny` / `text-xxs` for new UI; migrate home off them
- `font-caption` token bumps to **13px** in global tokens (breaking but intentional)
- No `text-[Npx]` one-offs in touched home files

**Fraunces policy:**

- Home: **zero** `font-editorial`, `font-display`, Fraunces italic on greeting, section headers, card titles
- App-wide: Fraunces remains loaded; other routes migrate in later waves per migration plan

### Spacing & surfaces

- Compact vertical rhythm: `space-4`–`space-5` between major blocks, not `space-12`–`space-16`
- Left plan card: `border-subtle` + `shadow-sm` (primary surface)
- Right stack: border-only cards, quieter depth
- Concentric radii: outer `rounded-xl`; inner chips = outer − padding
- Press: `active:scale-[0.96]` + `transition-transform` on clickable cards; never `transition-all`
- Hit areas: ≥ 40×40 desktop, ≥ 44×44 touch on icon controls

### Color

- No changes to `--hue`, primary generation, semantic hues, or dark-mode L mapping
- Contrast fixes via lightness only if a pairing fails WCAG/APCA

## Global typography migration (Approach C)

### Phase 0 — Tokens (this PR)

- Update `app/styles/theme.css` and `app/styles/tokens.css` with revised scale and semantic roles
- Document rules in `DESIGN.md` (body 16px, UI min 13px, mono kickers)
- Add `font-kicker` utility if needed (`DM Mono`, uppercase/tracking)

### Phase 1 — Home (this PR)

- All `components/home/*` touched files use semantic tokens only
- Remove Fraunces from home chrome

### Phase 2+ — Later PRs

- Shell: `Sidebar`, `PageLayout` headers
- Practice flows, courses (`course-path.css` has many hardcoded px)
- ESLint or grep check in CI for `text-\[` / `font-size: 10px` in `components/`

## Component notes

### `HomeUtilityBar` (new)

- Single row: `date · time-of-day · firstName` in mono; optional `🔥 N` streak; right-aligned short CTA (e.g. Continue → from `HomeHeaderActions` logic)
- No `home-intro-title` clamp hero; max height ~40px padding included

### `HomeReviewBanner` (new)

- Shows when `wordsDueCount + soundsDueCount > 0`
- Copy: `N due · X words · Y sounds` + CTA → `/words?tab=review` or `/practice/review`
- Compact height; `REVIEW` kicker in mono

### `HomeLearnRow` (new)

- Horizontal or 2-up compact cards below daily plan
- Surfaces `todaysLesson` and `todaysConcept`; fallback links to `/mini-lessons` and deck discovery
- Replaces standalone `HomeLearnSection`

### `WeakSoundCard` (derived)

- Extract weakest phoneme display from `ReviewProgressCard`; drop vocabulary hero from home right column (vocabulary progress not in user’s top-4)

### Existing cards — restyle checklist

- [ ] `HomeDailyCard` — primary surface, larger step titles (body-md / h4), mono step labels
- [ ] `Core1000ProgressCard` — kicker `CORE`, progress bar readable
- [ ] `HomeWordOfDayCard` — kicker `WORD`; word display sans or mono, not Fraunces display
- [ ] `HomeAiPracticeCard` — kicker `AI`; CTA prominent
- [ ] `HomeMobileView` — adopt stack order; Quick Access block with mono section label

## Error & empty states

| State | Behavior |
| --- | --- |
| Review banner | Hidden when due = 0 |
| Daily plan loading | Keep existing skeleton |
| Daily plan error | Keep retry button |
| Weak sound / Core / Word / AI | Short empty copy or hide card; no large blank panels |
| Anonymous user | Utility bar shows Guest; cards degrade gracefully |

## Testing

- Existing: `ReviewQueueCard.test.tsx`, `ReviewProgressCard.test.tsx` — update if props/split changes
- Add: render test for `HomeReviewBanner` visibility (due 0 vs > 0)
- Manual: desktop first viewport shows plan + 4 right cards without scroll on 1280px
- Manual: mobile Quick Access still reachable without excessive scroll
- `pnpm type-check` + `pnpm test` on touched files

## Done criteria

- [ ] Desktop home uses new shell; no numbered sections 01/02/03
- [ ] Greeting is one discreet utility line
- [ ] Review banner when due; hidden otherwise
- [ ] Learn integrated under daily plan (no separate Learn section)
- [ ] Right column: Core, weak sound, Word of Day, AI (no review island)
- [ ] Home has no Fraunces on chrome
- [ ] Global type tokens updated; caption ≥ 13px; no UI < 12px in home
- [ ] Mobile: reordered stack + Quick Access retained
- [ ] Color palette / `--hue` unchanged
- [ ] No new queries; offline mode unaffected

## Non-goals

- Gamified hero metrics dashboard
- Magazine/feed layout (option C from brainstorming)
- Removing Quick Access on mobile
- Full-app Fraunces removal in one PR

## Next step

Invoke `writing-plans` to produce an implementation plan with file-by-file tasks and migration order (Phase 0 tokens → Phase 1 home shell → card restyles → mobile → tests).
