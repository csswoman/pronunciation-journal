# Plan 082: Consolidar variantes redundantes en los registros de ejercicios

> **Executor instructions**: Sigue este plan paso a paso. Corre cada comando de verificación y confirma la salida esperada antes de pasar al siguiente paso. Si ocurre algo de la sección "STOP conditions", detén la ejecución y reporta — no improvises. Al terminar, actualiza la fila de estado para este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a63525d0..HEAD -- lib/practice/exercise-renderer/generic-registry.tsx lib/practice/exercise-renderer/phoneme-registry.tsx components/phoneme-practice components/exercises`
> Si alguno de los archivos en scope cambió desde que se escribió este plan, compara los extractos de "Current state" contra el código vivo antes de proceder.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/075-consolidate-exercise-capabilities.md
- **Category**: tech-debt, pedagogy, ux
- **Planned at**: commit `a63525d0`, 2026-09-02

## Why this matters

El inventario actual de ejercicios contiene redundancias notables que generan duplicación de código en UI y fatiga cognitiva en el usuario al presentar mecánicas casi idénticas con envoltorios cosméticos distintos:
1. **En discriminación fonética (`phoneme-registry.tsx`):**
   Existen 5 ejercicios distintos para discriminación perceptual elemental: `pick_word`, `pick_sound`, `minimal_pair`, `ax_same_different` y `abx`. Los cinco miden si el estudiante distingue dos fonemas contrastantes reproduciendo audio y pidiendo presionar una de 2 o 3 opciones.
2. **En selección de opción múltiple (`generic-registry.tsx`):**
   `sentence_context` y `multiple_choice` presentan layouts y lógica de interacción casi idéntica (un prompt con oración incompleta y 4 botones de opción con feedback inmediato).

Este plan consolida la UI subyacente de discriminación auditiva y de selección múltiple en componentes base compartidos y robustos, reduciendo duplicación de estado y manteniendo el tipado discriminado en el registry sin romper sesiones activas.

## Current state

- `lib/practice/exercise-renderer/phoneme-registry.tsx:31-78`:
  ```tsx
  export const PHONEME_REGISTRY: Record<ExerciseType, PhonemeRegistryEntry> = {
    pick_word: { render: ... },
    pick_sound: { render: ... },
    minimal_pair: { render: ... },
    ax_same_different: { render: ... },
    abx: { render: ... },
    ...
  };
  ```
  Cada uno tiene su propio componente en `components/phoneme-practice/` con lógica duplicada de reproducción de audio, botones A/B, timer y gestión de resultados.
- `lib/practice/exercise-renderer/generic-registry.tsx:120-139`:
  Registra `sentence_context` (`SentenceContextExercise`) y `multiple_choice` (`MultipleChoiceExercise`) por separado.

## Commands you will need

| Purpose   | Command                                         | Expected on success |
|-----------|-------------------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                               | exit 0, no errors   |
| Tests     | `pnpm test -- exercise-renderer`                | all pass            |
| Tests     | `pnpm test -- phoneme-practice`                 | all pass            |
| Lint      | `pnpm lint`                                     | exit 0              |
| Audit     | `pnpm audit:hard-rules`                         | exit 0              |

## Scope

**In scope**:
- `components/phoneme-practice/AuditoryDiscriminationBase.tsx` (nueva primitiva unificada para discriminación A/B, AX y ABX)
- `components/phoneme-practice/PickWordExercise.tsx`
- `components/phoneme-practice/MinimalPairExercise.tsx`
- `components/phoneme-practice/ABXExercise.tsx`
- `components/phoneme-practice/AxSameDifferentExercise.tsx`
- `components/exercises/MultipleChoiceBase.tsx` (primitiva compartida para selección múltiple con oración)
- `lib/practice/exercise-renderer/generic-registry.tsx`
- `lib/practice/exercise-renderer/phoneme-registry.tsx`

**Out of scope**:
- No eliminar las claves de tipo discriminado en `lib/phoneme-practice/types.ts` ni en la base de datos (para no romper el historial guardado en `answer_history.exercise_type_id`).
- No alterar los ejercicios de producción oral (`speak_word`, `spoken_production`).

## Steps

### Step 1: Crear la primitiva `AuditoryDiscriminationBase`
- Crear `components/phoneme-practice/AuditoryDiscriminationBase.tsx` (≤220 líneas).
- Centralizar la orquestación común:
  - Control de reproducción de audio y estados de carga.
  - Renderizado de opciones con feedback táctil y visual accesible.
  - Medición de tiempo de respuesta (`timeMs`).
  - Emisión normalizada de `onSubmit`.
- Adaptar `PickWordExercise`, `MinimalPairExercise`, `ABXExercise` y `AxSameDifferentExercise` para delegar su renderizado en esta primitiva común pasando solo sus variantes de configuración (ej. 2 opciones léxicas vs. pares AX vs. triplete ABX).

### Step 2: Unificar la presentación de `sentence_context` y `multiple_choice`
- Extraer el layout y gestión de opciones de `MultipleChoiceExercise.tsx` a un componente desacoplado reutilizable.
- Hacer que `SentenceContextExercise` consuma la misma estructura visual, eliminando estilos dispares y lógica redundante de selección.

### Step 3: Verificación de regresión en los Registries
- Verificar que `renderPhonemeExercise` y `renderGenericExercise` continúen devolviendo las vistas correctas sin advertencias de React ni desajustes de tipos.
- Comprobar la galería de pruebas interna (`/test`).

### Step 4: Verificación
- Correr `pnpm test -- exercise-renderer`.
- Correr `pnpm test -- phoneme-practice`.
- Correr `pnpm type-check` y `pnpm lint`.

## STOP conditions
- Si la unificación altera el payload emitido en `onSubmit` hacia `recordActivitySession` o `answer_history`, detenerse y asegurar que el contrato exacto de `PracticeResult` se mantenga idéntico.
