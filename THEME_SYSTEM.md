# OKLCH Dynamic Theme System

## Architecture

3-layer system. Each layer has a different role:

```
1. Primary Scale  — dynamic hue, full 50–800 range (brand identity)
2. Neutral System — near-neutral, hue-aware surfaces (layout structure)
3. Semantic Colors — fixed hues, independent of user hue (feedback)
```

---

## Layer 1: Primary Scale (Dynamic Identity)

A full scale derived from the single `--hue` variable (0–360). Hue persists in `localStorage` as `theme-hue`.

```css
--primary-50  → oklch(0.97 0.02 var(--hue))   /* lightest tint */
--primary-100 → oklch(0.93 0.04 var(--hue))
--primary-200 → oklch(0.88 0.06 var(--hue))
--primary-300 → oklch(0.80 0.10 var(--hue))
--primary-400 → oklch(0.72 0.13 var(--hue))
--primary-500 → oklch(0.65 0.15 var(--hue))   /* light-mode intermediate */
--primary-600 → oklch(0.58 0.16 var(--hue))   /* --primary-hover */
--primary-700 → oklch(0.50 0.17 var(--hue))
--primary-800 → oklch(0.42 0.15 var(--hue))   /* darkest */
```

`--primary` is an alias, not a fixed step: light mode maps it to
`--primary-700`; dark mode maps it to `--primary-500`. Consume the alias (or a
semantic utility generated from it), never a numbered step, in product UI.

**Accent variations** (derived from hue):

| Token | Formula | Use |
|-------|---------|-----|
| `--accent-analog-1` | `hue + 20` | Reserved accent token; do not introduce it decoratively |
| `--accent-analog-2` | `hue - 20` | Reserved accent token; do not introduce it decoratively |
| `--accent-complement` | `hue + 180` | Reserved accent token; do not introduce it decoratively |
| `--gradient-primary` | 135deg, hue → hue+30 | Legacy token; gradients are not part of the current UI language |

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
| Main CTA (`Button` primary) | `--cta-bg` + `--cta-fg` |
| Main CTA hover | `--cta-bg-hover` |
| Brand-colored inline CTA | `--primary` + `--on-primary` |
| Soft badge / pill | `--primary-soft` (`--primary-100`) |
| Informational progress bars | `--primary` or `--accent`, never a hero metric |
| Completed state | `--success` |
| Streak / energy | `--warning` when it conveys a real state |
| Errors, wrong answers | `--error` |
| AI features | `--accent-analog-1` |
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
