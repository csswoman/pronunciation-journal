# Design System — English Journal

> Mapa de referencia del sistema de diseño. Última revisión: 2026-05-03.
> Fuentes de verdad: `app/globals.css`, `lib/design-tokens.ts`, `lib/themes.ts`.

---

## Índice

1. [Sistema OKLCH](#1-sistema-oklch)
2. [Variables CSS por categoría](#2-variables-css-por-categoría)
3. [Temas preset](#3-temas-preset)
4. [Clases utilitarias globales](#4-clases-utilitarias-globales)
5. [Tokens TypeScript (lib/design-tokens.ts)](#5-tokens-typescript)
6. [Variables huérfanas y rotas](#6-variables-huérfanas-y-rotas)
7. [Lo que falta](#7-lo-que-falta)

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
         ↑           ↑      ↑
       fijo        fijo   dinámico
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
--primary           → --primary-500   (el color de acento: botones, links, highlights)
--primary-hover     → --primary-600   (hover de botones)
--primary-active    → oklch(0.55 0.17 var(--hue))   (pressed)
--primary-soft      → --primary-100   (fondos suaves, badges)
--primary-foreground → oklch(1 0 0)   (texto blanco sobre primary)
--on-primary        → oklch(1 0 0)    (alias de primary-foreground)
--focus-ring        → oklch(0.75 0.12 var(--hue) / 0.4)
```

### Variaciones de acento derivadas

Generadas automáticamente a partir del hue del usuario — útiles para gradientes o elementos complementarios:

```css
--accent-analog-1   → hue + 20°  (color análogo cálido)
--accent-analog-2   → hue - 20°  (color análogo frío)
--accent-complement → hue + 180° (color complementario)
--gradient-primary  → linear-gradient(135deg, primary, primary +30°)
```

> ⚠️ **Estado actual:** Definidas pero no usadas en ningún componente. Ver [sección 6](#6-variables-huérfanas-y-rotas).

---

## 2. Variables CSS por categoría

### 2.1 Superficies y fondos (Neutral System)

Los neutrales tienen croma 0 en light mode y croma ≈ 0.003–0.004 en dark (un tinte muy sutil del hue del usuario).

| Variable | Light | Dark | Uso |
|----------|-------|------|-----|
| `--bg` | `oklch(0.985 0 0)` | `oklch(0.120 0.003 hue)` | Fondo de página |
| `--bg-secondary` | `oklch(0.965 0 0)` | `oklch(0.165 0.003 hue)` | Cards, panels |
| `--bg-tertiary` | `oklch(0.940 0 0)` | `oklch(0.210 0.004 hue)` | Inputs, hovers, elementos anidados |
| `--fg` | `oklch(0.18 0.008 hue)` | `oklch(0.95 0.003 hue)` | Alias de `--text-primary` (legacy) |

**Aliases de estructura:**
```css
--page-bg     → --bg
--card-bg     → --bg-secondary
--scrollbar-track → --bg-secondary (light) / --bg-tertiary (dark)
```

### 2.2 Tipografía

| Variable | Light | Dark | Uso |
|----------|-------|------|-----|
| `--text-primary` | `oklch(0.18 0.008 hue)` | `oklch(0.93 0.004 hue)` | Texto principal, headings |
| `--text-secondary` | `oklch(0.46 0.006 hue)` | `oklch(0.65 0.004 hue)` | Texto de soporte, descripciones |
| `--text-tertiary` | `oklch(0.62 0.004 hue)` | `oklch(0.48 0.003 hue)` | Placeholders, metadatos, labels |

**Aliases legacy:**
```css
--deep-text            → --text-primary
--color-text-primary   → --text-primary
--color-text-secondary → --text-secondary
--btn-content          → --text-primary
```

### 2.3 Bordes

| Variable | Light | Dark | Uso |
|----------|-------|------|-----|
| `--border` | `oklch(0.875 0 0)` | `oklch(0.275 0 0)` | Bordes estándar de cards e inputs |
| `--border-hover` | `oklch(0.770 0 0)` | `oklch(0.375 0 0)` | Borde en hover |

**Aliases:**
```css
--line-divider → --border
--line-color   → --border
```

### 2.4 Colores semánticos

Hues fijos — no cambian con el tema del usuario.

| Variable | Light | Dark | Hue | Uso |
|----------|-------|------|-----|-----|
| `--success` | `oklch(0.70 0.16 145)` | `oklch(0.74 0.16 145)` | 145° (verde) | Respuestas correctas, progreso |
| `--success-soft` | `oklch(0.92 0.05 145)` | `oklch(0.20 0.06 145)` | | Fondo de badges de éxito |
| `--warning` | `oklch(0.78 0.17 85)` | `oklch(0.82 0.17 85)` | 85° (amarillo) | Alertas, niveles medios |
| `--warning-soft` | `oklch(0.95 0.05 85)` | `oklch(0.20 0.06 85)` | | Fondo de badges de alerta |
| `--error` | `oklch(0.65 0.20 25)` | `oklch(0.70 0.20 25)` | 25° (rojo) | Respuestas incorrectas, errores |
| `--error-soft` | `oklch(0.93 0.05 25)` | `oklch(0.20 0.07 25)` | | Fondo de badges de error |
| `--info` | `oklch(0.70 0.12 230)` | `oklch(0.74 0.12 230)` | 230° (azul) | Información, tips, notas |
| `--info-soft` | `oklch(0.93 0.04 230)` | `oklch(0.20 0.05 230)` | | Fondo de badges de info |

### 2.5 Tokens de botones

| Variable | Light | Dark |
|----------|-------|------|
| `--btn-regular-bg` | `--bg-secondary` | `--bg-secondary` |
| `--btn-regular-bg-hover` | `--bg-tertiary` | `--bg-tertiary` |
| `--btn-regular-bg-active` | `--border` | `--border` |
| `--btn-plain-bg-hover` | `--bg-secondary` | `--bg-tertiary` |

### 2.6 Acento (aliases de backward compatibility)

Estos aliases se mapean sobre el sistema primario para compatibilidad con código legacy. `applyTheme()` en `lib/themes.ts` puede sobrescribirlos con valores hex de un tema preset.

```css
--color-accent       → --primary
--color-accent-soft  → --primary-soft
--color-accent-hover → --primary-hover
--color-text-on-accent → white (oklch 1 0 0)
--accent-text        → white
--secondary          → --primary
--secondary-hover    → --primary-hover
--secondary-soft     → --primary-soft
```

> ⚠️ **Nota:** `lib/themes.ts` define 8 temas preset con valores hex fijos que **sobrescriben** el sistema OKLCH dinámico al aplicarse vía `applyTheme()`. Esto crea dos modos de funcionamiento no del todo unificados. Ver [sección 3](#3-temas-preset).

### 2.7 Focus y anillos

```css
--focus-ring   → oklch(0.75 0.12 var(--hue) / 0.4)   (semitransparente)
--focus-color  → color-mix(in oklch, var(--primary) 35%, transparent)
```

`--focus-color` es el que se usa en componentes. `--focus-ring` está definido pero sin uso activo.

### 2.8 Layout

```css
--sidebar-width: 256px
--selection-bg: var(--primary-soft)   (fondo de texto seleccionado)
--title-active: var(--primary)
```

### 2.9 Gradiente de selección de color

```css
--color-selection-bar: linear-gradient(to right, oklch(.8 .1 0), ..., oklch(.8 .1 360))
```

Usado exclusivamente por `.color-selection-slider` en el picker de tema.

---

## 3. Temas Preset

Definidos en `lib/themes.ts`. Se aplican llamando a `applyTheme(themeName, mode)`.

**Importante:** Los temas preset usan valores **hex fijos** y sobrescriben las variables `--color-accent*` y `--color-text-*` directamente en `document.documentElement.style`. Esto los desacopla del sistema OKLCH dinámico — cuando un tema preset está activo, `--primary` (del OKLCH) y `--color-accent` (del tema) pueden ser distintos.

| Tema | Accent light | Accent dark | Soft light | Soft dark |
|------|-------------|-------------|-----------|----------|
| `blue` (default) | `#6EA8FE` | `#6EA8FE` | `#E7F0FF` | `#1B2A4A` |
| `pink` | `#F59BB7` | `#F59BB7` | `#FDE7EF` | `#3A1F2B` |
| `purple` | `#B69DF8` | `#B69DF8` | `#F1ECFF` | `#2A1F3D` |
| `green` | `#6ED3A3` | `#6ED3A3` | `#E8FBF2` | `#1C3328` |
| `yellow` | `#F6D860` | `#F6D860` | `#FFF7D6` | `#3A2E00` |
| `red` | `#F28B82` | `#F28B82` | `#FDECEA` | `#3A1F1F` |
| `orange` | `#F4A261` | `#F4A261` | `#FFF1E6` | `#3A2A1F` |
| `neutral` | `#7B8FA1` | `#7B8FA1` | `#EEF3F7` | `#1E293B` |

Cada tema define 6 tokens: `accent`, `accentSoft`, `accentHover`, `textOnAccent`, `textPrimary`, `textSecondary`.

### Hook de aplicación

```typescript
// lib/themes.ts
applyTheme("purple", "dark")
// Escribe en document.documentElement.style:
// --color-accent, --color-accent-soft, --color-accent-hover,
// --color-text-on-accent, --color-text-primary, --color-text-secondary, --accent-rgb
```

---

## 4. Clases Utilitarias Globales

Definidas en `app/globals.css`. Se usan directamente en `className`.

### Botones

| Clase | Comportamiento | Estado de uso |
|-------|---------------|---------------|
| `.btn-primary` | `bg: --primary`, `color: --primary-foreground` | ✅ En uso |
| `.btn-secondary` | `bg: --btn-regular-bg`, borde `--border` | ✅ En uso |
| `.btn-soft` | `bg: --primary-soft`, `color: --primary` | ✅ En uso |
| `.accent-button` | `bg: --color-accent`, `color: --color-text-on-accent` | ⚠️ Sin usos encontrados |

### Superficies

| Clase | Comportamiento | Estado de uso |
|-------|---------------|---------------|
| `.card` | `bg: --bg-secondary`, borde `--border` | ⚠️ Sin usos encontrados |
| `.card-dark` | `bg: --bg-tertiary`, borde `--border` | ⚠️ Sin usos encontrados |
| `.input-themed` | `bg: --bg`, borde `--border`, focus con `--focus-color` | ⚠️ Sin usos encontrados |

### Animaciones

| Clase | Animación | Estado de uso |
|-------|-----------|---------------|
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

| Clase | Uso | Estado |
|-------|-----|--------|
| `.sidebar-scrollbar` | Scrollbar delgada con color `--primary` | ✅ En uso |
| `.main-scrollbar` | Scrollbar del área de contenido | ✅ En uso |

### Colores semánticos (texto y fondo)

```css
.text-success / .bg-success     → --success / --success-soft
.text-warning / .bg-warning     → --warning / --warning-soft
.text-error   / .bg-error       → --error   / --error-soft
.text-info    / .bg-info        → --info    / --info-soft
/* Aliases adicionales */
.bg-success-light / .bg-warning-light / .bg-error-light / .bg-info-light
```

---

## 5. Tokens TypeScript

Definidos en `lib/design-tokens.ts`. **Advertencia:** estos tokens están definidos como objetos TS pero no están mapeados a Tailwind ni a CSS variables — son referencia, no se consumen automáticamente.

### Espaciado (escala 8pt)

| Token | Valor | Equivalente Tailwind |
|-------|-------|---------------------|
| `xs` | 4px | `p-1` / `m-1` |
| `sm` | 8px | `p-2` / `m-2` |
| `md` | 16px | `p-4` / `m-4` |
| `lg` | 24px | `p-6` / `m-6` |
| `xl` | 32px | `p-8` / `m-8` |
| `2xl` | 48px | `p-12` / `m-12` |
| `3xl` | 64px | `p-16` / `m-16` |

### Tipografía

| Nivel | Tamaño | Peso | Line-height | Letter-spacing |
|-------|--------|------|-------------|----------------|
| `h1` | 42px (2.625rem) | 700 | 1.2 | -0.02em |
| `h2` | 32px (2rem) | 700 | 1.3 | -0.01em |
| `h3` | 24px (1.5rem) | 600 | 1.4 | -0.005em |
| `h4` | 20px (1.25rem) | 600 | 1.4 | — |
| `body.lg` | 18px | 400 | 1.6 | — |
| `body.base` | 16px | 400 | 1.6 | — |
| `body.sm` | 14px | 400 | 1.5 | — |
| `body.xs` | 12px | 400 | 1.5 | — |

### Border Radius

| Token | Valor | Tailwind aproximado |
|-------|-------|---------------------|
| `sm` | 8px | `rounded-lg` |
| `md` | 12px | `rounded-xl` |
| `lg` | 16px | `rounded-2xl` |
| `xl` | 20px | `rounded-[20px]` |
| `2xl` | 24px | `rounded-3xl` |
| `3xl` | 32px | `rounded-[32px]` |

### Sombras

| Token | Valor |
|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `md` | `0 4px 6px rgba(0,0,0,0.07)` |
| `lg` | `0 10px 15px rgba(0,0,0,0.1)` |
| `xl` | `0 20px 25px rgba(0,0,0,0.1)` |

### Transiciones

| Token | Valor |
|-------|-------|
| `fast` | 150ms |
| `base` | 200ms |
| `slow` | 300ms |

---

## 6. Variables Huérfanas y Rotas

### Variables definidas pero sin uso en componentes

| Variable | Definida en | Problema |
|----------|-------------|---------|
| `--fg` | `globals.css:47` | Alias legacy de `--text-primary`. Usar `--text-primary` directamente. |
| `--focus-ring` | `globals.css:33` | Duplica `--focus-color`. Solo `--focus-color` se usa en componentes. |
| `--accent-analog-1/2` | `globals.css:36-37` | Definidas, con clases utilitarias, pero ningún componente las usa. |
| `--accent-complement` | `globals.css:38` | Ídem. |
| `--gradient-primary` | `globals.css:41` | Solo existe en utilidades CSS, no en componentes. |
| `--secondary*` | `globals.css:82-84` | Aliases legacy de `--primary*`. Nadie los usa directamente. |

### Variables referenciadas pero NO definidas (rotas)

| Variable | Referenciada en | Impacto |
|----------|----------------|---------|
| `--btn-plain-bg` | `app/markdown.css:59,281,301` | Los fondos de inline code y tables en markdown pueden fallar |
| `--font-display` | `app/globals.css:278` (clase `.font-display`) | La clase no funciona — la font no está cargada |
| `--font-mono` | `app/markdown.css:58` | Tiene fallback (`ui-monospace`), no es crítico |
| `--admonitions-color-important` | `app/markdown.css:358,428+` | Callouts tipo "important" quedan sin color |
| `--admonitions-color-tip` | `app/markdown.css:430+` | Callouts tipo "tip" quedan sin color |
| `--admonitions-color-warning` | `app/markdown.css:432+` | Callouts tipo "warning" quedan sin color |

### Clases utilitarias definidas pero sin uso detectado

Estas clases existen en `globals.css` pero no se encontraron en ningún `.tsx`:

```
.btn-primary, .btn-secondary, .btn-soft
.card, .card-dark
.input-themed
.accent-button
.badge-primary, .badge-secondary, .badge-accent
.animate-fadeIn, .animate-stat-rise, .animate-progress-ring, .animate-float-soft
```

> **Nota:** Puede que algunas se usen mediante interpolación dinámica (`className={isActive ? 'btn-primary' : ''}`) y no aparezcan en búsquedas estáticas. Verificar antes de eliminar.

---

## 7. Lo que falta

Comparando el sistema actual con los tokens de `lib/design-tokens.ts` y las necesidades identificadas en la auditoría:

### 7.1 Variables de color que deberían existir

```css
/* Actualmente no existen como variables — se usan hardcodeadas */
--radius-sm:  8px;
--radius-md:  12px;
--radius-lg:  16px;
--radius-xl:  20px;
--radius-2xl: 24px;
--radius-3xl: 32px;

/* Sombras como variables */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
```

### 7.2 Variables faltantes críticas (rotas, deben definirse)

```css
:root {
  --btn-plain-bg: var(--bg-secondary);   /* fix markdown.css */
  --font-display: var(--font-heading);   /* fix .font-display class */
  --admonitions-color-tip:       oklch(0.70 0.16 145); /* verde = success */
  --admonitions-color-warning:   oklch(0.78 0.17 85);  /* amarillo = warning */
  --admonitions-color-important: oklch(0.70 0.14 310); /* morado */
}
```

### 7.3 Integración Tailwind v4 pendiente

Tailwind v4 permite exponer CSS variables como tokens nativos usando `@theme`:

```css
/* Esto no existe y debería añadirse */
@theme {
  --radius-sm: 8px;
  --radius-md: 12px;
  --color-primary: var(--primary);
  --color-bg: var(--bg);
  /* etc. */
}
```

Sin esta integración, no se pueden usar clases como `rounded-sm` con los valores del sistema — hay que usar `rounded-[8px]` (valores arbitrarios).

### 7.4 Escala tipográfica no expuesta como Tailwind tokens

Los 7 tamaños de fuente custom que aparecen en los componentes (`text-[9px]` → `text-[15px]`) no tienen equivalente en la escala Tailwind por defecto. Necesitan mapeo:

| Valor actual (arbitrario) | Token que debería existir | Tailwind estándar más cercano |
|--------------------------|--------------------------|-------------------------------|
| `text-[9px]` | `--text-2xs: 0.5625rem` | No existe |
| `text-[10px]` | `--text-2xs: 0.625rem` | No existe → `text-xs` (12px) |
| `text-[11px]` | — | → `text-xs` (12px) |
| `text-[12px]` | — | `text-xs` ✓ |
| `text-[13px]` | — | → `text-sm` (14px) |
| `text-[14px]` | — | `text-sm` ✓ |
| `text-[15px]` | — | → `text-base` (16px) |

### 7.5 Auth components — sistema de color propio sin tokens

`components/auth/` usa una paleta dark hardcodeada completamente fuera del sistema. Para arreglarla se necesitaría un conjunto de tokens específico para superficies de autenticación, o simplemente migrar al sistema neutral existente:

```css
/* Lo que usa auth (hardcodeado) → lo que debería usar */
#181b25  →  var(--bg)
#252a3a  →  var(--border)
#eef0f7  →  var(--text-primary)
#4a5070  →  var(--text-tertiary)
#6b7191  →  var(--text-secondary)
```

### 7.6 StatCard — paleta semántica extendida ausente

`components/layout/StatCard.tsx` necesita colores para 4 categorías (streak, accuracy, XP, goal) que el sistema semántico actual no cubre. Opciones:

- **Opción A:** Usar los colores semánticos existentes mapeados por categoría (success=accuracy, warning=XP, error=streak, primary=goal)  
- **Opción B:** Añadir variables de "categorías de progreso" al sistema:

```css
--progress-streak:  oklch(0.65 0.18 290);  /* morado */
--progress-xp:      oklch(0.72 0.17 80);   /* ámbar */
--progress-accuracy: var(--success);       /* verde */
--progress-goal:    var(--primary);        /* acento del usuario */
```

---

## Resumen de estado del sistema

| Área | Estado | Prioridad |
|------|--------|-----------|
| Sistema OKLCH primario | ✅ Bien definido | — |
| Neutrales y superficies | ✅ Completo | — |
| Colores semánticos | ✅ Completo | — |
| Border radius como variables | ❌ No existen | Alta |
| Sombras como variables | ❌ No existen | Media |
| Variables de admonitions | ❌ Rotas/faltantes | Alta |
| `--btn-plain-bg` | ❌ Rota | Alta |
| `--font-display` | ❌ Rota | Baja |
| Integración Tailwind @theme | ❌ No existe | Alta |
| Auth components tokenizados | ❌ Hardcodeado | Alta |
| StatCard tokenizada | ❌ Hardcodeado | Media |
| Clases utilitarias usadas | ⚠️ ~50% sin uso detectado | Baja |

---

## 8. Enforcement Log — Spacing Standardization (2026-05-04)

**Branch:** `design-system-enforcement`  
**Task:** Remove arbitrary spacing values; replace with Tailwind scale (4px base unit)

### Changes Applied

Removed **8 arbitrary spacing values** across 5 components. All waveform and border decorations now use standardized Tailwind classes.

#### Summary by File

| File | Changes | Details |
|------|---------|---------|
| `components/home/HomeAudioOfDay.tsx` | 2 | `gap-[3px]` → `gap-0.5`, `w-[4px]` → `w-1` |
| `components/home/HomeWeakPhoneme.tsx` | 3 | `border-l-[3px]` → `border-l-2`, `gap-[3px]` → `gap-0.5`, `w-[3px]` → `w-1` |
| `components/sidebar/SidebarWordOfDay.tsx` | 2 | `gap-[3px]` → `gap-0.5`, `w-[3px]` → `w-1` |
| `components/ai-practice/pronunciation/WaveformIdle.tsx` | 1 | `gap-[3px]` → `gap-0.5` |
| `components/interview/WordChip.tsx` | 2 | `border-[5px]` → `border-4`, `border-[4px]` → `border-4` |

#### Mapping

| Old Value | New Class | Tailwind px | Impact |
|-----------|-----------|-------------|--------|
| `gap-[3px]` (4× waveforms) | `gap-0.5` | 2px | Tighter waveform density; negligible visual change |
| `w-[4px]` (bar width) | `w-1` | 4px | Exact match; no change |
| `w-[3px]` (bar width) | `w-1` | 4px | ~1px increase; bars maintain readability |
| `border-l-[3px]` (card accent) | `border-l-2` | 2px | Subtle border; maintains visibility |
| `border-[5px]` (tooltip arrow) | `border-4` | 4px | Tooltip arrow proportionally adjusted |
| `border-[4px]` (tooltip inner) | `border-4` | 4px | Exact match |

✅ **No large-value arbitraries flagged.** All `w-[Npx]`, `h-[Npx]`, `max-w-[Npx]` values ≥ 20px kept as-is (intentional layout dimensions, not spacing tweaks).
