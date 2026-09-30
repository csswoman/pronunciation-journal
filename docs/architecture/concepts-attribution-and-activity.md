# Conceptos, atribución y actividad diaria (Plan 050)

Contrato entre productores de respuestas, señales de concepto, finalización de
lecciones y filas de actividad del Plan diario. Mantiene separados actividad,
respuesta evaluada, espaciado, finalización y dominio.

## 1. Atribución de tareas

- `multiple_choice` es un formato, no una habilidad (`EXERCISE_SKILL_MATRIX`).
  Un quiz de curso solo aporta habilidad si el llamador pasa `taskSkill` desde
  metadatos canónicos de la tarea (`LessonQuizAnswerInput.taskSkill`). Hoy
  los esquemas de mazos y mini-lecciones aceptan esa habilidad por pregunta;
  un valor común por mazo se admite solo sin contradicciones entre sus preguntas.
  El contenido existente sin autoría explícita sigue
  registrando actividad y SRS de tema, pero **no** una habilidad. Añadir
  `taskSkill` al contenido es trabajo de autoría, no inferencia en runtime.
- El quiz persiste `topic` (tema canónico `theory:<deck>` de
  `lib/learning-loop/theory-targets.ts`) y, si existe, `taskSkill` en
  `exercise_payload`.
- Los drills del grammar-deck (`buildGrammarDrill`) llevan `topic` =
  `theoryTopicForDeck(deckSlug)`: su evidencia alimenta el SRS de ese tema.
  Un drill sin tema canónico mantiene actividad y no SRS.
- El payload de cada respuesta genérica incluye `lessonSlug` (dueño autoral del
  concepto). Para evidencia de concepto: `payload.lessonSlug` >
  `sourceRef` `grammar_deck` > `metadata.lessonSlug`. Antes, los drills
  (`grammar-deck:<slug>`) y los ítems de `grammar_focus` (`<slug>:rule:<n>`)
  creaban conceptos fantasma con el id del `sourceRef`.

## 2. Evidencia de concepto (`lib/progress/concept-evidence.ts`)

`ConceptSignal.evidence` guarda ítems `{ attemptId, contentId, correct, at, taskSkill? }`:

| Eje | Regla |
|---|---|
| Identidad | Un ítem por `attemptId`; el primero gana. Reintentos y replays no suman. |
| Contenido | Solo cuenta la última respuesta por habilidad y `contentId`: repetir la misma pregunta es una evidencia. |
| Tiempo | Orden por `at`; se conservan los últimos `CONCEPT_EVIDENCE_WINDOW` (30). |

`correct`/`total`/`status` se derivan de esa evidencia. **Criterio de producto
aprobado explícitamente el 2026-09-27:** `mastered` exige al menos
`CONCEPT_MASTERY_MIN_CONTENTS` (5) contenidos distintos con precisión
≥ `CONCEPT_MASTERY_MIN_ACCURACY` (0,8). Se mantiene la ventana de 30 intentos
y no se exige un lapso mínimo entre respuestas. Así, 4/5 es `mastered`,
4/4 y 3/5 son `review`; una respuesta posterior puede devolver el concepto a
`review` si reduce la precisión por debajo del 80 %. Es el criterio para
evidencia de ejercicios, no una prueba universal de dominio.

- La fusión vive en `mergeConceptSignals`, así que todos los escritores
  convergen: una señal manual posterior conserva la evidencia acumulada.
- `updateConceptSignalsWithEvidence` lee, fusiona y escribe en **una
  transacción Dexie** (`learningState` + `syncOutbox`): dos pestañas no se
  pisan localmente. Límite conocido: `user_learning_state` remoto sigue siendo
  un JSON completo de último escritor; no hay fusión atómica en servidor.
- Señales históricas sin `evidence` se mantienen tal cual; no hay backfill.
- El diagnóstico conserva su resultado de placement, pero los nuevos
  `deriveConceptSignal` no declaran mastery con un agregado sin identidades.
  Una respuesta correcta produce `review`, incluso si es 1/1.
- La evidencia autoral conserva `taskSkill`. `masteryBySkill` calcula cada
  habilidad por separado. Si hay varias dimensiones en la ventana, el estado
  genérico queda en `review`: 3 respuestas de escucha + 2 de lectura no cumplen
  el mínimo de 5 de ninguna habilidad. El histórico sin habilidad no se
  reatribuye ni se suma a una habilidad autoral.

