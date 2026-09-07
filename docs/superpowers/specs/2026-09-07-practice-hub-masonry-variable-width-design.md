# Practice Hub — Masonry con anchos variables

**Fecha:** 2026-09-07
**Ruta afectada:** `/practice` (`app/(authenticated)/practice`)
**Objetivo:** El grid de tarjetas de `/practice` debe fluir tipo masonry (Pinterest) tanto en alto como en ancho: cada tarjeta mide solo lo que su contenido necesita (sin estirarse) y ocupa 1 o 2 columnas según su tipo, con una tarjeta hero a ancho completo. Sin huecos verticales.

## Problema actual

`PracticeOptionsGrid` usa CSS Columns (`column-width: 320px; column-fill: balance`). Consecuencias:

- `column-fill: balance` reparte las tarjetas para igualar la altura de las columnas, produciendo flujo vertical desequilibrado y sensación de tarjetas estiradas.
- CSS Columns **no permite** que un item ocupe varias columnas, así que no se puede tener tarjetas de ancho variable.
- Las tarjetas llevan `h-fit`, que pelea con cualquier layout de grid.

## Solución

CSS Grid de columnas finas + `grid-auto-rows` pequeño + un hook que mide el alto real de cada tarjeta y le asigna `grid-row: span N`. Esto produce masonry verdadero con control de ancho por tarjeta.

### Layout responsive

| Breakpoint | Layout | Hook activo |
| - | - | - |
| `< 768px` | `flex; flex-direction: column`. Tarjetas en orden lógico, altura natural, ancho completo. | No |
| `768px–1023px` | `grid-template-columns: repeat(2, 1fr)`, spans recortados a máx 2. | Sí |
| `≥ 1024px` | `grid-template-columns: repeat(4, 1fr)`, spans completos (1, 2, 4). | Sí |

El **orden de render se mantiene** (orden lógico de los componentes). El masonry solo ajusta alturas de fila; no reordena tarjetas.

## Componentes

### 1. `hooks/useMasonryLayout.ts` — nuevo

Hook que recibe un `RefObject<HTMLElement>` al contenedor grid.

Responsabilidad única: mantener `style.gridRowEnd` de cada hijo directo sincronizado con su alto real, para que el grid se comporte como masonry.

Comportamiento:

- En cliente, tras el layout (`useLayoutEffect`), para cada hijo directo `.practice-hub__masonry-item`:
  - Lee `getComputedStyle(container)` → `grid-auto-rows` (alto de fila base) y `row-gap` (gap).
  - Mide `child.getBoundingClientRect().height`.
  - Calcula `span = Math.ceil((height + gap) / (rowBase + gap))`.
  - Setea `child.style.gridRowEnd = \`span \${span}\``.
- `ResizeObserver` sobre el contenedor **y** cada hijo directo → recalcula en cualquier cambio de tamaño (contenido async como `dueCount`, imágenes, cambio de viewport).
- Cuando `matchMedia('(max-width: 767px)')` matchea: limpia todos los `style.gridRowEnd` (los pone a `''`) y no observa nada — el CSS `flex column` toma el control. Usa el hook existente `useMediaQuery` para reaccionar al cambio de breakpoint.
- Si `typeof ResizeObserver === 'undefined'`: añade `data-masonry-off` al contenedor y sale. (Ver Edge cases.)
- Cleanup en unmount: desconecta el `ResizeObserver`, quita listeners, limpia estilos inline y `data-masonry-off`.

`style` inline: el hook escribe `gridRowEnd` calculado en runtime directamente en el DOM (no vía JSX `style={{}}`). Esto es un valor calculado en runtime, permitido por las reglas de estilo de `CLAUDE.md`.

### 2. `PRACTICE_CARD_SPANS` — mapa de spans fijo por tipo

Constante en `components/practice/hub/PracticeOptionsGrid.tsx` (colocación local; el mapa solo lo consume este componente).

```ts
// span = columnas que ocupa en DESKTOP (grid de 4). Tablet aplica min(span, 2).
const PRACTICE_CARD_SPANS = {
  recommended: 4,   // hero: ilustración + CTAs anchos
  soundQuiz: 2,     // fonemas + sub-tiles
  games: 2,         // grid interno de 2 juegos
  coach: 2,         // 2 botones + ilustración
  vocabulary: 1,
  decks: 1,
  immersion: 1,
  reader: 1,
  course: 1,
  reference: 1,
} as const
```

### 3. `components/practice/hub/PracticeOptionsGrid.tsx` — refactor

- Props sin cambios (`recommendation`, `dueCount`, `vocabLearnedCount`, `vocabTotalCount`, `arc`).
- `const gridRef = useRef<HTMLDivElement>(null)` + `useMasonryLayout(gridRef)`.
- El contenedor `<div className="practice-hub__masonry" ref={gridRef}>`.
- Cada wrapper de tarjeta: `<div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.xxx}>`. Los wrappers son hijos directos del grid.
- Actualizar el bloque de comentario "Planned structure" para reflejar la nueva técnica (CSS Grid + hook, no CSS Columns).

### 4. `app/styles/practice-hub.css` — reescribir `.practice-hub__masonry*`

```css
.practice-hub__masonry {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 768px) {
  .practice-hub__masonry {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 8px;
    gap: var(--space-5);
    align-items: start;
  }

  .practice-hub__masonry-item {
    grid-column: span 1;
  }

  .practice-hub__masonry-item[data-span='2'],
  .practice-hub__masonry-item[data-span='4'] {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .practice-hub__masonry {
    grid-template-columns: repeat(4, 1fr);
  }

  .practice-hub__masonry-item[data-span='2'] {
    grid-column: span 2;
  }

  .practice-hub__masonry-item[data-span='4'] {
    grid-column: span 4;
  }
}

/* Fallback sin ResizeObserver: grid normal, cada item en fila natural */
.practice-hub__masonry[data-masonry-off] .practice-hub__masonry-item {
  grid-row: auto;
}
```

