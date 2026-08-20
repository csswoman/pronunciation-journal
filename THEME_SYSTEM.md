# OKLCH Dynamic Theme System

## Architecture

4-layer system. Each layer has a different role:

```
1. Primary Scale      — hue-base (user slider), full 50–800 range (brand identity)
2. Split accents      — accent-1 (+150°) editorial · accent-2 (+210°) progress
3. Neutral System     — near-neutral, hue-aware surfaces (layout structure)
4. Semantic Colors    — fixed hues for correctness feedback (independent of --hue)
```

---

## Layer 1: Primary Scale (Dynamic Identity)

A full scale derived from the single `--hue` variable (0–360), aliased as `--hue-base`. Hue persists in `localStorage` as `theme-hue`.

Muddy mustard / yellow-green bands (≈55–110°) raise `--chroma-boost-base` and a small `--l-shift-base` via `useOKLCHTheme` / `THEME_INIT_SCRIPT` so mid tones do not look lodoso.

```css
--hue-base: var(--hue);
--primary-50  → oklch(… chroma×boost  var(--hue-base))
…
--primary-800 → …
```

`--primary` is an alias, not a fixed step: light mode maps it to
`--primary-700`; dark mode maps it to `--primary-500`. Consume the alias (or a
semantic utility generated from it), never a numbered step, in product UI.

---

## Layer 1b: Split-complementary accents

| Token | Formula | Role on Home |
|-------|---------|--------------|
| `--hue-accent-1` | `hueBase + 150` (mod 360) | Editorial content (Palabra / Chunk del día) |
| `--hue-accent-2` | `hueBase + 210` (mod 360) | Progress / success texture (plan bar, Hecho, streak) |

Each accent has a full 50–800 scale (`--accent-1-*`, `--accent-2-*`) plus aliases `--accent-1`, `--accent-1-soft`, `--accent-2`, `--accent-2-soft`.

**Home role mapping**

| UI | Token |
|----|-------|
| Nav activa, marca, un CTA sólido por vista (`Empieza aquí` / review due) | `--primary` (hue-base) |
| Cards editoriales | `--accent-1-soft` wash + `--accent-1` ink on the highlighted word |
| Barra Plan de hoy, badge Hecho, streak en plan done | `--accent-2` |
| Correctness in exercises | fixed `--success` / `--error` (unchanged) |

Legacy near-analog tokens (`--accent-analog-*`, `--accent-complement`) remain for older utilities; prefer the split-complementary scales for new UI.

---

## Layer 2: Neutral System (Colorless Structure)

Surfaces use very low chroma and inherit `--hue`; this keeps a user-selected theme coherent without turning the canvas into a color wash.

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `oklch(0.965 0.003 var(--hue))` | `oklch(0.120 0.003 var(--hue))` |
| `--bg-secondary` | `oklch(0.995 0.001 var(--hue))` | `oklch(0.165 0.003 var(--hue))` |
| `--bg-tertiary` | `oklch(0.940 0.005 var(--hue))` | `oklch(0.210 0.004 var(--hue))` |
| `--fg` | `oklch(0.18 0.008 var(--hue))` | `oklch(0.95 0.003 var(--hue))` |
| `--text-primary` | `oklch(0.18 0.008 var(--hue))` | `oklch(0.93 0.004 var(--hue))` |
| `--text-secondary` | `oklch(0.40 0.006 var(--hue))` | `oklch(0.65 0.004 var(--hue))` |
| `--text-tertiary` | `oklch(0.49 0.005 var(--hue))` | `oklch(0.56 0.003 var(--hue))` |
| `--border` | `oklch(0.88 0 0)` | `oklch(0.28 0 0)` |
| `--border-hover` | `oklch(0.78 0 0)` | `oklch(0.38 0 0)` |

---

## Layer 3: Semantic Colors (Fixed Hues)

These never change with user hue. Convey meaning, not identity.

| Token | Hue | Light value | Use |
|-------|-----|-------------|-----|
| `--success` | 145 | `oklch(0.70 0.16 145)` | Progress, correct answers, streaks |
| `--success-soft` | 145 | `oklch(0.92 0.05 145)` | Success backgrounds |
| `--warning` | 85 | `oklch(0.78 0.17 85)` | Caution, energy low |
| `--warning-soft` | 85 | `oklch(0.95 0.05 85)` | Warning backgrounds |
| `--error` | 25 | `oklch(0.65 0.20 25)` | Wrong answers, errors |
| `--error-soft` | 25 | `oklch(0.93 0.05 25)` | Error backgrounds |
| `--info` | 230 | `oklch(0.70 0.12 230)` | Neutral info, tips |
| `--info-soft` | 230 | `oklch(0.93 0.04 230)` | Info backgrounds |

---

## Color Role Mapping

| UI Element | Token |
|-----------|-------|
| Home solid CTA (`Empieza aquí`, review due) | `--primary` + `--on-primary` |
| Chrome CTA elsewhere (`Button` primary) | `--cta-bg` + `--cta-fg` (ink — still valid outside Home) |
| Session advance (`PillButton` primary) | `--primary` + `--on-primary` |
| Soft badge / selected chip | `--primary-soft` / `--badge-primary-*` |
| Badge variants | `default` (theme) or fixed `success` / `warning` / `error` / `info` / `neutral` |
| Home plan progress segments | `--accent-2` |
| Exercise correctness | `--success` / `--error` (fixed) |
| Streak / plan-done celebration on Home | `--accent-2` |
| Editorial word/chunk | `--accent-1` on the word mark or phrase quote only — never a full-card wash |
| Errors, wrong answers | `--error` |
| Disabled | neutral (`--text-tertiary`) |
| Focus ring | `--focus-ring` |

---

## Interaction States

```css
--primary-hover:  oklch(0.58 0.16 var(--hue))   /* primary-600 */
--primary-active: oklch(0.55 0.17 var(--hue))
--focus-ring:     oklch(0.75 0.12 var(--hue) / 0.4)
```

---

## Utility Classes

### Semantic
```
.text-success / .bg-success / .bg-success-light
.text-warning / .bg-warning / .bg-warning-light
.text-error   / .bg-error   / .bg-error-light
.text-info    / .bg-info    / .bg-info-light
```

### Primary / Accent
```
.bg-gradient-primary       → var(--gradient-primary)
.text-accent-analog        → var(--accent-analog-1)
.bg-accent-analog          → var(--accent-analog-1)
.text-accent-complement    → var(--accent-complement)
```

### Legacy CSS (prefer components)

```
.btn-primary     → same recipe as Button primary (--cta-bg)
.btn-secondary   → same recipe as Button secondary (raised + border)
.btn-soft / .accent-button / .card / .input-themed
```

New UI should use `components/ui/Button` and `components/layout/Card`. Do not
introduce a third outline “secondary”.

---

## Hook: `useOKLCHTheme`

```typescript
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";

const { hue, setHue, resetHue, mode, toggleMode } = useOKLCHTheme();
```

Persists `theme-hue` (0–360) and `theme-mode` (`"light"` | `"dark"`) in localStorage. Inline script in `layout.tsx` applies both before hydration to prevent flash.

---

## Browser Compatibility

- OKLCH: Chrome 111+, Firefox 113+, Safari 16.4+
- CSS variables: all modern browsers
- `oklch(L C H / alpha)` syntax: same support as OKLCH
