# Design System — English Journal

> Mapa de referencia del sistema de diseño. Última revisión: 2026-05-07.
> Fuentes de verdad: `app/globals.css`, `scripts/lint-design-tokens.mjs`.
> `lib/design-tokens.ts` fue **eliminado** en esta rama — los tokens viven en CSS y `@theme inline`.

---

## Índice

1. [Sistema OKLCH](#1-sistema-oklch)
2. [Variables CSS por categoría](#2-variables-css-por-categoría)
3. [Temas preset](#3-temas-preset)
4. [Integración Tailwind @theme](#4-integración-tailwind-theme)
5. [Clases utilitarias globales](#5-clases-utilitarias-globales)
6. [Enforcement: linter de tokens](#6-enforcement-linter-de-tokens)
7. [Lo que falta por implementar](#7-lo-que-falta-por-implementar)
8. [Enforcement Log](#8-enforcement-log)

---

## 1. Sistema OKLCH

### Cómo funciona

El sistema de color primario es completamente dinámico. Una sola variable controla toda la paleta:

```css
--hue: 250; /* valor por defecto; rango 0–360° */
```

El usuario puede cambiar este valor en runtime (persistido en `localStorage`). Al modificarlo, **todos** los `--primary-*` se recalculan automáticamente porque usan `var(--hue)` en su definición OKLCH:

```
oklch( lightness  chroma  hue )
         ↑          ↑      ↑
        fijo       fijo  dinámico
```

### Por qué OKLCH y no HSL

OKLCH es perceptualmente uniforme: cambiar el hue no afecta la luminosidad percibida. Con HSL, `hsl(60, 80%, 50%)` (amarillo) parece mucho más brillante que `hsl(250, 80%, 50%)` (azul) aunque ambos tengan `L: 50%`. Con OKLCH esto no ocurre.

### Escala primaria completa

| Token | Light (L/C) | Dark (L/C) | Uso principal |
|-------|-------------|------------|---------------|
| `--primary-50` | 0.97 / 0.02 | 0.18 / 0.03 | Fondos muy suaves, hover de items |
| `--primary-100` | 0.93 / 0.04 | 0.22 / 0.05 | `--primary-soft` — badges, chips suaves |
| `--primary-200` | 0.88 / 0.06 | 0.28 / 0.07 | Bordes de elementos activos |
| `--primary-300` | 0.80 / 0.10 | 0.35 / 0.09 | Íconos decorativos |
| `--primary-400` | 0.72 / 0.13 | 0.55 / 0.13 | Estados de hover alternativos |
| `--primary-500` | 0.65 / 0.15 | 0.70 / 0.14 | **`--primary`** — color de acento principal, CTAs |
| `--primary-600` | 0.58 / 0.16 | 0.63 / 0.15 | **`--primary-hover`** — hover de botones |
| `--primary-700` | 0.50 / 0.17 | 0.55 / 0.16 | Texto sobre fondos claros con acento |
| `--primary-800` | 0.42 / 0.15 | 0.46 / 0.14 | Texto de alto contraste sobre acento |

### Aliases de uso frecuente

```css
--primary              → --primary-500   (acento: botones, links, highlights)
--primary-hover        → --primary-600   (hover de botones)
--primary-active       → oklch(0.55 0.17 var(--hue))   (pressed)
--primary-soft         → --primary-100   (fondos suaves, badges)
--primary-foreground   → oklch(1 0 0)    (texto blanco sobre primary)
--on-primary           → oklch(1 0 0)    (alias de primary-foreground)
--focus-ring           → oklch(0.75 0.12 var(--hue) / 0.4)
```

### Variaciones de acento derivadas

```css
--accent-analog-1   → hue + 20°   (color análogo cálido)
--accent-analog-2   → hue - 20°   (color análogo frío)
--accent-complement → hue + 180°  (color complementario)
--gradient-primary  → linear-gradient(135deg, primary, primary +30°)
```

> ⚠️ Definidas pero no usadas en ningún componente. Candidatas a eliminar.

---

## 2. Variables CSS por categoría

### 2.1 Superficies

Se unificó la nomenclatura de superficies con la capa `--surface-*`, manteniendo `--bg*` como alias.

| Variable | Alias | Light | Dark | Uso |
|----------|-------|-------|------|-----|
| `--surface-base` | `--bg` | `#FAF9F7` (warm off-white) | `oklch(0.120 0.003 hue)` | Fondo de página |
| `--surface-raised` | `--bg-secondary` | `oklch(0.962 0.003 80)` | `oklch(0.165 0.003 hue)` | Cards, panels, sidebar |
| `--surface-sunken` | `--bg-tertiary` | `oklch(0.938 0.004 80)` | `oklch(0.210 0.004 hue)` | Inputs, code blocks, inset areas |
| `--surface-overlay` | — | `oklch(1 0 0 / 0.92)` | `oklch(0.165 0.003 hue / 0.96)` | Modals, popovers |
| `--surface-tooltip` | — | `oklch(0.17 0.006 hue)` | `oklch(0.24 0.006 hue)` | Always-dark tooltip bg |
| `--surface-code` | — | `oklch(0.14 0.005 hue)` | `oklch(0.10 0.003 hue)` | Always-dark code blocks |

> `--bg`, `--bg-secondary`, `--bg-tertiary` se mantienen como aliases de backward compatibility.

**Tailwind classes:** `bg-surface-base`, `bg-surface-raised`, `bg-surface-sunken`, `bg-surface-overlay`

### 2.2 Tipografía (foreground)

| Variable | Light | Dark | Tailwind | Uso |
|----------|-------|------|----------|-----|
| `--text-primary` | `oklch(0.18 0.008 hue)` | `oklch(0.93 0.004 hue)` | `text-fg` | Headings, contenido principal |
| `--text-secondary` | `oklch(0.46 0.006 hue)` | `oklch(0.65 0.004 hue)` | `text-fg-muted` | Descripciones, soporte |
| `--text-tertiary` | `oklch(0.62 0.004 hue)` | `oklch(0.48 0.003 hue)` | `text-fg-subtle` | Timestamps, metadata, placeholders |
| `--text-disabled` | `oklch(0.75 0.002 hue)` | `oklch(0.48 0.003 hue)` | `text-fg-disabled` | Elementos deshabilitados |
| `--text-placeholder` | `oklch(0.75 0.002 hue)` | `oklch(0.48 0.003 hue)` | `placeholder:text-fg-placeholder` | Placeholders de inputs |

> ⚠️ **IMPORTANTE:** `text-primary` en Tailwind viene de `--color-primary` (acento). Para texto usa siempre `text-fg`.

**Aliases legacy** (no usar en código nuevo):
```css
--fg                   → --text-primary
--deep-text            → --text-primary
--color-text-primary   → --text-primary
--color-text-secondary → --text-secondary
--btn-content          → --text-primary
```

### 2.3 Bordes

Se unificó la nomenclatura con `--border-*` semántico.

| Variable | Valor light | Valor dark | Tailwind | Uso |
|----------|-------------|------------|----------|-----|
| `--border-subtle` | `oklch(0.925 0 0)` | `oklch(0.220 0 0)` | `border-border-subtle` | Dividers, separadores sutiles |
| `--border-default` | `oklch(0.875 0 0)` | `oklch(0.275 0 0)` | `border-border-default` | Cards, inputs |
| `--border-strong` | `oklch(0.720 0 0)` | `oklch(0.375 0 0)` | `border-border-strong` | Bordes énfaticos, estados activos |
| `--border-focus` | `var(--primary)` | `var(--primary)` | `border-border-focus` | Focus outlines |
| `--border-hover` | `oklch(0.770 0 0)` | `oklch(0.375 0 0)` | — | Hover (alias de border-strong) |

> `--border` sigue siendo válido — es alias de `--border-default`.

### 2.4 Overlays / Transparencias

Tokens para overlays blancos sobre cualquier fondo. Útiles para elementos de glass/frosted.

| Variable | Valor | Tailwind | Uso |
|----------|-------|----------|-----|
| `--overlay-subtle` | `oklch(1 0 0 / 0.05)` | `bg-overlay-subtle` | Fondos muy sutiles |
| `--overlay-weak` | `oklch(1 0 0 / 0.15)` | `bg-overlay-weak` | Muted states |
| `--overlay-light` | `oklch(1 0 0 / 0.20)` | `bg-overlay-light` | Badges, pills |
| `--overlay-medium` | `oklch(1 0 0 / 0.50)` | `bg-overlay-medium` | Texto seleccionado |
| `--overlay-strong` | `oklch(1 0 0 / 0.60)` | `bg-overlay-strong` | Category labels |
| `--overlay-darker` | `oklch(1 0 0 / 0.80)` | `bg-overlay-darker` | Overlay oscuro |

### 2.5 Colores semánticos

Hues fijos — no cambian con el tema del usuario. Cada color tiene variantes `*-soft`, `*-deco`, `*-icon-bg` y `*-value`.

| Variable | Hue | Light | Dark |
|----------|-----|-------|------|
| `--success` | 145° (verde) | `oklch(0.70 0.16 145)` | `oklch(0.74 0.16 145)` |
| `--success-soft` | | `oklch(0.92 0.05 145)` | `oklch(0.20 0.06 145)` |
| `--success-deco` | | `oklch(0.80 0.10 145)` | — |
| `--success-icon-bg` | | `oklch(0.86 0.07 145)` | — |
| `--success-value` | | `oklch(0.42 0.14 145)` | — |
| `--warning` | 85° (ámbar) | `oklch(0.78 0.17 85)` | `oklch(0.82 0.17 85)` |
| `--warning-soft` | | `oklch(0.95 0.05 85)` | `oklch(0.20 0.06 85)` |
| `--warning-deco` | | `oklch(0.84 0.12 85)` | — |
| `--warning-icon-bg` | | _pendiente_ | — |
| `--warning-value` | | _pendiente_ | — |
| `--error` | 25° (rojo) | `oklch(0.65 0.20 25)` | `oklch(0.70 0.20 25)` |
| `--error-soft` | | `oklch(0.93 0.05 25)` | `oklch(0.20 0.07 25)` |
| `--error-deco` | | _pendiente_ | — |
| `--info` | 230° (azul) | `oklch(0.70 0.12 230)` | `oklch(0.74 0.12 230)` |
| `--info-soft` | | `oklch(0.93 0.04 230)` | `oklch(0.20 0.05 230)` |

> `--success-border`, `--warning-border`, `--error-border`, `--info-border` también están definidos. Ver `globals.css`.

### 2.6 Scoring & Accuracy

Colores para feedback de accuracy en entrevistas y ejercicios.

| Variable | Valor | Tailwind | Semántica |
|----------|-------|----------|-----------|
| `--score-excellent` | `#22c55e` | `text-score-excellent` | ≥80% accuracy |
| `--score-excellent-bg` | `#22c55e18` | `bg-score-excellent-bg` | Fondo scoring excelente |
| `--score-acceptable` | `#f59e0b` | `text-score-acceptable` | ≥55% accuracy |
| `--score-acceptable-bg` | `#f59e0b18` | `bg-score-acceptable-bg` | |
| `--score-poor` | `#ef4444` | `text-score-poor` | <55% accuracy |
| `--score-poor-bg` | `#ef444418` | `bg-score-poor-bg` | |

**WordChip states:**

| Variable | Valor | Semántica |
|----------|-------|-----------|
| `--word-correct` | `#16a34a` | Pronunciada correctamente |
| `--word-correct-bg` | `#16a34a18` | |
| `--word-incorrect` | `#dc2626` | Pronunciada incorrectamente |
| `--word-incorrect-bg` | `#dc262618` | |
| `--word-missing` | `#d97706` | Palabra faltante |
| `--word-missing-bg` | `#d9770618` | |
| `--word-extra` | `#6b7280` | Palabra extra/no esperada |
| `--word-extra-bg` | `#6b728018` | |

> ✅ Implementadas y en uso en `components/interview/`.

### 2.7 Tokens de botones

| Variable | Light | Dark |
|----------|-------|------|
| `--btn-regular-bg` | `--surface-raised` | `--surface-raised` |
| `--btn-regular-bg-hover` | `--surface-sunken` | `--surface-sunken` |
| `--btn-regular-bg-active` | `--border-default` | `--border-default` |
| `--btn-plain-bg` | `--surface-raised` | `--surface-raised` |
| `--btn-plain-bg-hover` | `--surface-raised` / `--surface-sunken` | |

> `--btn-plain-bg` estaba rota (referenciada en `markdown.css` sin definir). ✅ **Corregida en esta rama.**

### 2.8 Focus

```css
--focus-ring   → oklch(0.75 0.12 var(--hue) / 0.4)   (semitransparente, definida pero sin uso activo)
--focus-color  → color-mix(in oklch, var(--primary) 35%, transparent)   (usada en componentes)
--border-focus → var(--primary)   (alias para focus outlines via border-border-focus)
```

### 2.9 Admonitions (antes rotas)

```css
--admonitions-color-tip:       oklch(0.70 0.16 145)   /* verde = success */
--admonitions-color-warning:   oklch(0.78 0.17 85)    /* ámbar = warning */
--admonitions-color-important: oklch(0.62 0.18 310)   /* morado */
```

> ✅ **Corregidas en esta rama.** Antes referenciadas en `markdown.css` sin definir.

### 2.10 Escala tipográfica como font shorthand

```css
--font-h1: 700 clamp(1.875rem, 4vw, 2.625rem) / 1.2 var(--font-heading), sans-serif;
--font-h2: 700 clamp(1.5rem, 3vw, 2rem) / 1.3 var(--font-heading), sans-serif;
--font-h3: 600 clamp(1.25rem, 2.5vw, 1.5rem) / 1.4 var(--font-heading), sans-serif;
--font-h4: 600 1.25rem / 1.4 var(--font-heading), sans-serif;
--font-display: var(--font-heading), sans-serif;   /* fix: antes indefinida */
```

> `--font-display` estaba referenciada en la clase `.font-display` sin definir. ✅ **Corregida en esta rama.**

### 2.11 Layout

```css
--sidebar-width: 256px
--selection-bg: var(--primary-soft)
--title-active: var(--primary)
--color-selection-bar: linear-gradient(to right, oklch(.8 .1 0), ..., oklch(.8 .1 360))
```

### 2.12 Acento (aliases de backward compatibility)

```css
--color-accent       → --primary
--color-accent-soft  → --primary-soft
--color-accent-hover → --primary-hover
--color-text-on-accent → oklch(1 0 0)
--accent-text        → oklch(1 0 0)
--secondary          → --primary
--secondary-hover    → --primary-hover
--secondary-soft     → --primary-soft
```

> `applyTheme()` en `lib/themes.ts` puede sobrescribir estas con valores hex fijos. Ver sección 3.

---

## 3. Temas Preset

Definidos en `lib/themes.ts`. Se aplican llamando a `applyTheme(themeName, mode)`.

Los temas preset usan valores **hex fijos** y sobrescriben las variables `--color-accent*` directamente en `document.documentElement.style`. Esto los desacopla del sistema OKLCH dinámico.

| Tema | Accent | Soft |
|------|--------|------|
| `blue` (default) | `#6EA8FE` | `#E7F0FF` / `#1B2A4A` |
| `pink` | `#F59BB7` | `#FDE7EF` / `#3A1F2B` |
| `purple` | `#B69DF8` | `#F1ECFF` / `#2A1F3D` |
| `green` | `#6ED3A3` | `#E8FBF2` / `#1C3328` |
| `yellow` | `#F6D860` | `#FFF7D6` / `#3A2E00` |
| `red` | `#F28B82` | `#FDECEA` / `#3A1F1F` |
| `orange` | `#F4A261` | `#FFF1E6` / `#3A2A1F` |
| `neutral` | `#7B8FA1` | `#EEF3F7` / `#1E293B` |

Cada tema define 6 tokens: `accent`, `accentSoft`, `accentHover`, `textOnAccent`, `textPrimary`, `textSecondary`.

---

## 4. Integración Tailwind @theme

Implementada en esta rama con `@theme inline` en `globals.css`. Genera clases utilitarias sin re-emitir variables CSS, resolviendo los valores en runtime (necesario para tokens dinámicos como `--primary`).

### Categorías expuestas

| Categoría | Patrón de clase | Ejemplo |
|-----------|----------------|---------|
| Superficies (`--color-surface-*`) | `bg-surface-base`, `bg-surface-raised`… | `bg-surface-raised` |
| Primary (`--color-primary-*`) | `bg-primary`, `text-primary`, `border-primary`… | `bg-primary-soft` |
| Foreground (`--color-fg-*`) | `text-fg`, `text-fg-muted`, `text-fg-subtle`… | `text-fg-muted` |
| Bordes (`--color-border-*`) | `border-border-subtle`, `border-border-default`… | `border-border-default` |
| Overlays (`--color-overlay-*`) | `bg-overlay-subtle`, `bg-overlay-medium`… | `bg-overlay-light` |
| Semánticos (`--color-success/warning/error/info`) | `text-success`, `bg-success-soft`… | `bg-error-soft` |
| Scoring / WordChip | `text-score-excellent`, `bg-word-correct-bg`… | `bg-score-poor-bg` |
| Espaciado (`--spacing-space-*`) | `p-space-4`, `gap-space-6`, `m-space-2`… | `gap-space-4` |
| Border radius (`--radius-*`) | `rounded-xs`, `rounded-sm`… `rounded-3xl` | `rounded-md` |
| Tipografía (`--text-h1`…`--text-tiny`) | `text-h1`, `text-h2`… `text-tiny` | `text-h3` |
| Sombras (`--shadow-*`) | `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl` | `shadow-md` |

### Escala de border radius

| Token | Valor | Clase Tailwind |
|-------|-------|----------------|
| `--radius-xs` | 4px | `rounded-xs` |
| `--radius-sm` | 8px | `rounded-sm` |
| `--radius-md` | 12px | `rounded-md` |
| `--radius-lg` | 16px | `rounded-lg` |
| `--radius-xl` | 20px | `rounded-xl` |
| `--radius-2xl` | 24px | `rounded-2xl` |
| `--radius-3xl` | 32px | `rounded-3xl` |
| `--radius-full` | 9999px | `rounded-full` |

> ✅ **Implementado en esta rama.** Antes solo existían como tokens en el TS eliminado.

### Escala tipográfica

| Token | Tamaño | Weight | Line-height | Clase |
|-------|--------|--------|-------------|-------|
| `--text-h1` | 2.625rem | 700 | 1.2 | `text-h1` |
| `--text-h2` | 2rem | 700 | 1.3 | `text-h2` |
| `--text-h3` | 1.5rem | 600 | 1.4 | `text-h3` |
| `--text-h4` | 1.25rem | 600 | 1.4 | `text-h4` |
| `--text-body-lg` | 1.125rem | 400 | 1.6 | `text-body-lg` |
| `--text-body-sm` | 0.875rem | 400 | 1.5 | `text-body-sm` |
| `--text-caption` | 0.75rem | 400 | 1.5 | `text-caption` |
| `--text-tiny` | 0.6875rem | 500 | 1.4 | `text-tiny` |

> ✅ **Implementado en esta rama.** Los componentes existentes aún usan clases Tailwind estándar (`text-sm`, `text-xs`). Migración pendiente.

### Escala de sombras

| Token | Valor | Clase |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px oklch(0 0 0 / 0.05)` | `shadow-sm` |
| `--shadow-md` | `0 4px 6px oklch(0 0 0 / 0.07)` | `shadow-md` |
| `--shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.10)` | `shadow-lg` |
| `--shadow-xl` | `0 20px 25px oklch(0 0 0 / 0.10)` | `shadow-xl` |

> ✅ **Implementado en esta rama.** Migración de `shadow-*` hardcodeadas en componentes: pendiente.

---

## 5. Clases Utilitarias Globales

Definidas en `app/globals.css`. Se usan directamente en `className`.

### Botones

| Clase | Comportamiento | Estado |
|-------|---------------|--------|
| `.btn-primary` | `bg: --primary`, `color: --on-primary` | ✅ En uso |
| `.btn-secondary` | `bg: --btn-regular-bg`, borde `--border-default` | ✅ En uso |
| `.btn-soft` | `bg: --primary-soft`, `color: --primary` | ✅ En uso |
| `.accent-button` | `bg: --color-accent`, `color: --color-text-on-accent` | ⚠️ Sin usos encontrados |

### Superficies

| Clase | Comportamiento | Estado |
|-------|---------------|--------|
| `.card` | `bg: --surface-raised`, borde `--border-default` | ⚠️ Sin usos encontrados |
| `.card-dark` | `bg: --surface-sunken`, borde `--border-default` | ⚠️ Sin usos encontrados |
| `.input-themed` | `bg: --surface-base`, borde `--border-default`, focus con `--focus-color` | ⚠️ Sin usos encontrados |

### Animaciones

| Clase | Animación | Estado |
|-------|-----------|--------|
| `.animate-fadeIn` | `fadeIn` — 0.4s, translateY 8px→0 | ⚠️ Sin usos encontrados |
| `.animate-stat-rise` | `statRise` — 0.6s, translateY 18px + scaleY 0.7 | ⚠️ Sin usos encontrados |
| `.animate-progress-ring` | `progressRing` — 1s, stroke-dasharray | ⚠️ Sin usos encontrados |
| `.animate-float-soft` | `floatSoft` — 3.2s, translateY 0↔-4px | ⚠️ Sin usos encontrados |
| `.animate-grid-in` | `grid-in` — 0.35s, cubic-bezier suave | ✅ En uso |

### Badges y navegación

| Clase | Uso | Estado |
|-------|-----|--------|
| `.badge-primary` | `bg: --primary-soft`, `color: --primary` | ⚠️ Sin usos encontrados |
| `.badge-secondary` | `bg: --secondary-soft`, `color: --secondary` | ⚠️ Sin usos encontrados |
| `.badge-accent` | semi-transparente con borde `--color-accent` | ⚠️ Sin usos encontrados |
| `.accent-nav-active` | `bg: primary 15%`, `color: --color-accent` | ✅ En uso (nav sidebar) |

### Scrollbars

| Clase | Estado |
|-------|--------|
| `.sidebar-scrollbar` | ✅ En uso |
| `.main-scrollbar` | ✅ En uso |

### Colores semánticos

```css
.text-success / .bg-success     → --success / --success-soft
.text-warning / .bg-warning     → --warning / --warning-soft
.text-error   / .bg-error       → --error   / --error-soft
.text-info    / .bg-info        → --info    / --info-soft
.bg-success-light / .bg-warning-light / .bg-error-light / .bg-info-light
```

---

## 6. Enforcement: Linter de Tokens

Añadido en esta rama: `scripts/lint-design-tokens.mjs`. Ejecutar con `npm run lint:design-tokens`.

Detecta tres categorías de violaciones en `.tsx/.ts/.jsx/.js`:

1. **Colores hex hardcoded** en clases Tailwind arbitrarias — ej. `bg-[#fff]`, `text-[#1a2b3c]`
2. **Tamaños de texto arbitrarios** no documentados — ej. `text-[16px]` fuera de la lista permitida
3. **Spacing fuera del grid de 4px** — ej. `gap-[7px]`, `p-[13px]`

**Lista de `text-[Xpx]` permitidos** (valores "conocidos, migración pendiente"):
`9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `15px`

**Lista de `rounded-[Xpx]` permitidos** (hasta que todos usen las clases del sistema):
`20px` → usar `rounded-xl`, `32px` → usar `rounded-3xl`

**Valores ≥ 20px** en `w-*`, `h-*`, `max-w-*` se ignoran (dimensiones de layout intencionales).

El script sale con código 1 si hay violaciones, 0 si todo está limpio.

---

## 7. Lo que Falta por Implementar

### 7.1 Migrar componentes a la nueva tipografía (`text-h1`…`text-tiny`)

✅ **Parcialmente completado (2026-05-07):**

- Todos los `<h1>/<h2>/<h3>/<h4>` con `text-2xl/3xl/4xl/xl` migrados a `text-h1/h2/h3/h4`
- `var(--deep-text)` alias legacy eliminado: en Tailwind arbitrario → `text-fg`; en expresiones JS complejas (ternarios, style objects) → `var(--text-primary)`
- `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, `text-[var(--text-tertiary)]` → `text-fg`, `text-fg-muted`, `text-fg-subtle`

**Pendiente:** Heading elements pequeños con `text-lg` en `<h2>`/`<h3>` (modales, labels de sección) se mantienen intencionalmente ya que su tamaño visual es deliberado y no corresponde al token `text-h4`.

### 7.2 Migrar `box-shadow` hardcodeadas a `shadow-*`

Los tokens `shadow-sm/md/lg/xl` existen pero los componentes siguen usando valores inline o clases Tailwind con valores literales. Identificar y migrar.

### 7.3 Migrar spacing a `space-*` tokens

Los tokens `p-space-4`, `gap-space-6`, etc. existen pero no se usan en componentes. La escala estándar de Tailwind (`p-4`, `gap-6`) sigue siendo válida — estos tokens son equivalentes. Decidir si vale la pena la migración.

### 7.4 Limpiar clases utilitarias sin uso

Las siguientes clases en `globals.css` no tienen usos detectados. Verificar con búsqueda estática antes de eliminar (pueden usarse con interpolación dinámica):

```
.btn-primary, .btn-secondary, .btn-soft  ← verificar — pueden usarse dinámicamente
.card, .card-dark
.input-themed
.accent-button
.badge-primary, .badge-secondary, .badge-accent
.animate-fadeIn, .animate-stat-rise, .animate-progress-ring, .animate-float-soft
```

### 7.5 Auth components — backgrounds y bordes

Los textos de `components/auth/` fueron migrados al sistema semántico. Pendiente:
- Backgrounds hardcodeados en `AuthCard`, `AuthPanel`, `AuthBackground`
- Bordes y separadores con valores literales

### 7.6 Completar variantes semánticas de `warning`, `error`, `info`

✅ Todas las variantes (`-deco`, `-icon-bg`, `-value`) están definidas para `success`, `warning`, `error` e `info` — tanto en light como en dark mode — y expuestas en `@theme inline` como clases `text-*` y `bg-*`.

### 7.7 Variables huérfanas — candidatas a eliminar

| Variable | Estado |
|----------|--------|
| `--accent-analog-1/2`, `--accent-complement` | Definidas, sin uso en componentes |
| `--gradient-primary` | Definida, sin uso en componentes |
| `--secondary*` aliases | Aliases de `--primary*`, sin uso directo |
| `--focus-ring` | Duplica `--focus-color`; solo `--focus-color` se usa |
| `.accent-button`, `.card`, `.card-dark` | Clases sin uso detectado |

---

## 8. Enforcement Log

### 8.1 Spacing Standardization (2026-05-04)

**Branch:** `design-system-enforcement`  
**Task:** Eliminar valores de spacing arbitrarios; reemplazar con escala Tailwind (base 4px)

Eliminados **8 valores arbitrarios** en 5 componentes.

| Archivo | Cambios |
|---------|---------|
| `components/home/HomeAudioOfDay.tsx` | `gap-[3px]` → `gap-0.5`, `w-[4px]` → `w-1` |
| `components/home/HomeWeakPhoneme.tsx` | `border-l-[3px]` → `border-l-2`, `gap-[3px]` → `gap-0.5`, `w-[3px]` → `w-1` |
| `components/sidebar/SidebarWordOfDay.tsx` | `gap-[3px]` → `gap-0.5`, `w-[3px]` → `w-1` |
| `components/ai-practice/pronunciation/WaveformIdle.tsx` | `gap-[3px]` → `gap-0.5` |
| `components/interview/WordChip.tsx` | `border-[5px]` → `border-4`, `border-[4px]` → `border-4` |

✅ Todos los valores `w-[Npx]`, `h-[Npx]`, `max-w-[Npx]` ≥ 20px se mantienen (dimensiones de layout intencionales).

---

### 8.2 Typography Hierarchy Migration (2026-05-07)

**Branch:** `design-system-enforcement`  
**Task:** Migrar colores de texto grises a sistema semántico (`text-fg`, `text-fg-muted`, `text-fg-subtle`)

**Total:** 158 archivos, 450+ reemplazos.

| From | To | Count |
|------|----|-------|
| `text-gray-900` | `text-fg` | ~150 |
| `text-gray-700` | `text-fg` / `text-fg-muted` | ~80 |
| `text-gray-600` | `text-fg-muted` | ~40 |
| `text-gray-500` | `text-fg-subtle` | ~80 |
| `text-gray-400` | `text-fg-subtle` / `text-fg-disabled` | ~40 |
| Inline `color: #...` | `color: var(--text-primary)` / `var(--text-secondary)` / `var(--text-tertiary)` | ~60 |

**Casos especiales:**
- `StageCard.tsx`: colores pastel personalizados refactorizados a const local, no migrados
- `LessonMarkdown.tsx zinc`: syntax highlighting en escala separada, se mantiene
- Tooltips `bg-gray-800/900`: intencional — backgrounds always-dark, no migrar

✅ Sin grises hardcoded para texto (backgrounds/bordes: próxima fase)

---

### 8.3 Scoring & Accuracy Color System (2026-05-07)

**Branch:** `design-system-enforcement`  
**Task:** Tokenizar colores de accuracy/scoring hardcodeados en `components/interview/`

12 nuevas variables de scoring + 8 de WordChip añadidas a `globals.css`, expuestas a Tailwind.

| Archivo | Reemplazos |
|---------|-----------|
| `AccuracyRing.tsx` | 3 hex → vars |
| `CandidateBubble.tsx` | 3 hex → vars |
| `WordChip.tsx` | 8 hex → vars |
| `InterviewResults.tsx` | 6 hex → vars |

---

### 8.4 @theme Inline Full Integration + Fixes (2026-05-07)

**Branch:** `design-system-enforcement`  
**Task:** Exponer el sistema de diseño completo como tokens nativos de Tailwind v4

**Nuevas categorías añadidas a `@theme inline`:**
- `--color-surface-*` — sistema de superficies semántico (base/raised/sunken/overlay/tooltip/code)
- `--color-border-subtle/default/strong/focus` — escala semántica de bordes
- `--color-overlay-*` — tokens de transparencia
- `--radius-xs` → `--radius-full` — escala completa de border radius
- `--text-h1` → `--text-tiny` — escala tipográfica con line-height y weight
- `--shadow-sm` → `--shadow-xl` — sombras con OKLCH
- `--spacing-space-1` → `--spacing-space-20` — escala de espaciado semántico

**Variables rotas corregidas:**
- `--btn-plain-bg` — referenciada en `markdown.css` sin definir ✅
- `--font-display` — referenciada en `.font-display` sin definir ✅
- `--admonitions-color-tip/warning/important` — rotas en `markdown.css` ✅

**`lib/design-tokens.ts` eliminado** — los tokens ahora viven en CSS/`@theme inline`.

**Linter añadido:** `scripts/lint-design-tokens.mjs` — detecta hex hardcoded, text-[Xpx] no documentados y spacing fuera del grid de 4px.

---

## Resumen de estado del sistema

| Área | Estado | Prioridad |
|------|--------|-----------|
| Sistema OKLCH primario | ✅ Completo | — |
| Neutrales y superficies (`--surface-*`) | ✅ Completo | — |
| Colores semánticos base | ✅ Completo | — |
| Variantes semánticas extendidas (`-deco`, `-icon-bg`, `-value`) | ⚠️ Solo `--success-*` completo | Media |
| Scoring & Accuracy colors | ✅ Tokenizados | — |
| Jerarquía de texto (fg system) | ✅ Completo | — |
| Grises de texto hardcoded | ✅ Eliminados | — |
| Spacing arbitrario (pequeños valores) | ✅ Eliminado | — |
| Border radius como variables + @theme | ✅ Completo | — |
| Sombras como variables + @theme | ✅ Completo | — |
| @theme inline — integración completa | ✅ Completo | — |
| Variables rotas (`btn-plain-bg`, `font-display`, admonitions) | ✅ Corregidas | — |
| Linter de tokens | ✅ Implementado | — |
| `lib/design-tokens.ts` | ✅ Eliminado (migrado a CSS) | — |
| Tipografía (`text-h1`…`text-tiny`) usada en componentes | ❌ Definida, no adoptada | Media |
| `box-shadow` hardcodeadas migradas a `shadow-*` | ❌ Pendiente | Media |
| Auth components — backgrounds y bordes | ⚠️ Texto migrado, fondos pendientes | Media |
| Clases utilitarias sin uso | ⚠️ ~50% sin uso detectado | Baja |
| Variables huérfanas (`--accent-analog-*`, `--focus-ring`, etc.) | ⚠️ Candidatas a eliminar | Baja |
