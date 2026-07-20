---
name: English Journal
description: A personal pronunciation journal and practice environment for English learners at any level, from beginners to advanced.
colors:
  primary: "var(--primary)"
  primary-hover: "var(--primary-hover)"
  primary-soft: "var(--primary-soft)"
  surface-base: "var(--surface-base)"
  surface-raised: "var(--surface-raised)"
  surface-sunken: "var(--surface-sunken)"
  surface-overlay: "oklch(1 0 0 / 0.92)"
  surface-tooltip: "var(--surface-tooltip)"
  text-primary: "var(--text-primary)"
  text-secondary: "var(--text-secondary)"
  text-tertiary: "var(--text-tertiary)"
  text-disabled: "var(--text-disabled)"
  border-subtle: "var(--border-subtle)"
  border-default: "var(--border-default)"
  border-strong: "var(--border-strong)"
  success: "var(--success)"
  success-soft: "var(--success-soft)"
  warning: "var(--warning)"
  warning-soft: "var(--warning-soft)"
  error: "var(--error)"
  error-soft: "var(--error-soft)"
  info: "var(--info)"
  info-soft: "var(--info-soft)"
  stage-pairs: "var(--stage-pairs)"
  stage-dictation: "var(--stage-dictation)"
  cta-bg: "var(--cta-bg)"
  cta-fg: "var(--cta-fg)"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.625rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.005em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  kicker:
    fontFamily: "DM Mono, Fira Code, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
  mono:
    fontFamily: "DM Mono, Fira Code, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  full: "9999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
  10: "2.5rem"
  12: "3rem"
  16: "4rem"
  20: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.cta-bg}"
    textColor: "{colors.cta-fg}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "var(--cta-bg-hover)"
    textColor: "{colors.cta-fg}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunken}"
  button-soft:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  chip-default:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-selected:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: English Journal

## 1. Overview

**Creative North Star: "The Personal Practice Desk"**

This is a learner's private practice desk, not a product showcase or a metrics dashboard. It opens with the next useful action, then reveals the supporting routes without making them compete. The mood is settled: near-neutral surfaces, unhurried spacing, and no decoration that does not clarify a choice. A beginner and an advanced learner should both feel at home, because the interface does not assume prior knowledge. Phonetic symbols appear naturally alongside plain text, interesting rather than intimidating.

The palette uses near-neutral surfaces with a dynamic primary that follows the learner's active theme. Identity is concentrated in actions and states instead of washing the entire canvas in color. The typography is DM Sans for interface and reading, DM Mono for kickers and technical notation, and Andika for IPA. No decorative serif. The spacing is 8pt, applied with intention: sessions feel spacious, feedback feels close, and the canvas never feels busy.

This system explicitly rejects three anti-references established in PRODUCT.md: Duolingo's infantilizing gamification (cartoonish reward loops, owl mascots, hollow celebrations); the generic SaaS dashboard (navy sidebar, white card grids, blue primary buttons, identical spacing everywhere); and corporate language platforms (Rosetta Stone, Babbel, institutional e-learning shells) with their stiff, joyless, compliance-module energy. A learner opening this app should feel like returning to something that belongs to them, not launching a product.

**Key Characteristics:**
- Warm-neutral surfaces with a hue-tinted primary that feels personal rather than branded
- Quiet by default: flat surfaces at rest, shadow reserved for state changes and elevation
- DM Sans as the workhorse for UI and headings; DM Mono for kickers; Andika for IPA glyphs
- No decorative display serif — phonemes earn presence through size and weight, not a second family
- Semantic color fixed and culturally legible (green = correct, amber = caution, red = error)
- Sound and phonetics are first-class content: IPA characters render in the same font as UI text, with identical clarity
- Entry points that do not require phonetic expertise to begin; depth rewards those who go looking

For operational guidance on color proportion, radius, typography, and visual
personality, see `docs/design/visual-language.md`.

