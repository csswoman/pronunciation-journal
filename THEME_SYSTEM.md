# OKLCH Dynamic Theme System

## Architecture

3-layer system. Each layer has a different role:

```
1. Primary Scale  — dynamic hue, full 50–800 range (brand identity)
2. Neutral System — chroma 0, colorless (layout structure)
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
--primary-500 → oklch(0.65 0.15 var(--hue))   /* --primary (base) */
--primary-600 → oklch(0.58 0.16 var(--hue))   /* --primary-hover */
--primary-700 → oklch(0.50 0.17 var(--hue))
--primary-800 → oklch(0.42 0.15 var(--hue))   /* darkest */
```

**Accent variations** (derived from hue):

| Token | Formula | Use |
|-------|---------|-----|
| `--accent-analog-1` | `hue + 20` | AI features, secondary highlights |
| `--accent-analog-2` | `hue - 20` | Subtle variation |
| `--accent-complement` | `hue + 180` | High-contrast contrast elements |
| `--gradient-primary` | 135deg, hue → hue+30 | CTA buttons, hero sections |

---

## Layer 2: Neutral System (Colorless Structure)

Chroma is 0 — neutrals never tint. Stable across all hue values.

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `oklch(0.98 0 0)` | `oklch(0.12 0 0)` |
| `--bg-secondary` | `oklch(0.96 0 0)` | `oklch(0.17 0 0)` |
| `--bg-tertiary` | `oklch(0.93 0 0)` | `oklch(0.22 0 0)` |
| `--fg` | `oklch(0.20 0 0)` | `oklch(0.95 0 0)` |
| `--text-primary` | `oklch(0.20 0 0)` | `oklch(0.92 0 0)` |
| `--text-secondary` | `oklch(0.45 0 0)` | `oklch(0.65 0 0)` |
| `--text-tertiary` | `oklch(0.65 0 0)` | `oklch(0.48 0 0)` |
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
| Primary Button | `--primary` (`--primary-500`) |
| Button hover | `--primary-hover` (`--primary-600`) |
| Button active | `--primary-active` |
| Soft badge / pill | `--primary-soft` (`--primary-100`) |
| Progress bars | `--success` |
| Streak / energy | `--warning` |
| Errors, wrong answers | `--error` |
| AI features | `--accent-analog-1` |
| Hero / CTA gradient | `--gradient-primary` |
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

### Legacy (still valid)
```
.btn-primary / .btn-secondary / .btn-soft
.badge-primary / .badge-secondary / .badge-accent
.accent-button / .accent-bg / .accent-text / .accent-border / .accent-ring
.card / .card-dark / .input-themed
```

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