## 3. Finalización de lecciones

Sin cambios: completar un mazo o una mini-lección es **recorrido**
(`lesson_completions`), no aprobación. `quizPassed` viaja en la metadata de la
sesión. La decisión cerrada mantiene los desbloqueos actuales y no introduce
estados vista/aprobada. El cumplimiento requerido excluye unidades y lecciones
opcionales; sin lecciones core, `progressPercent` es `null`. Las unidades
opcionales conservan su propio avance.

## 4. Checklist diario frente a sesión real

- Una sesión lanzada desde Daily (`PracticeSession` con `dailyStepId`, Reader
  con `completeReader({ dailyStepId })`, `EdDrillSession`) registra su fila de
  `activity_sessions` con `reconciled_step_ids: [stepId]`.
- `useDailyPlan.markDone` solo escribe la fila manual `daily_plan` vacía si
  ninguna fila de actividad reconcilia ya ese paso hoy
  (`isDailyStepAlreadyRecorded`). Los pasos sin sesión (p. ej. `word_intro`)
  siguen escribiendo su fila manual.
- La sesión publica su reconciliación local después de que `enqueue` confirme
  la escritura en outbox. Si falla IndexedDB, el paso no se presenta como
  registrado y la acción manual conserva su fila de respaldo.
- Reconstrucción: `doneIds` (localStorage) sobrevive a recarga y offline; online
  `syncTodayReconciledSteps` recupera el paso desde la fila de la sesión real.
- No se borran filas `daily_plan` históricas. Los lectores las excluyen como
  sesiones: `get_activity_totals.sessions` y la tira de sesiones recientes de
  `/progress`. Una casilla manual vacía tampoco crea un día activo; conserva
  únicamente la participación explícita en el checklist.

## 5. Rachas, umbrales y límites diarios

| Nombre | Valor | Uso |
|---|---|---|
| `ACTIVE_DAY_THRESHOLD` | 1 | Día activo: racha global (`getDailyStreak`) y racha de inmersión |
| `DAILY_STREAK_THRESHOLD` | 5 | Día de objetivo (5 respuestas): heatmap y días completados de `/progress` |

- Home usa la misma proyección de inmersión que Daily
  (`summarizeImmersionActivity`). Antes aplicaba el umbral 5 por defecto.
- Rachas y semanas usan `America/Lima` (`STREAK_TIMEZONE`). La migración
  `20260927030000_activity_totals_lima_days.sql` alinea `active_days` de
  `get_activity_totals` (antes UTC).
- El Plan diario (claves de localStorage y `syncTodayReconciledSteps`) usa el
  día local del navegador. Es su contrato actual y no se mezcla con UTC.

## 6. Correcciones P3

- `upsertFragmentSrs` actualiza `interval` con el calendario FSRS (antes quedaba
  el valor anterior en Dexie y `content_srs`).
- `completeReader` llama `flushOutbox(userId)`; sin id era un no-op.

`sessionXp` solo recompensa respuestas evaluadas: incorrectas evaluadas conservan
2 XP; `skipped`, `unscored`, `evaluator_failed` y el skip histórico reciben 0.
No se introduce un estado global que unifique dominio de conceptos, fonemas y
habilidades. Cada dominio conserva su evidencia y sus proyecciones.

## 7. Recarga offline

`/offline` es una página pública sin datos de cuenta. El proxy omite Auth para
esta ruta y Serwist la precarga explícitamente porque el layout raíz es dinámico.
Las navegaciones HTML autenticadas, RSC y API siguen siendo `NetworkOnly`.
Si una navegación a `/daily` falla, el shell público monta `DailyChecklist` en
el navegador y recupera el plan y los pasos de la cuenta en este dispositivo.
Sin sesión local no se expone ningún plan; sin plan del día no se inventa uno.
Las reconciliaciones remotas y la hidratación Auth se omiten mientras está offline.
El límite de precarga es 5 MiB para incluir también el chunk de práctica necesario.

## Mantenimiento

Cada productor nuevo debe: declarar `taskSkill` solo desde la tarea, poner
`lessonSlug` del concepto en el payload, dar `attemptId` estable y, si lo lanza
Daily, pasar `dailyStepId`. Tests de referencia:
`lib/progress/__tests__/concept-evidence.test.ts`,
`lib/practice/__tests__/course-task-attribution.test.ts`,
`lib/progress/__tests__/daily-step-recording.test.ts`.
