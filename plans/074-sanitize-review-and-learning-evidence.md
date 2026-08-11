# Plan 074: Sanear Repaso y la evidencia antes de conectar más superficies

> **Executor instructions**: Ejecuta este plan antes del 073. Sigue las fases en
> orden y confirma cada verificación antes de continuar. Conserva la separación
> entre actividad, completion, evidencia y scheduling. No crees un scheduler ni
> una tabla de progreso nuevos. Si ocurre una condición de STOP, reporta el
> hallazgo sin improvisar. Al terminar, actualiza esta fila en `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ce654374..HEAD -- hooks/useReviewSession.ts hooks/useEssentialWordsSession.ts lib/review lib/practice lib/progress lib/essential-words components/progress supabase/migrations`
>
> Hay cambios locales conocidos en `hooks/useEssentialWordsSession.ts`. Antes de
> editarlo, inspecciona `git diff -- hooks/useEssentialWordsSession.ts`, conserva
> cualquier trabajo ajeno y detente si modifica el mismo flujo de persistencia.

## Status

- **Priority**: P1 correctness/foundation
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans/059-separate-learning-evidence-and-lesson-completion.md, plans/061-make-srs-and-outbox-transactional.md, plans/062-fix-exercise-evidence-attribution.md
- **Blocks**: plans/073-connect-all-content-to-learning-loop.md
- **Category**: bug, tests, tech-debt, learning architecture
- **Planned at**: commit `ce654374`, 2026-08-10
- **Current status**: DONE (2026-08-10: topic-only queues are composed purely; answer-to-skill attribution is canonical and context-free; completions no longer score fluency; Essential Words persists stable immediate answers while deferred lapses only schedule SRS.)

## Why this matters

El Plan 073 conectará más contenido al ciclo de aprendizaje. Antes de ampliar
esas entradas, las salidas deben ser confiables: Repaso no puede descartar temas
válidos; cada intento evaluado debe persistirse exactamente una vez; y Progreso
no debe clasificar la misma respuesta con reglas distintas ni convertir una
lección completada en fluidez demostrada.

Este plan corrige esos fundamentos sin fusionar los SRS de `word_bank`,
`topic_srs`, pronunciación o Essential Words. El resultado es un contrato estable
sobre el que el Plan 073 puede conectar Ruta, Mazos, Mini-lecciones, Tracking y
misiones.

## Current state

### Repaso puede perder una cola formada solo por topics

- `lib/practice/daily-plan/composer.ts:99-105` calcula `nothingDue` antes de que
  el hook añada topics:

  ```ts
  const totalExercises = steps.reduce((sum, s) => sum + s.exercises.length, 0)
  return { steps, totalExercises, nothingDue: steps.length === 0 }
  ```

- `hooks/useReviewSession.ts:62-70` muta el array y aun así usa el booleano
  anterior:

  ```ts
  const topicSteps = topicResponse?.ok ? (await topicResponse.json()).steps ?? [] : []
  plan.steps.push(...topicSteps)
  if (plan.nothingDue || plan.steps.length === 0) setState({ phase: 'done' })
  ```

Un usuario con cero palabras/sonidos pero topics vencidos recibe `done`.

### Existen dos clasificadores de habilidades incompatibles

- `lib/progress/skill-matrix.ts:4-37` declara la matriz exhaustiva y establece
  que el contexto solo es procedencia.
- `lib/progress/activity-hub.ts:35-44` usa esa matriz para `activity_sessions`.
- `lib/progress/fluency-scores.ts:46-70` mantiene otra clasificación por IDs y
  contexto. Esa copia omite tipos modernos 15–23 o los clasifica incidentalmente.
- `lib/practice/types.ts:16-68` ya contiene el mapa canónico slug ↔ ID.
- `lib/progress/fluency-scores.ts:98-137` usa `lessonsCompleted` como retención de
  gramática/lectura. Sin respuestas, completion puede producir una puntuación de
  habilidad distinta de cero.
- `lib/progress/queries.ts:338-372` solo carga ID/context/resultado para el radar,
  aunque `answer_history.exercise_payload` puede conservar modalidad/attribution.

### Essential Words conserva su detalle internamente pero lo aplana al backbone

- `lib/essential-words/session-model.ts:18-43` convierte todos los modos no
  hablados en `fill_blank` ID 5; el modo real queda solo en `exercisePayload`.
- `lib/essential-words/runtime-attribution.ts:17-24` ya distingue reconocimiento,
  escucha y producción.
