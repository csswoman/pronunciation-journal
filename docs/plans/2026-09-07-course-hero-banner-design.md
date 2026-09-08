# Rediseño del Banner "Tu siguiente lección" en Cursos (/courses)

**Fecha**: 2026-09-07  
**Estado**: Aprobado por el usuario  
**Contexto**: El usuario solicitó adaptar la tarjeta de "Tu siguiente lección" en `/courses` al diseño del mockup suministrado, incorporando ilustración provisional temática (Big Ben con bocadillos de saludo en inglés), barra de progreso de unidad y CTA tipo pill.

---

## 1. Objetivos

1. **Fidelidad al mockup**: Recrear la estructura visual de la tarjeta hero con kicker contextual (`A1 · FUNDAMENTOS`), título prominente, descripción de la lección, barra de progreso con contador (`X / Y completadas`) y tiempo estimado (`⏱ X min`), y botón de acción pill (`Continuar →`).
2. **Ilustración temática vectorial SVG**: Crear `CourseHeroIllustration.tsx` con silueta estilizada de Londres / Big Ben, esferas de reloj, nubes decorativas y bocadillos con *"Hello!"* y *"Nice to meet you!"*.
3. **Respeto a tokens semánticos**: Cero colores fijos arbitrarios. Utilizar `var(--primary)`, `color-mix(in srgb, var(--primary) ...)` y clases semánticas de Tailwind v4 para soporte automático de cualquier `--hue` dinámico y modo oscuro (`.dark`).
4. **Responsive & Accesibilidad**: En móviles (`< sm`), la tarjeta mantiene el contenido y el CTA en primer plano ergonómico mientras la ilustración se adapta o compacta de forma natural.

---

## 2. Arquitectura de Componentes

### Componentes involucrados:
- [`CourseHeroIllustration.tsx`](file:///d:/proyectos/english-journal/components/courses/CourseHeroIllustration.tsx) **[NUEVO]**
  - Ilustración SVG pura accesible con `aria-hidden="true"`.
  - Gradientes y rellenos construidos con tokens dinámicos (`currentColor`, `var(--primary)`, etc.).
- [`CoursePathHeroBanner.tsx`](file:///d:/proyectos/english-journal/components/courses/CoursePathHeroBanner.tsx) **[MODIFICAR]**
  - Tarjeta de enlace o bloque contenedor con link semántico (`next/link`).
  - Subcomponentes planeados:
    - `HeroHeader`: Kicker (`${levelSpine} · ${category}`).
    - `HeroContent`: Título (`lesson.title`) y descripción pedagógica (`lesson.description ?? lesson.keywords`).
    - `HeroProgress`: Barra de progreso de la unidad, contador de lecciones completadas (`${completed} / ${total} completadas`) y tiempo estimado con icono de reloj.
    - `HeroAction`: Botón pill interactivo `Continuar →` / `Comenzar →`.
    - `CourseHeroIllustration`: Renderizado a la derecha.
- [`CoursePathProgressClient.tsx`](file:///d:/proyectos/english-journal/components/courses/CoursePathProgressClient.tsx) **[MODIFICAR]**
  - Calcular la unidad activa a la que pertenece `currentLesson` (o `firstLesson`), el total de lecciones de la unidad y cuántas se han completado.
  - Suministrar estos datos a `CoursePathHeroBanner`.
- [`lib/courses/types.ts`](file:///d:/proyectos/english-journal/lib/courses/types.ts) y [`lib/courses/buildCurriculum.ts`](file:///d:/proyectos/english-journal/lib/courses/buildCurriculum.ts) / [`lib/courses/level-curriculum-order.ts`](file:///d:/proyectos/english-journal/lib/courses/level-curriculum-order.ts) **[MODIFICAR]**
  - Agregar soporte opcional para `description?: string` en `CoursePathLesson` y `CourseInput` para describir el objetivo de la lección (ej. *"Aprende a presentarte y a formar tus primeras frases en inglés."* para `a1-ingles-principiantes`).

---

## 3. Verificación
- `pnpm type-check` y `pnpm lint` limpios.
- Pruebas visuales en tema claro y oscuro, y verificación de responsividad móvil/escritorio.
