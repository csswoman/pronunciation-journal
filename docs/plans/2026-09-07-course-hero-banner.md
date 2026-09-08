# Rediseño del Banner "Tu siguiente lección" en Cursos Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transformar el banner superior de "Tu siguiente lección" en `/courses` para que coincida fielmente con el diseño del mockup, incluyendo kicker de nivel/categoría, título destacado, descripción de lección, barra de progreso de unidad con métricas, botón pill `Continuar →`, e ilustración SVG vectorial temática de Londres/Big Ben con globos de diálogo adaptada al sistema de temas de la app.

**Architecture:** 
- Crear componente SVG vectorial accesible [`CourseHeroIllustration.tsx`](file:///d:/proyectos/english-journal/components/courses/CourseHeroIllustration.tsx) con tokens semánticos dinámicos.
- Extender el modelo de lecciones con soporte opcional de `description` para enriquecer la tarjeta.
- Reestructurar [`CoursePathHeroBanner.tsx`](file:///d:/proyectos/english-journal/components/courses/CoursePathHeroBanner.tsx) en una tarjeta de dos columnas (texto/progreso/CTA a la izquierda, ilustración a la derecha) respetando el límite de 250 líneas y las reglas de diseño de `CLAUDE.md`.
- Conectar progreso de la unidad activa desde [`CoursePathProgressClient.tsx`](file:///d:/proyectos/english-journal/components/courses/CoursePathProgressClient.tsx).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, CSS Tokens OKLCH (`var(--primary)`, `var(--surface-raised)`), Lucide/Icons.

---

### Task 1: Soporte de `description` en tipos y currículo de cursos

**Files:**
- Modify: `lib/courses/types.ts:60-90`
- Modify: `lib/courses/buildCurriculum.ts:12-50`
- Modify: `lib/courses/level-curriculum-order.ts:8-15`

**Step 1: Extender `CoursePathLesson` y `CourseInput`**
Añadir `description?: string` opcional a `CoursePathLesson` y `CourseInput`, mapeándolo en `toLesson`.

**Step 2: Añadir descripción a `a1-ingles-principiantes`**
En `level-curriculum-order.ts`, configurar:
`description: "Aprende a presentarte y a formar tus primeras frases en inglés."`

**Step 3: Verificar tipos**
Ejecutar: `pnpm type-check`
Resultado esperado: PASS

---

### Task 2: Crear la ilustración temática vectorial `CourseHeroIllustration.tsx`

**Files:**
- Create: `components/courses/CourseHeroIllustration.tsx`

**Step 1: Crear el componente SVG**
- Ilustración vectorial con Big Ben / torre de Londres, esferas de reloj, nubes decorativas y bocadillos con *"Hello!"* y *"Nice to meet you!"*.
- Usar colores semánticos con `color-mix(in srgb, var(--primary) ...)` y `currentColor`.
- Añadir `aria-hidden="true"` para accesibilidad.

**Step 2: Verificar tipos y sintaxis**
Ejecutar: `pnpm type-check`
Resultado esperado: PASS

---

### Task 3: Rediseñar `CoursePathHeroBanner.tsx` y actualizar estilos

**Files:**
- Modify: `components/courses/CoursePathHeroBanner.tsx`
- Modify: `app/styles/course-path.css:1010-1110`

**Step 1: Actualizar `CoursePathHeroBanner.tsx`**
- Declarar bloque de subcomponentes planeados:
  - `HeroHeader` (Kicker de nivel y categoría, ej. `A1 · FUNDAMENTOS`)
  - `HeroContent` (Título y descripción de la lección)
  - `HeroProgress` (Barra de progreso de unidad + contador `${completed} / ${total} completadas` + `⏱ ${duration}`)
  - `HeroAction` (Botón pill `Continuar →` / `Comenzar →`)
  - `CourseHeroIllustration` (Columna derecha)
- Mantener navegación accesible con `Link`.
- Código limpio < 250 líneas.

**Step 2: Ajustar estilos CSS en `app/styles/course-path.css`**
- Asegurar fondo con degradado suave en base a `var(--primary)` y `var(--surface-raised)`.
- Borde sutil, esquinas redondeadas (`var(--radius-2xl)`), sombra suave.
- Disposición flex/grid responsiva (en mobile la ilustración se adapta o compacta sin romper el layout).

**Step 3: Verificar tipos y linters**
Ejecutar: `pnpm type-check && pnpm lint`
Resultado esperado: PASS

---

### Task 4: Conectar métricas de unidad activa en `CoursePathProgressClient.tsx`

**Files:**
- Modify: `components/courses/CoursePathProgressClient.tsx:210-230`

**Step 1: Calcular unidad y métricas de completitud**
Identificar la unidad activa del `currentLesson` o `firstLesson`, calcular número de lecciones completadas y total de la unidad.

**Step 2: Pasar props a `CoursePathHeroBanner`**
Pasar `levelTitle`, `levelSpineLabel`, `unitCompletedCount` y `unitTotalCount`.

**Step 3: Pruebas y verificación integral**
- Ejecutar: `pnpm type-check && pnpm lint`
- Ejecutar test unitario existente si aplica: `pnpm vitest run components/courses/__tests__/CoursePathPage.test.tsx`
- Verificar visualmente y registrar en walkthrough.