- `.env.example:11` mantiene `NEXT_PUBLIC_SKILL_MODEL_MODE=off` como default.
- `hooks/useEssentialWordsSession.ts:137-139` conserva fallos en
  `Map<wordId, quality>`; dos fallos de la misma palabra se colapsan.
- `hooks/useEssentialWordsSession.ts:648-675` registra evidencia runtime y añade
  cada resultado a la sesión, pero difiere el SRS fallido.
- `hooks/useEssentialWordsSession.ts:169-180` descarga luego un único grade con
  extras vacíos.
- `lib/essential-words/grade.ts:111-123` mezcla actualización SRS con escritura
  genérica a `answer_history`, usando `timeMs: 0`.
- `lib/essential-words/runtime-engine.ts:254-315` distribuye hoy la escritura
  entre legacy/on; cambiarlo sin caracterización puede duplicar respuestas.

## Target invariants

1. Una respuesta aceptada por un runner produce exactamente un
   `answer_history.id` estable e idempotente.
2. Una sesión completada produce exactamente un `activity_sessions` summary.
3. Reintentos de la misma palabra son respuestas distintas; la política SRS
   puede consolidarlos sin borrar la evidencia objetiva.
4. El contexto indica procedencia, no habilidad.
5. Slug, payload de modalidad y attribution explícita determinan habilidades.
6. `lesson_completions` contribuye a cobertura, nunca a un score de aprendizaje.
7. Filas históricas sin metadata se proyectan como legacy/unknown de forma
   conservadora; no se rellenan con habilidades inventadas.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused baseline | `pnpm exec vitest run lib/progress/__tests__/fluency-scores.test.ts lib/essential-words/__tests__/session-model.test.ts lib/essential-words/__tests__/runtime-attribution.test.ts --maxWorkers=1` | todos pasan |
| Review tests | `pnpm exec vitest run lib/review hooks/__tests__/useReviewSession* --maxWorkers=1` | todos pasan |
| Essential Words | `pnpm exec vitest run lib/essential-words hooks/__tests__/useEssentialWordsSession* --maxWorkers=1` | todos pasan |
| Progress | `pnpm exec vitest run lib/progress components/progress --maxWorkers=1` | todos pasan |
| State audit | `pnpm audit:state-duplication` | cero overlaps no permitidos |
| Types | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Diff hygiene | `git diff --check` | sin errores |

## Scope

**In scope**:

- `hooks/useReviewSession.ts`
- `lib/review/session-plan.ts` (crear) y tests
- `hooks/useEssentialWordsSession.ts`
- `lib/essential-words/session-model.ts`
- `lib/essential-words/runtime-engine.ts`
- `lib/essential-words/grade.ts`
- tests focalizados de Essential Words
- `lib/practice/types.ts` y `lib/practice/queries.ts` solo para identidad
  idempotente de answers
- `lib/progress/skill-matrix.ts`
- `lib/progress/fluency-scores.ts`
- `lib/progress/queries.ts`
- `components/progress/FluencyRadarCard.tsx` únicamente para copy honesta
- tests focalizados de Progress

**Out of scope**:

- Composición multi-superficie, frases, misiones y targets de teoría: Plan 073.
- Integrar o retirar tipos de ejercicio: Plan 075.
- Cambiar FSRS/SM-2, intervalos o presupuestos de Essential Words.
- Backfill que convierta completions históricas en evidencia.
- Rediseñar la página de Progreso; solo se admite el mínimo cambio de nombre/copy.
- Crear un nuevo sistema global de skills, mastery o eventos.

## Git workflow

- Branch sugerida: `codex/074-sanitize-learning-evidence`.
- Commits lógicos sugeridos:
  1. `fix(review): preserve topic-only review queues`
  2. `fix(progress): use canonical answer skill attribution`
  3. `fix(essential-words): persist every objective attempt once`
- Stagear paths explícitos. No incluir los cambios locales ajenos indicados por
  `git status --short`.
- No hacer push ni abrir PR sin instrucción del operador.

## Steps

### Step 1: Caracterizar los tres fallos antes de refactorizar

1. Crear `lib/review/__tests__/session-plan.test.ts` con una cola base vacía y
   un `topicStep`; el resultado debe contener el topic y `nothingDue=false`.
2. Extender `lib/progress/__tests__/fluency-scores.test.ts` para demostrar que:
   - completion sin answers no aumenta gramática ni lectura;
   - IDs/slugs 19–23 se clasifican mediante la matriz canónica;
   - el contexto `courses` por sí solo no inventa reading.