Se eliminan de las reglas actuales: `column-width`, `column-gap`, `column-fill`, `display: inline-block`, `margin-bottom`, `break-inside` (todo era de CSS Columns).

### 5. Tarjetas del hub — quitar `h-fit`

`h-fit` fuerza la altura al contenido y entra en conflicto con `grid-auto-rows` + span calculado. Quitar la clase `h-fit` de:

- `RecommendedPracticeCard.tsx`
- `CoachCallCard.tsx`
- `GamesSection.tsx`
- `ReferenceSection.tsx`
- `VocabularyReviewCard.tsx`
- `DecksCard.tsx`
- `ImmersionCard.tsx`
- `ReaderCard.tsx`
- `CourseCard.tsx`
- `SoundQuizWidget.tsx` (verificar; quitar solo si está presente)

Cambio de 1 clase por archivo. El grid ya da la altura exacta vía span, así que no hay estiramiento.

## Flujo de datos

```
PracticeHubClient
  └─ PracticeOptionsGrid (props sin cambios)
       ├─ render de items con data-span desde PRACTICE_CARD_SPANS
       └─ useMasonryLayout(gridRef)
            ├─ useLayoutEffect: mide alto real de cada item → gridRowEnd
            ├─ ResizeObserver(container + cada hijo): re-mide en cambios
            └─ useMediaQuery('(max-width: 767px)'): limpia estilos en móvil
```

## Edge cases y manejo de errores

- **Sin `ResizeObserver`:** el hook pone `data-masonry-off` en el contenedor y sale. El CSS `[data-masonry-off]` fuerza `grid-row: auto` + `align-items: start` → grid normal, cada tarjeta en su fila natural. Puede quedar algún hueco pero no se rompe. (Navegadores relevantes lo soportan desde hace años; es defensa mínima.)
- **Tarjeta que cambia de alto** (imágenes que cargan, `dueCount` async, contenido de coach): el `ResizeObserver` sobre cada hijo lo capta y recalcula el span.
- **Offline:** sin impacto. Todo es layout de cliente, cero red.
- **SSR / hidratación:** el grid CSS se renderiza server-side. El cálculo de spans corre solo en cliente en `useLayoutEffect` (antes del paint) para minimizar el flash de layout de "1 row-base". Antes del primer cálculo las tarjetas comparten una fila mínima; `useLayoutEffect` lo corrige antes de que el usuario lo vea.
- **Móvil:** el hook no observa ni escribe estilos; `flex column` con altura natural. Cero coste JS de layout en móvil.

## Testing

- `hooks/__tests__/useMasonryLayout.test.ts` (Vitest + jsdom):
  - Mock de `ResizeObserver` y `getComputedStyle` (devolver `grid-auto-rows: 8px`, `row-gap: 20px`).
  - Montar contenedor con 3 hijos de alturas conocidas → verificar `gridRowEnd` correcto (`span N` esperado).
  - Simular `matchMedia('(max-width: 767px)')` = true → verificar que los estilos inline se limpian.
  - Simular ausencia de `ResizeObserver` → verificar `data-masonry-off` en el contenedor.
  - Verificar cleanup en unmount (observer desconectado, estilos limpios).
- `components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx` (nuevo):
  - Renderizar el grid con props mínimas → verificar que cada wrapper de tarjeta tiene el `data-span` esperado según `PRACTICE_CARD_SPANS`.
- `pnpm type-check` y `pnpm lint` limpios.
- Los tests existentes de tarjetas (`GamesSection.test.tsx`) siguen pasando.

## Archivos tocados

| Archivo | Cambio |
| - | - |
| `hooks/useMasonryLayout.ts` | **nuevo** — hook de masonry |
| `hooks/__tests__/useMasonryLayout.test.ts` | **nuevo** — tests del hook |
| `components/practice/hub/PracticeOptionsGrid.tsx` | mapa `PRACTICE_CARD_SPANS`, `useMasonryLayout`, `data-span` en wrappers |
| `components/practice/hub/__tests__/PracticeOptionsGrid.test.tsx` | **nuevo** — verifica spans |
| `app/styles/practice-hub.css` | reescribir `.practice-hub__masonry` y `.practice-hub__masonry-item` |
| `components/practice/hub/RecommendedPracticeCard.tsx` | quitar `h-fit` |
| `components/practice/hub/CoachCallCard.tsx` | quitar `h-fit` |
| `components/practice/hub/GamesSection.tsx` | quitar `h-fit` |
| `components/practice/hub/ReferenceSection.tsx` | quitar `h-fit` |
| `components/practice/hub/VocabularyReviewCard.tsx` | quitar `h-fit` |
| `components/practice/hub/DecksCard.tsx` | quitar `h-fit` |
| `components/practice/hub/ImmersionCard.tsx` | quitar `h-fit` |
| `components/practice/hub/ReaderCard.tsx` | quitar `h-fit` |
| `components/practice/hub/CourseCard.tsx` | quitar `h-fit` |
| `components/practice/hub/SoundQuizWidget.tsx` | quitar `h-fit` si está presente |

## Fuera de alcance

- Rediseño del contenido interno de las tarjetas.
- Añadir footer-stats nuevos a las tarjetas (eso era la opción "grid por filas", descartada).
- Cambiar qué tarjetas aparecen o su orden lógico.
- Animaciones de reflow del masonry.
