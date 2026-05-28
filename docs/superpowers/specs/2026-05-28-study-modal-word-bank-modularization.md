# Spec: StudyModalWordBank — Modularización y UI Polish

**Date:** 2026-05-28  
**Branch:** design-system-enforcement  
**Scope:** Refactor + token cleanup + functional UI improvements

---

## Problema

`StudyModalWordBank.tsx` tiene 360 líneas con 4 responsabilidades mezcladas:
- Orquestación de estado (cargar cards, fase, stats, teclado)
- Pantallas de estado (loading, empty, done)
- Header con barra de progreso
- Flashcard con flip 3D

Viola la regla de 250 líneas de CLAUDE.md. Tiene abundantes `style={{}}` con tokens que deberían ser clases Tailwind.

---

## Diseño

### Estructura de archivos

```
components/vocabulary/decks/
  StudyModalWordBank.tsx          ← orquestación pura (~60 líneas)
  StudySessionCard.tsx            ← flashcard con flip 3D (renombre de WordBankStudyCard)
  StudySessionHeader.tsx          ← header + progress bar (nuevo)
  StudySessionScreens.tsx         ← loading / empty / done screens (nuevo)
  hooks/
    useStudySession.ts            ← toda la lógica de estado y teclado (nuevo)
```

### `useStudySession` — lógica extraída

Encapsula:
- Estado: `phase`, `queue`, `currentIndex`, `flipped`, `stats`
- `loadCards()` en `useEffect`
- `advanceCard()`, `handleRate()` con `useCallback`
- Keyboard handler (`Space`, `1`, `2`, `3`)

Retorna el estado y handlers necesarios para que `StudyModalWordBank` solo componga.

### `StudySessionHeader`

Props: `label`, `currentIndex`, `total`, `onClose`  
Muestra: botón back, label del deck, progress bar, contador `X/Y`.  
Progress bar: ancho dinámico via `style={{ width: \`${pct}%\` }}` (valor runtime), color via token class.

### `StudySessionScreens`

Exporta tres componentes pequeños:
- `StudyLoadingScreen` — spinner
- `StudyEmptyScreen({ label, onClose })` — "All caught up"
- `StudyDoneScreen({ stats, label, onClose, onStudyAgain })` — grid de stats + acciones

### `StudySessionCard` (renombre de `WordBankStudyCard`)

Sin cambios de lógica. Limpieza de `style={{}}`:
- Card container: `bg-[var(--card-bg)] border-[var(--line-divider)] rounded-2xl shadow-sm`
- Skip button: clases Tailwind (`border border-border-subtle text-fg-subtle rounded-lg px-2 py-1 text-xs`)
- IPA speak button: mismo patrón
- Dashed divider: `border-t border-dashed border-border-subtle`
- Los `style={{}}` que quedan: `backfaceVisibility`, `transform`, `perspective`, `transformStyle`, `transition` (valores 3D que no tienen utilidad Tailwind estándar)

### `StudyModalWordBank` resultante

Solo orquesta: invoca el hook, decide qué pantalla mostrar, compone header + card + rating bar.

---

## Reglas de estilo aplicadas

- `style={{}}` solo para valores computados en runtime: ancho del progress bar (%), transforms 3D
- Colores, radios, sombras → tokens via clase Tailwind `bg-[var(--token)]`, `border-[var(--token)]`, `text-[var(--token)]`
- Spacing y rounded → clases Tailwind estándar, no hardcode

---

## UI Polish funcional

- Spinner de loading: usa `border-[var(--primary)]` en clase, no `style`
- Done screen: separación visual más clara entre stats y acciones
- Card skip button: estilo consistente con el resto del sistema de botones
- Rating bar: ya está en `StudyRatingBar.tsx` — se reutiliza el existente

---

## Archivos que NO cambian

- `StudyRatingBar.tsx` — ya está extraído, se reutiliza
- `study-utils.ts` — sin cambios
- `StudyDifficultyButtons.tsx` — sin cambios