3. Añadir casos de integración Essential Words:
   - dos fallos de la misma palabra → dos answers, un único efecto SRS diferido;
   - `recognize_audio` conserva escucha/modalidad y tiempo;
   - un callback duplicado con el mismo attempt ID no duplica answer/outbox.

Los tests deben fallar por las razones descritas antes de implementar.

**Verify**: ejecutar cada archivo nuevo individualmente y guardar el fallo
esperado en la descripción del commit; ningún fallo debe deberse a fixtures o
imports inválidos.

### Step 2: Componer Repaso de forma pura y recalcular `nothingDue`

Crear `lib/review/session-plan.ts` con una función pura que reciba el plan base y
los topic steps, dedupe por `DailyStep.id`, devuelva un array nuevo y derive
`totalExercises`/`nothingDue` del resultado final. `useReviewSession.startReview`
debe consumir esa función y no mutar `plan.steps`.

No cambies la prioridad interna de `buildReviewPlan`; solo evita descartar
topics válidos.

**Verify**:
`pnpm exec vitest run lib/review/__tests__/session-plan.test.ts --maxWorkers=1`
→ cubre base vacía + topics, base poblada, dedupe y cola realmente vacía.

### Step 3: Establecer una sola resolución answer → habilidades

Extender `lib/progress/skill-matrix.ts` o crear un módulo hermano pequeño que
acepte:

- `slug: ExerciseSlug | null`;
- `exercisePayload` desconocido validado de forma defensiva;
- attribution explícita cuando exista.

Orden de autoridad:

1. attribution explícita y versionada;
2. slug + modo Essential Words reconocido;
3. `skillsForSlug(slug)`;
4. legacy unknown, sin inferir desde `context`.

Derivar el slug histórico usando `EXERCISE_TYPE_IDS`; no mantener otro conjunto
manual de números. Para Essential Words, reutilizar las categorías de
`runtime-attribution.ts`: audio/dictation/listening-cloze aportan listening;
producción escrita/oral solo aporta la habilidad que la evidencia permite. Todo
intento Essential Words sigue aportando vocabulary como dominio, pero no
pronunciation si solo hubo STT/transcript matching.

Modificar `getFluencyProfile` para seleccionar `exercise_payload` y el slug de
`exercise_types`, y pasar esa metadata al resolver común. Si la relación
Supabase tipada no puede exponer el slug sin casts inseguros, crear una inversión
exhaustiva de `EXERCISE_TYPE_IDS` y probar duplicados; no reintroducir sets
manuales.

**Verify**:
`pnpm exec vitest run lib/progress --maxWorkers=1` → todos pasan y cada slug con
DB ID tiene clasificación caracterizada.

### Step 4: Sacar completion del score de aprendizaje

Eliminar `lessonsCompleted` de `retentionForSkill` y de cualquier cálculo de
gramática/reading en `fluency-scores.ts`. No borres el dato de la página: seguirá
siendo cobertura y el Plan 073 lo presentará como tal.

La comparación semanal debe usar solo evidencia dentro de cada ventana. No
inyectar el estado acumulado actual de word bank o completions en las dos
ventanas como si hubiera ocurrido en ambas semanas.

Cambiar el título/copy de `FluencyRadarCard` a una formulación honesta como
`Perfil de práctica` mientras siga siendo una puntuación compuesta. Antes de
tocar UI, leer `PRODUCT.md`, `DESIGN.md`, `THEME_SYSTEM.md` y
`docs/design/visual-language.md`; no cambiar layout ni tokens.

**Verify**:

- `pnpm exec vitest run lib/progress components/progress --maxWorkers=1`
- `pnpm lint:design-tokens`

Ambos deben pasar; un usuario con solo completion conserva cobertura pero obtiene
cero evidencia de habilidad.

### Step 5: Separar answer inmediato de efecto SRS diferido en Essential Words

Refactorizar la propiedad de la escritura:

1. Generar un `attemptId` estable por submit aceptado y propagarlo por
   `RuntimeAttemptInput`/`PracticeAnswer`.
2. Hacer que `savePracticeAnswer` use ese ID como `answer_history.id` cuando se
   proporciona; el fallback sigue siendo `crypto.randomUUID()`.
3. Construir la answer desde `buildEssentialWordExerciseResult`, conservando
   `mode`, `timeMs`, transcript, score y attribution disponible.
4. Persistir esa answer exactamente una vez al aceptar cada intento, tanto en
   `off`/`shadow` como en `on`.
