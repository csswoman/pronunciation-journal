# Plan 010: La app propone el checkpoint cuando el alumno está listo para subir de nivel

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/home lib/courses/curriculum.ts lib/courses/assessment.ts components/courses/CoursePathAsideProgress.tsx components/courses/CoursePathLevelPicker.tsx components/courses/CoursePathProgressClient.tsx "app/(authenticated)/page.tsx" components/home`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (aditivo)
- **Depends on**: 007 (la ruta valida que el checkpoint sea del nivel resuelto o el siguiente), 008 (lectura del nivel)
- **Category**: direction / correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

La app tiene toda la maquinaria de promoción (contratos por nivel, umbrales,
`nextLevel`, `failureFallback`), pero nada la dispara: los tres únicos
enlaces al checkpoint están en asides de la Ruta y apuntan al nivel que el
usuario está **navegando**, no al suyo. Para la inmensa mayoría de alumnos
el nivel queda congelado tras el placement. El usuario pidió una app que
"haga avanzar el inglés"; sin esto la app evalúa una vez y nunca vuelve a
mover el nivel. Este plan añade la señal de "listo para el checkpoint" a
partir de lecciones completadas y evidencia de temas, y un CTA en Home.

## Current state

`lib/courses/curriculum.ts:491-548`:
```ts
const REQUIRED_ASSESSMENT_SLUGS: Record<CefrLevelId, string[]> = { a1: ["a1-verbo-to-be", "a1-presente-simple", ...6 slugs], a2: [...], ... };
export const LEVEL_ASSESSMENT_CONTRACTS = {
  a1: { level: "a1", questionTypes: [...], minimumCorrect: 4, questionCount: 6, requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.a1, failureFallback: "a1" },
  a2: { ..., requiredLessonSlugs: REQUIRED_ASSESSMENT_SLUGS.a2, failureFallback: "a1" }, ...
```
`requiredLessonSlugs` solo se usa en `curriculum.ts:574` para construir preguntas; nadie lo compara con lecciones completadas.

`lib/courses/assessment.ts:124-127` y `:207-211`: `nextLevel(checkpointLevel)` cuando `mode === "checkpoint"` y pasa.

Enlaces actuales: `components/courses/CoursePathAsideProgress.tsx:125`,
`CoursePathLevelPicker.tsx:86`, `CoursePathProgressClient.tsx:213` →
`/assessment?mode=checkpoint&level=${selectedLevelId}`.

Home: `lib/home/placement-state.ts` (`getHomePlacementState` → `{ hasPlacement, hasMeaningfulProgress }`
consultando `assessment_results`, `answer_history`, `word_bank`, `user_contrast_progress`),
`lib/home/primary-action.ts` (`resolvePrimaryAction({ hasPlacement, planDoneToday, dueCount, estimatedMinutes })`),
`app/(authenticated)/page.tsx:115-117` y `:147-150` los consumen. Tests:
`lib/home/__tests__/placement-state.test.ts`, `primary-action.test.ts`.

Lecciones completadas: tabla `lesson_completions` (`user_id, course_slug, lesson_slug, completed_at`),
escritas por `lib/courses/queries.ts:recordLessonComplete`. Lectura servidor
de ejemplo: `lib/progress/domain-queries.ts:40-77` (`lessonCompletionsResult`).
Estado de temas: `lib/progress/domain-queries.ts` (`topics` con `srsStatus`,
`repetitions`, `intervalDays`) y `lib/progress/topic-progress.ts:classifyTopicProgress`.

Mapa tema→deck: `lib/practice/topic-decks.ts` (`deckSlugForTopic`).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm vitest run lib/home components/home lib/courses components/courses` | all pass |

## Scope

**In scope**:
- `lib/home/checkpoint-readiness.ts` (crear) + `lib/home/__tests__/checkpoint-readiness.test.ts`
- `lib/home/queries.ts` (una query servidor nueva para lecciones completadas + temas del nivel, si no existe ya una reutilizable en `lib/progress/domain-queries.ts`; prefiere reutilizar)
- `lib/home/primary-action.ts` y test
- `app/(authenticated)/page.tsx` (pasar la señal)
- `components/home/HomeCheckpointCard.tsx` (crear, ≤120 líneas) + test
- `components/courses/CoursePathAsideProgress.tsx`, `CoursePathLevelPicker.tsx`, `CoursePathProgressClient.tsx` (enlace al nivel **resuelto**, no al navegado)

**Out of scope**:
- Cambiar `LEVEL_ASSESSMENT_CONTRACTS`, umbrales o `failureFallback`.
- Escritura del nivel (plan 007).
- El diseño visual más allá de los tokens existentes (usar `PastelCard` o la tarjeta neutra que ya usa `HomeStatsRow`; ver `components/home/HomeDailyCard.tsx` como patrón).

## Git workflow

- Rama: `advisor/010-checkpoint-readiness` desde `dev`.
- Commits convencionales, ej. `feat(home): suggest level checkpoint when required lessons are done`.

## Steps

### Step 1: Función pura de preparación

Crea `lib/home/checkpoint-readiness.ts`:

```ts
import { LEVEL_ASSESSMENT_CONTRACTS } from '@/lib/courses/curriculum'
import type { CefrLevelId } from '@/lib/courses/types'

export interface CheckpointReadinessInput {
  level: CefrLevelId                       // nivel resuelto del alumno
  completedLessonSlugs: ReadonlySet<string>
  /** slugs de deck cuyo topic_srs está mastered o review con repetitions >= 2 */
  evidencedDeckSlugs: ReadonlySet<string>
  lastCheckpointAt?: string | null        // assessment_results.mode='checkpoint' más reciente
  now?: number
}
export interface CheckpointReadiness {
  ready: boolean
  level: CefrLevelId
  requiredTotal: number
  completedRequired: number
  evidencedRequired: number
  missingSlugs: string[]
  reason: 'ready' | 'lessons_missing' | 'no_evidence' | 'recent_attempt' | 'max_level'
}
export function computeCheckpointReadiness(input): CheckpointReadiness
```

Reglas (deterministas y visibles):
- `c2` → `max_level`, `ready: false`.
- `required = LEVEL_ASSESSMENT_CONTRACTS[level].requiredLessonSlugs`.
- `ready` si **todas** las requeridas están completadas **y** al menos la
  mitad (redondeo hacia arriba) tienen evidencia en `evidencedDeckSlugs`, y
  no hubo un checkpoint en los últimos 3 días (`recent_attempt`).
- `missingSlugs` = requeridas no completadas.

Test `lib/home/__tests__/checkpoint-readiness.test.ts` (patrón:
`primary-action.test.ts`): ready; faltan lecciones; sin evidencia; intento
reciente; c2.

**Verify**: `pnpm vitest run lib/home/__tests__/checkpoint-readiness.test.ts` → all pass.

### Step 2: Query servidor

En `lib/home/queries.ts` añade `getCheckpointReadiness(userId, level: CefrLevelId)`:
- lee `lesson_completions` (`lesson_slug`) del usuario;
- lee `topic_srs` del usuario y mapea a slug de deck con `deckSlugForTopic`
  (mira cómo lo hace `lib/progress/topic-progress.ts:buildTopicStatusByDeck`
  y reutiliza esa función si acepta las filas que obtienes);
- lee el `completed_at` más reciente de `assessment_results` con `mode='checkpoint'`
  (tolera tabla ausente igual que `placement-state.ts:isMissingTable`);
- devuelve `computeCheckpointReadiness(...)`.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Home muestra el CTA

1. En `app/(authenticated)/page.tsx`, junto a `getHomePlacementState`, llama
   a `getCheckpointReadiness(userId, learnerLevel)` (el nivel resuelto ya se
   obtiene en la página o en `lib/home/queries.ts:313`; reutilízalo) solo si
   `placementState.hasPlacement`. Envuélvelo con el mismo helper de
   tolerancia a fallos que usa la página para las otras queries (busca
   `"placement state"` en la página para ver el patrón).
2. Crea `components/home/HomeCheckpointCard.tsx` que reciba
   `readiness: CheckpointReadiness` y renderice:
   - si `ready`: título "Listo para el checkpoint {nivel siguiente}",
     subtítulo con `completedRequired/requiredTotal` lecciones y enlace
     `/assessment?mode=checkpoint&level={level}` (el **nivel actual**; el
     servidor asigna el siguiente si se aprueba).
   - si `lessons_missing`: "Te faltan N lecciones para el checkpoint" con
     enlace a la primera de `missingSlugs` (`/courses/study/{slug}`).
   - en los otros casos no renderiza nada.
3. Móntalo en `components/home/HomeLayout.tsx` (o donde se compone la columna
   principal; busca dónde se monta `HomePlacementPrompt` y ponlo en la misma
   zona, solo cuando `hasPlacement`).
4. `resolvePrimaryAction`: añade `checkpointReady?: boolean`; si es true y
   `planDoneToday`, la acción secundaria pasa a ser el checkpoint
   (`label: 'Hacer el checkpoint'`, `href` como arriba). No desplaza el plan
   diario pendiente.

**Verify**: `pnpm vitest run components/home lib/home` → all pass (añade test de `HomeCheckpointCard` con los tres estados y amplía `primary-action.test.ts`).

### Step 4: Los enlaces de la Ruta usan el nivel resuelto

En los tres componentes de `components/courses/` que enlazan al checkpoint,
cambia `level=${selectedLevelId}` por `level=${learnerLevelId}` donde
`learnerLevelId` provenga del nivel resuelto (ya lo reciben como prop o lo
pueden derivar de `useUserPreferences().learnerLevel` tras el plan 008).
Si el usuario navega un nivel distinto al suyo, muestra el texto
"Checkpoint de tu nivel ({nivel})" para que no parezca que salta niveles.

**Verify**: `pnpm vitest run components/courses` → all pass. `grep -n "level=\${selectedLevelId}" components/courses` → 0.

### Step 5: Cierre

**Verify**: `pnpm type-check`, `pnpm lint` → exit 0.

## Test plan

- `checkpoint-readiness.test.ts`: 5 casos.
- `HomeCheckpointCard.test.tsx`: ready / lessons_missing / oculto.
- `primary-action.test.ts`: `checkpointReady` con plan hecho.
- `CoursePathPage.test.tsx` existente: actualizar el href esperado.

## Done criteria

- [ ] `pnpm type-check`, `pnpm lint` exit 0
- [ ] Tests listados pasan
- [ ] `grep -rn "requiredLessonSlugs" lib --include=*.ts | grep -v __tests__ | wc -l` ≥ 2 (ahora se usa para readiness además de para construir preguntas)
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- `lesson_completions` no guarda los slugs con el mismo formato que
  `REQUIRED_ASSESSMENT_SLUGS` (comprueba con una fila real o con
  `recordLessonComplete`): reporta el formato antes de mapear.
- La página Home ya supera el presupuesto de queries y añadir una más rompe
  `pnpm test:perf:cold-nav` (si el operador lo ejecuta).

## Maintenance notes

- La regla de "mitad con evidencia" es una elección de producto; está en un
  solo sitio (`computeCheckpointReadiness`) para poder ajustarla.
- `failureFallback` sigue sin aplicarse (un checkpoint fallido no baja el
  nivel). Decisión deferida al propietario; anotada como follow-up.
- Revisor: el CTA nunca debe aparecer sin placement previo ni para `c2`.