## 2. Colors: The Hue-Tinted Notebook

The palette is neutral-first with a dynamic primary scale. Every surface carries a whisper of the primary hue (chroma 0.003–0.012), making the app feel coherent even as the user's preferred hue shifts. The primary itself is never decorative: it marks interactive elements, active states, and focus rings, and nothing else.

**Token-to-utility mapping.** In code, reference the Tailwind v4 utilities generated from `app/styles/theme.css`, never raw `var(--…)` arbitrary values. The foreground tokens map: `text-primary` → `text-fg`, `text-secondary` → `text-fg-muted`, `text-tertiary` → `text-fg-subtle` (the `fg-` prefix avoids clashing with Tailwind's `text-base` font-size utility). Primary foreground on a filled button is `text-on-primary`, not `text-white`. Surfaces, borders, and primary use their literal names (`bg-surface-raised`, `border-border-subtle`, `bg-primary`).

### Primary
- **Adaptive primary** (`--primary`): The single interactive identity color. Its value is resolved from the active `--hue` and light/dark mode. Use it on colored CTAs, focus rings, active nav items, selected chips, and compact progress.
- **Primary Soft** (`--primary-soft`): Theme-resolved background for soft button variants, selected states, and quiet hover fills. Never use it as decoration.

### Secondary
- **Warm Amber** (`oklch(0.74 0.14 55)`): The stage-pairs accent. Applied to the minimal-pairs practice stage. Fixed; does not shift with `--hue`.
- **Coastal Teal** (`oklch(0.73 0.12 185)`): The stage-dictation accent. Applied to dictation practice stages. Fixed.

### Tertiary
- **Ink Black (CTA)** (`oklch(0.18 0.008 var(--hue))`): The CTA button background. Uses the primary text color so it always-contrasts against the surface, regardless of hue. Not a semantic color; a contrast strategy.

### Neutral
- **Quiet Canvas** (`oklch(0.965 0.003 var(--hue))`): Page background. Near-neutral so the learner's chosen hue does not color-wash the interface.
- **Lifted Paper** (`oklch(0.99 0.003 var(--hue))`): Cards, panels, sidebars. The elevation of choice for raised surfaces.
- **Sunken Stone** (`oklch(0.94 0.01 var(--hue))`): Inputs, code blocks, inset regions. Slightly darker than the page to create recession without contrast.
- **Deep Ink** (`oklch(0.18 0.008 var(--hue))`): Primary text. Near-black with a hair of hue.
- **Faded Ink** (`oklch(0.40 0.006 var(--hue))`): Secondary text, metadata, descriptions.
- **Ghost Ink** (`oklch(0.49 0.005 var(--hue))`): Tertiary text, timestamps, placeholders.
- **Hairline** (`oklch(0.895 0.002 var(--hue))`): Subtle borders, dividers.
- **Standard Rule** (`oklch(0.875 0 0)`): Default card and input borders.
- **Bold Rule** (`oklch(0.720 0 0)`): Emphasized borders, active states.

**The Active Theme Rule.** The primary color is a variable, not a fixed brand color. Code, documentation, and design reference semantic tokens (`--primary`, `--surface-*`, `--text-*`) rather than a hue value or a hardcoded hex. `250` is only the initial fallback in `useOKLCHTheme`; any saved hue and either color mode are equally valid.

**The Semantic Independence Rule.** Success green (hue 145), warning amber (hue 85), error red (hue 25), and info blue (hue 230) are fixed and do not shift with `--hue`. They carry legible cultural meaning. Never apply the primary color to correctness feedback; always use the fixed semantic colors.

**The One Voice Rule.** The primary color appears on interactive affordances only: buttons, links, active states, focus rings. It does not appear on decorative elements, section backgrounds, or progress bars unless those items are directly interactive.

## 3. Typography

**Display / UI Font:** DM Sans (variable weight 300–700, humanist sans-serif, latin + latin-ext)
**Mono / kicker font:** DM Mono (400, 500, latin)
**IPA font:** Andika (`--font-ipa`)

**Character:** DM Sans carries headings, buttons, labels, body, and card titles. DM Mono carries kickers and code. Andika carries IPA glyphs and phonetic transcriptions so those symbols remain legible without turning into decoration. There is no decorative serif in the product.

**UI floor:** 13px minimum (`--font-kicker`, `--font-tiny`). Captions are 14px; labels and compact body copy are 15–16px.

### Hierarchy
- **Display** (DM Sans, 700, `clamp(1.875rem, 4vw, 2.625rem)`, lh 1.2, ls -0.02em): Rare large moments (phoneme heroes). Same family as UI — presence via size/weight, not a serif switch.
- **Headline** (DM Sans, 700, `clamp(1.5rem, 3vw, 2rem)`, lh 1.3, ls -0.01em): Page titles, section headings.
- **Title** (DM Sans, 600, `clamp(1.25rem, 2.5vw, 1.5rem)`, lh 1.4, ls -0.005em): Card headings, widget titles, dialog headers.
- **Body** (DM Sans, 400, 1rem, lh 1.6): All reading content. Max line length 65–75ch.
- **Body Medium** (DM Sans, 400, 1rem/16px, lh 1.55): Secondary card copy, metadata rows, compact descriptions.
- **Body Small** (DM Sans, 400, 0.9375rem, lh 1.5): Secondary descriptions, helper text, list items.
- **Label** (DM Sans, 600, 0.9375rem/15px, lh 1.4): UI labels, button text, input labels.
- **Caption** (DM Sans, 400, 0.875rem/14px, lh 1.5): Timestamps, metadata, footnotes.
- **Kicker** (DM Mono, 500, 0.8125rem/13px, lh 1.4, ls 0.06em): Section overlines, card eyebrows, status metadata.
- **Tiny** (DM Sans, 500, 0.8125rem/13px, lh 1.4): Legacy badges and status chips. Absolute UI minimum; prefer caption or kicker for new work.
- **Mono** (DM Mono, 400–700, sizes as needed): Kickers and code snippets.
- **Phoneme** (Andika, sizes as needed): IPA glyphs and phonetic transcriptions.

**The IPA Parity Rule.** IPA symbols render with `font-ipa`/Andika, never in a decorative serif or system fallback. Use DM Mono only for code or an explicitly monospaced notation context.

**The Scale Contract Rule.** Adjacent hierarchy steps must differ by at least 1.25× in font size or 100 in weight. Flat scales look like accidents.

## 4. Elevation

The system uses tonal layering for structure and shadow for state. Surfaces are flat at rest. Shadow appears only when something is hovered, focused, or physically elevated by user action (a draggable card, a dropdown, a modal). This keeps the resting state quiet and lets the learner focus on content, not chrome.

### Surface Layers
Three background levels create the structural hierarchy without shadows:
- **Surface Base** (page background, Quiet Canvas): The canvas.
- **Surface Raised** (cards, panels, sidebars, Lifted Paper): One step lighter than the base; creates visual separation through lightness contrast alone.
- **Surface Sunken** (inputs, code blocks, Sunken Stone): Slightly darker than the base; recession signals editable or contained regions.

### Shadow Vocabulary
- **Ambient** (`0 1px 2px oklch(0 0 0 / 0.05)`): Resting elevation for interactive cards. Whisper-thin; present but not declarative.
- **Lifted** (`0 4px 6px oklch(0 0 0 / 0.07)`): Hover state for interactive cards, focused inputs. Signals responsiveness.
- **Elevated** (`0 10px 15px oklch(0 0 0 / 0.10)`): Dropdowns, date pickers, context menus. Structural separation.
- **Floating** (`0 20px 25px oklch(0 0 0 / 0.10)`): Modals, side panels, command palette. Maximum separation.
- **Panel Edge** (`-4px 0 24px color-mix(in oklch, var(--fg) 6%, transparent)`): AI coach side panel edge shadow.

**The Flat-by-Default Rule.** A surface at rest has no shadow or only Ambient. Shadow is a response to state (hover, open, focus), not a decoration. If a surface always has a heavy shadow, the shadow has lost its meaning.

## 5. Components

### Buttons

**Character:** Confident, undecorated, responsive. The primary action button uses ink-on-parchment contrast rather than a colored fill; this keeps the palette restrained and respects the One Voice Rule.

- **Shape:** Gently curved (12px radius, `--radius-md`)
- **Primary (CTA):** Dark ink background (`oklch(0.18 0.008 var(--hue))`), warm parchment text. Padding 10px 20px. Hover: slightly lighter dark (`oklch(0.26 0.008 var(--hue))`), `translateY(-1px)`, Lifted shadow.
- **Secondary:** Surface-raised background, primary text. Hover: sunken background. Used for subordinate actions.
- **Soft:** Primary-soft background, primary text. Used for contextual confirm actions that should read as "on-brand" but not dominant.
- **Ghost:** Transparent background, secondary-fg text. Hover: surface-raised fill. Used for tertiary or nav-embedded actions.
- **Transitions:** 150ms standard easing (`cubic-bezier(0.4, 0, 0.2, 1)`) for color and shadow. 200ms for transform.
- **Focus:** `--focus-ring` outline (primary at 40% opacity, 2px offset).

The standard `<Button>` (`components/ui/Button.tsx`) covers form, dialog, and toolbar actions at `rounded-sm`/`rounded-md`. Two pill-shaped siblings handle the lighter in-session affordances:

- **`PillButton`** (`components/ui/PillButton.tsx`): fully-rounded action button for practice/session flows. Variants `primary` (filled CTA, advance the session), `outline` (bordered quiet secondary), `quiet` (text-only, lowest emphasis, e.g. archive/dismiss). Sizes `sm`/`md`. Flat at rest, focus-ring and `ease-out-quart` color transition built in. Reach for this, not a hand-rolled `<button className="rounded-full …">`, inside a session.
- **`ListenButton`** (`components/ui/ListenButton.tsx`): audio-playback affordance built on `PillButton`. `Volume2` icon + optional label (`labeled`, default) or a compact `iconOnly` round control for tight rows. Auto-disables where speech synthesis is unavailable, so callers don't repeat the TTS guard. Use for every "play the model" control.

### Chips / Tags

- **Style:** Pill-shaped (`--radius-full`), subtle border, small padding (4px 12px).
- **Default state:** Surface-raised background, text-secondary text, subtle border.
- **Selected state:** Primary-soft background, primary text, no border needed.
- **Word feedback chips:** Use semantic colors exclusively (success/warning/error). Never primary.

### Cards / Containers

- **Corner Style:** 12px (`--radius-md`) for standard cards; 16px (`--radius-lg`) for hero-sized content.
- **Background:** Surface-raised (Lifted Paper). Never surface-base (would disappear).
- **Shadow Strategy:** Ambient at rest (`--shadow-sm`). Lifted on hover (`--shadow-md`) for interactive cards. Static content cards: no shadow.
- **Border:** Subtle border (`--border-subtle`) on cards that sit directly on surface-base. No border when cards sit inside a panel with its own background.
- **Internal Padding:** 16–24px (`--space-4` to `--space-6`). Vary by content density.
- **Nested cards are prohibited.** A card inside a card has failed to decompose the design.

### Inputs / Fields

- **Style:** Sunken background (surface-sunken), standard border (`--border-default`), 8px radius (`--radius-sm`).
- **Focus:** Border shifts to primary (`--border-focus`), shadow becomes Lifted with primary tint. No glow rings.
- **Error:** Border shifts to error red (`--error-border`), helper text in error color.
- **Disabled:** fg-disabled text, border-subtle, cursor not-allowed. No background change.
- **Placeholder:** fg-placeholder (same token as fg-disabled).

### Navigation

- **App shell:** Fixed sidebar (256px desktop), bottom navigation bar (mobile). Tab bar is flat, no elevation. Always present on authenticated routes, including practice sessions — immersion narrows content, it does not hide chrome.
- **Nav items:** Ghost-style at rest (transparent bg, text-secondary text). Active state: primary-soft background, primary text, 8px radius.
- **Hover:** Surface-raised fill, text-primary text, 150ms transition.
- **Typography:** Label scale (DM Sans 600, 0.9375rem / 15px).

### Home Command Center (reference composition)

Home is the clearest expression of the product language. It is a command center for today's learning, not a landing-page hero and not a dashboard of equal widgets.

```
Greeting + quiet retention
Review due (only when actionable)
Plan of today                       Suggested practice
Mini lessons                        Pronunciation / Core 1000 / word
```

- Start with a concise, personal greeting. Show retention only when there is a non-zero useful signal; never manufacture empty stats.
- If review is due, place one full-width review strip before the grid. It owns the primary action until the queue is clear.
- The daily plan is the main working surface. Supporting cards must lead to a real next route, not restate the same action or become metric tiles.
- At desktop, use a flexible main column plus a compact 17–22rem aside. Keep the aside sticky only while it helps scanning; collapse to one column below 768px.
- Keep the Home shell open: maximum content width 80rem, no enclosing page card, and a 20px rhythm between major zones.

### Page Layout Pattern (canonical authenticated page)

Home is the reference composition. Every sidebar destination (hubs and in-session/detail routes) uses the same shell rules. Full implementation history: `docs/superpowers/specs/2026-07-16-page-layout-pattern-design.md`.

**Hierarchy**

```
AppShell → PageLayout → PageHeader → Content
```

**PageLayout**

- Open canvas: no full-page card wrapper around the route.
- Outer gutters and vertical rhythm from layout utilities / spacing tokens only.
- Sessions may use a tighter inner max-width; outer shell unchanged.
- Prefer `cardWrapper={false}` (or equivalent canonical mode). Do not invent per-page outer shells.

**PageHeader**

- Fixed order: optional kicker → title → optional subtitle → optional actions.
- Chrome typography: DM Sans / system scales. IPA glyphs: Andika via `font-ipa`.
- Kicker: `font-kicker` (or system kicker). No ad-hoc `uppercase` + wide tracking eyebrows.
- Subtitles and UI labels: Spanish. Learning content may stay English. No Spanglish inside one phrase.
- Variants: `default` (hubs) and `compact` (sessions/detail, optional functional progress). Do not invent new header languages per route.

**CTAs**

- One solid primary action per view/zone. Secondary = outline / ghost / soft.
- Do not repeat the same primary on sibling cards.
- Review, when due, outranks starting a fresh plan. Otherwise, the plan owns the primary action.
- Prefer direct Spanish verbs that name the destination: `Repasar palabras`, `Abrir laboratorio`, `Explorar cursos`. Do not use vague labels such as `Continuar` when the destination can be named.

**Sections & cards**

- Flat sections by default. Cards only for interactive units (clickable row, stateful widget, step list).
- Nested cards prohibited. No decorative icons that only echo the label.
- Spacing rhythm via tokens (`gap-3` / `gap-4` / `gap-6`). Avoid one-off gaps (`gap-7`).
- A card contains one job: a small preview plus one clear path forward. Use a kicker, title, short supporting copy, and a quiet arrow/text link only when all four improve scanning.
- Progress is supporting texture: compact bars, `tabular-nums`, and level rows. Do not turn counts into a large dashboard metric.

**Theme preservation**

- Patterns consume semantic utilities and CSS variables only (`bg-surface-*`, `text-fg*`, `font-*`, spacing scale, `--hue`).
- User changes to hue or color mode must retheme every conforming page without local hardcodes. Spacing and font tokens must remain equally global.

### Phoneme Cards (Signature Component)

The IPA phoneme card is the most distinctive component in the system. It surfaces a phoneme symbol, its description, and audio/practice affordances.

- **Symbol:** DM Mono, large (clamp 2.5rem–4rem), bold. The phoneme is the hero via size, not a serif.
- **Background:** Surface-raised with a subtle primary-soft bleed at one edge (not a stripe; a wash).
- **Stage accent:** When inside a minimal-pairs context, the card uses the stage-pairs amber as its wash; inside dictation, stage-dictation teal.
- **Actions:** Ghost buttons for audio playback; primary button for practice entry.
- **Correct/incorrect feedback:** Semantic color fills replace the card background briefly, then fade. Never a stripe.

### Score / Accuracy Display

- **Excellent (≥85%):** Success green, success-soft background.
- **Acceptable (60–84%):** Warning amber, warning-soft background.
- **Poor (<60%):** Error red, error-soft background.
- **Format:** A percentage with a label ("Excellent", "Keep practicing"). Never a hero-metric layout. No big number with gradient accent.

## 6. Do's and Don'ts

### Do:
- **Do** use `--hue` and `--primary` in code. Never hardcode a hex for the primary color; the system is hue-agnostic by design.
- **Do** reserve the primary color for interactive affordances only: buttons, links, active nav items, focus rings, selected chips.
- **Do** use semantic colors (success/warning/error/info) for all correctness and feedback signals. These are fixed and must not shift with `--hue`.
- **Do** vary spacing for rhythm. Sections that breathe differently feel intentional; uniform padding feels like a template.
- **Do** use Andika via `font-ipa` for IPA glyphs and phonetic blocks. Presence comes via size/weight — never a decorative serif.
- **Do** use the canonical Page Layout Pattern (`AppShell` → `PageLayout` → `PageHeader` → content) on authenticated sidebar routes, including sessions (compact header).
- **Do** keep UI chrome copy in Spanish; reserve English for learning content.
- **Do** include `prefers-reduced-motion` media queries for any animation longer than 100ms.
- **Do** use DM Sans with latin-ext subset for all IPA and phonetic text. Never let it fall back to system fonts.
- **Do** pair color feedback with an icon or label. Color alone must never be the only signal for correctness.

### Don't:
- **Don't** use Duolingo-style gamification patterns: confetti floods, character mascots, hollow streak celebrations, sound effects on every tap. This app respects learners as adults.
- **Don't** build generic SaaS dashboard layouts: navy sidebar with white card grids and identical spacing everywhere. Every surface should feel considered, not templated.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards, callouts, or list items. Use background tints, full borders, or icons instead.
- **Don't** use gradient text (`background-clip: text`). Emphasis through weight or size; never decorative gradients.
- **Don't** put the primary color on progress bars, decorative blobs, or section backgrounds that are not interactive.
- **Don't** nest cards inside cards. Decompose the design instead.
- **Don't** wrap an entire page in a single card and then nest more cards inside.
- **Don't** hide AppShell or invent a chrome-less mode for practice sessions.
- **Don't** rebuild page headers per route (`PageIntro`, hero eyebrows, custom title fonts) outside the `PageHeader` contract.
- **Don't** load or use Fraunces (or any decorative serif) — the product is DM Sans + DM Mono only.
- **Don't** use modal dialogs as a first response to user actions. Exhaust inline patterns, progressive disclosure, and side panels before reaching for a modal.
- **Don't** use hero-metric layouts (big number, small label, gradient accent) for any scoring or progress surface. Progress is felt through texture, not counted in a SaaS dashboard widget.
- **Don't** hardcode colors in components. All color values must reference design tokens via `var(--token-name)` or Tailwind utility classes that map to tokens.
- **Don't** use glassmorphism decoratively (blur + semi-transparent card as a default aesthetic). If backdrop-filter is used, it must serve a specific functional purpose.