5. Extraer o parametrizar el writer SRS de `gradeEssentialWord` para que el flush
   de `pendingLapsesRef` actualice scheduling sin crear otra answer genérica.
6. Mantener `pendingLapsesRef` únicamente como política SRS por palabra. No debe
   ser la fuente de `answer_history`.
7. Conservar intactas las reglas de retry, `Ya la sé`, `No la sé`, XP hablado,
   final round y budget independiente.

No hagas dual-write ciego. Caracteriza primero qué escribe cada modo del router
y elimina la propiedad duplicada antes de activar la nueva salida común.

**Verify**:

`pnpm exec vitest run lib/essential-words hooks/__tests__/useEssentialWordsSession* --maxWorkers=1`

Debe probar off, shadow y on; correct/incorrect; dos reintentos; resume; y mismo
attempt ID reproducido.

### Step 6: Añadir un gate extremo a extremo de integridad de evidencia

Crear una tabla de pruebas parametrizadas que recorra al menos:

- topic-only Review;
- fill blank normal;
- un modo de escucha Essential Words;
- un modo de producción Essential Words;
- una sesión con retry.

Por caso, afirmar conteos exactos de answers/sessions, skill tags, modalidad,
content/target ID y si existe o no efecto SRS. El test debe fallar si un contexto
por sí solo crea una habilidad o si completion cambia learning.

**Verify**:

```powershell
pnpm exec vitest run lib/review lib/progress lib/essential-words hooks/__tests__/useReviewSession* hooks/__tests__/useEssentialWordsSession* --maxWorkers=1
pnpm audit:state-duplication
pnpm type-check
pnpm lint
git diff --check
```

Todo debe salir con exit 0.

## Test plan

- Usar `lib/progress/__tests__/fluency-scores.test.ts` como patrón de lógica pura.
- Usar `lib/essential-words/__tests__/runtime-engine.integration.test.ts` como
  patrón de router + Dexie/outbox.
- Crear `lib/review/__tests__/session-plan.test.ts` para no acoplar el bug de
  Repaso a mocks de React/network.
- Añadir una prueba específica de idempotencia con el mismo attempt ID.
- Añadir una prueba de separación: dos fallos generan dos answers pero un solo
  lapse SRS pendiente para la palabra.
- No aceptar snapshots como única verificación de los conteos.

## Done criteria

- [ ] Topic-only Review inicia sesión y no termina prematuramente.
- [ ] Solo existe una autoridad ejercicio/evidencia → habilidades.
- [ ] No quedan sets manuales de IDs de ejercicios en `fluency-scores.ts`.
- [ ] Completion sin respuestas no aumenta grammar/reading/fluency.
- [ ] Cada intento Essential Words escribe exactamente una answer con modo y tiempo.
- [ ] Dos fallos de una palabra conservan dos answers y consolidan solo el SRS.
- [ ] Reproducir un attempt ID no duplica `answer_history` ni el outbox.
- [ ] Una sesión completa escribe un único activity summary.
- [ ] Off, shadow y on pasan las mismas invariantes de evidencia.
- [ ] Focused tests, state audit, typecheck, lint y `git diff --check` pasan.
- [ ] No se modificaron schedulers, presupuestos ni archivos fuera de scope.
- [ ] La fila 074 queda DONE y el Plan 073 puede empezar.

## STOP conditions

- Los cambios locales en `hooks/useEssentialWordsSession.ts` se solapan con el
  flujo de submit/persistencia y no pueden preservarse con seguridad.
- La corrección exige migrar completions históricas a mastery.
- Se necesita inferir habilidad únicamente desde `context` o texto libre.
- Idempotencia exige reemplazar IDs históricos o borrar answers existentes.
- El intento de separar `gradeEssentialWord` cambia intervalos/retry/budget.
- La relación `exercise_types` no puede leerse de forma segura y la inversión de
  `EXERCISE_TYPE_IDS` detecta IDs duplicados.
- Una verificación falla dos veces después de un ajuste razonable.

## Maintenance notes

- Todo slug nuevo debe entrar en `ExerciseSlug`, `EXERCISE_TYPE_IDS` y la matriz
  canónica, con una prueba exhaustiva; nunca añadir una lista paralela en queries.
- Un nuevo modo Essential Words debe declarar modalidad y skills antes de
  habilitarse en producción.
- `pendingLapsesRef` es una optimización/política del SRS, no un event log.
- El Plan 073 debe mantener la separación actividad/cobertura/aprendizaje que
  este plan deja establecida.
