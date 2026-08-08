# Fase 8 — Task 8.9g: auditar y restaurar independencia de C11 respecto a accuracyByModality

Fecha: 2026-08-07

Estado: **auditoría completa. No se encontró ningún bug en el pipeline
recalled/C11 — el invariante `recalled === (rngSample < retrievability)` ya
se cumplía exactamente antes de esta tarea. La correlación observada entre
`accuracyByModality` y C11 es real, pero 100% indirecta y mediada por
`retrievability`: perfiles de baja precisión generan más lapsos reales, lo
que mantiene baja la `stability` FSRS de una fracción grande de sus items, y
el redondeo a día-entero del intervalo FSRS deprime sistemáticamente la
retrievability en el momento de la review para items de baja stability.
Es un hallazgo estructural (Caso B, mismo patrón que 8.9f), no un bug
corregible dentro del alcance de 8.9g. DETENER. No se inicia 8.10.**

No se cambiaron C1–C11, `desiredRetention` (0.9), los perfiles, el
presupuesto, C8/C9, `MaturityPolicy` ni capacity/admission (salvo
instrumentación diagnóstica aditiva: `rngSample` en `ScheduledReviewRecall`).

## Objetivo

8.9f reportó que `retentionOnTime` estaba por debajo de 0.85 incluso para
reviews "a tiempo" en steady/intermittent/bursty/beginner, sugiriendo que
`accuracyByModality` podría estar imponiendo un techo directo sobre C11,
violando el contrato de Task 8.5 (C11 debe derivarse de `retrievability`
FSRS, no de la precisión de ejecución del usuario).

## Trazado del pipeline recalled → assessment.correct → C11 (§1–§4)

Código leído línea por línea (sin ejecutar nada todavía):

1. **`scheduled-review-outcome.ts`** (`simulateScheduledReviewOutcome`): NO
   recibe `profile`/`accuracyByModality` como parámetro. Calcula
   `retrievability` únicamente desde `stability` FSRS + tiempo transcurrido, y
   `recalled = rngSample < retrievability`. Ya tenía un test explícito
   ("no usa la precisión fija del perfil principiante como techo de recall")
   de una tarea anterior.
2. **`simulated-outcome.ts`** (`simulateAttemptOutcome`): `correct =
   scheduledCorrect ?? answerCorrectly(...)`. Para una scheduled-review real,
   `scheduledCorrect` siempre viene definido (`scheduled.recalled`), así que
   el operador `??` (no `||`) preserva `false` correctamente y `correct`
   nunca cae al fallback basado en `accuracyByModality`. `hintsUsed` sí se
   deriva de `accuracyByModality`, pero es una variable *distinta* que no
   reescribe `correct`.
3. **`verification/assessment.ts`** (`buildAssessment`): `correct =
   outcome.correct || outcome.typo`; `typo` es siempre `false` en
   simulación. Por tanto `assessment.correct === outcome.correct ===
   recalled` exactamente, para toda scheduled-review.
4. **`attempt-grade.ts`** (`attemptGrade`): decide `grade` con precedencia
   `rescued → firstTryFailed → hintsUsed≥2 → hintsUsed=1 → correct`. Esto
   significa que `hintsUsed` (impulsado por `accuracyByModality`) **puede
   forzar `grade="Again"` aunque `correct=true`** — pero esto es política de
   grading preexistente y ya especificada (comentarios §2.1/§2.4 del propio
   archivo), no algo introducido por 8.9g, y **no toca `assessment.correct`**.
5. **`criteria/retention.ts`** (`observedRetention`): filtra por
   `eventType === "scheduled-review" && event.affectsSchedule`, cuenta
   `assessment.correct`. Nunca usa `accuracyByModality`, `grade`, ni
   `learningAccuracyByModality`.

**Se centralizó** el predicado de elegibilidad en
`isScheduledReviewEligibleForC11(attempt, event)` (nuevo export en
`criteria/retention.ts` / `criteria/index.ts`), usado tanto por
`observedRetention` como por el nuevo módulo de traza — comportamiento
idéntico al anterior (test de regresión `criteria-retention.test.ts` sigue
en verde sin cambios).

**Conclusión del trazado estático: el invariante ya se cumplía.** No existe
ninguna ruta `rng < accuracyByModality`, `rng < retrievability *
accuracyByModality`, `recalled && modalityCorrect` ni
`accuracyByModality > threshold` decidiendo el recall de una scheduled-review.

## Instrumentación diagnóstica (§1)

Nuevo módulo `lib/essential-words/simulation/scheduled-review-trace.ts`
(`traceScheduledReviews`, hook `mutateCompletions` de solo lectura) captura,
por cada scheduled-review real de una simulación completa: `itemId`,
`skill`/`modality`, `scheduleStateBefore`, `stabilityBefore`,
`difficultyBefore`, `dueAt`, `attemptedAt`, `retrievability`, `rngSample`
(nuevo campo aditivo en `ScheduledReviewRecall`), `recalled`,
`modalityAccuracy`, `executionQuality` (hintsUsed/rescued/firstTryFailed/
latencyMs — este código no tiene un campo "fluency" separado, se documenta
así en vez de inventar uno), `selectedGrade`, `affectsSchedule`,
`includedInC11` (calculado con el predicado canónico), y
`assessmentCorrect`. `violatesRecallInvariant(entry)` verifica el invariante
del §2 directamente sobre datos reales, no sobre una reconstrucción.

Test `c11-accuracy-independence.test.ts`, corridas beginner/advanced,
120 días/60 palabras/budget sin restricción: **0 violaciones del invariante**
en >50 scheduled-reviews por perfil.

## Verificación empírica (evidencia, no solo lectura de código)

Corrida backlog-cero real (`scripts/essential-words/fase8-9g-c11-audit.mts`,
seed 42, 300 palabras, 180 días, `dailyBudgetSeconds: 200000` — presupuesto
efectivamente ilimitado, así que ningún backlog puede originarse en
capacidad de sesión):

| Perfil | accuracy (recognition) | C11 medido | avg retrievability en review | % reviews con stability previa <1 día | execution accuracy (learning-step) |
|---|---|---|---|---|---|
| beginner | 0.68 | 0.664 ❌ | 0.670 | 73.3% | 0.583 |
| intermittent | 0.86 | 0.788 ❌ | 0.802 | 38.2% | 0.796 |
| bursty | 0.86 | 0.764 ❌ | 0.776 | 40.6% | 0.779 |
| steady | 0.90 | 0.860 ✅ | 0.864 | 19.1% | 0.856 |
| advanced | 0.96 | 0.884 ✅ | 0.886 | 8.1% | 0.937 |

**Lectura clave: `avg retrievability en review` explica casi exactamente el
C11 medido en los 5 perfiles** (diferencia ≤0.016 en todos los casos) — C11
sigue a `retrievability`, no hay salto discontinuo hacia
`accuracyByModality`. La columna "execution accuracy" confirma que la
precisión de ejecución **se mide correctamente por separado** y sigue de
cerca `accuracyByModality` del perfil (0.68→0.58, 0.86→0.78-0.80, 0.90→0.86,
0.96→0.94) — tal como se espera, sin filtrarse al numerador de C11.

## Causa raíz exacta del acoplamiento indirecto

1. `accuracyByModality` baja → más fallos reales durante `learning-step`
   (`answerCorrectly` = `random.chance(accuracyByModality[modality])`, la
   única función de simulación que sí usa `accuracyByModality` como
   probabilidad de acierto — correctamente excluida de C11 porque su
   `eventType` es `"learning-step"`, nunca `"scheduled-review"`).
2. Más fallos ⇒ más lapsos (`grade="Again"`, ya sea por fallo real de
   recall o por `hintsUsed≥2`, política preexistente) ⇒ más ciclos
   Review→Relearning→Review con `stability` reiniciada a valores bajos.
3. Se verificó de forma aislada (sin ninguna dependencia de esta simulación)
   que `scheduleFsrsReview`/`calculateFsrsRetrievability` (`lib/srs/
   fsrs-schedule.ts`, ts-fsrs) devuelven `dueAt` en **incrementos de día
   entero** incluso cuando el intervalo matemáticamente óptimo para
   `desiredRetention=0.9` es sub-día. Para `stability` baja esto produce una
   retrievability en la fecha forzada muy por debajo de 0.9:

   | stability previa | intervalo (días, ts-fsrs) | retrievability en ese intervalo |
   |---|---|---|
   | 0.1 | 2 | 0.646 |
   | 0.3 | 2 | 0.745 |
   | 0.5 | 2 | 0.791 |
   | 0.8 | 2 | 0.832 |
   | 1.0 | 2 | 0.850 |
   | 2.0 | 3 | 0.870 |
   | 5.0 | 6 | 0.887 |
   | 10.0 | 11 | 0.893 |
   | 30.0 | 31 | 0.898 |

   Este es un comportamiento del propio scheduler FSRS compartido (usado por
   todo el sistema SRS, no solo essential-words), fuera del alcance de 8.9g.
4. Como los perfiles de baja precisión acumulan una fracción mucho mayor de
   items en el régimen de `stability` baja (73% en beginner vs 8% en
   advanced, tabla arriba), su promedio agregado de retrievability —y por
   tanto su C11— queda sistemáticamente más bajo. **La correlación es real,
   pero pasa enteramente por `retrievability`**, satisfaciendo el invariante
   del §2.

### Test de control decisivo (aísla el canal indirecto)

Se ancló `retrievability` al valor objetivo (0.9) para cada scheduled-review
usando el mismo `rngSample` ya generado (elimina la cascada de estabilidad
orgánica sin tocar el mecanismo recalled = rng < probabilidad):

| Perfil | C11 con retrievability anclada a 0.9 |
|---|---|
| beginner (accuracy 0.68) | **0.902** ✅ |
| advanced (accuracy 0.96) | **0.899** ✅ |

Con retrievability sana, **beginner y advanced convergen al mismo C11** pese
a tener precisión de ejecución radicalmente distinta. Esto es la prueba
directa de que `accuracyByModality` no impone ningún techo cuando el canal
indirecto (stability → redondeo de intervalo) se neutraliza — ver `Test B`
en el archivo de tests.

## Separación de conceptos (§3, §9)

| Concepto | Dónde vive | Depende de accuracyByModality |
|---|---|---|
| A. Memory recall (`recalled`) | `scheduled-review-outcome.ts` | No — solo `retrievability` FSRS |
| B. Execution quality | `hintsUsed`, `rescued`, `firstTryFailed`, `latencyMs` (`simulated-outcome.ts`) | Sí, por diseño (así modela el simulador la habilidad de ejecución) |
| C. Review grade | `attempt-grade.ts` (`attemptGrade`) | Indirectamente, vía B (hints/rescue), política preexistente y especificada |

Tabla de decisión de grade (sin cambios, ya existente en `attempt-grade.ts`):
`rescued→Again`, `firstTryFailed→Again`, `hintsUsed≥2→Again`,
`hintsUsed=1→Hard`, `!correct→Again`, `correct && latency<25s→Easy`,
`correct→Good`. Se confirmó (Test A/J) que ninguna de estas ramas reescribe
`assessment.correct`; solo afectan `grade`, que a su vez solo afecta el
*siguiente* schedule FSRS (canal indirecto ya documentado arriba), nunca el
numerador de la review actual.

## Tests obligatorios A–K

Archivo nuevo:
`lib/essential-words/simulation/__tests__/c11-accuracy-independence.test.ts`
(13 tests, todos en verde).

| Test | Resultado |
|---|---|
| A — misma retrievability+seed, distinta accuracy ⇒ mismo recalled | ✅ verificado a nivel de `simulateAttemptOutcome`/`buildAssessment`, 4 modalidades × 20 seeds × 2 valores de recalled |
| B — accuracy baja no impone techo cuando retrievability está sana | ✅ beginner y advanced convergen a ~0.90 con retrievability anclada |
| C — beginner alcanza [0.85,0.95] con reviews on-time | ❌ **no ocurre en condiciones orgánicas backlog-cero** (0.664) — documentado, NO forzado; se probó que el promedio de retrievability explica el resultado (diferencia <0.03), confirmando que es un hallazgo estructural y no un bug del pipeline recalled/C11 |
| D — retrievability baja falla C11 pese a accuracy=1.0 | ✅ (regresión, ya existía en `scheduled-review-outcome.test.ts`/adversarial `low-retention`; reconfirmado aquí con accuracy=1.0 explícito) |
| E — retrievability ~1.0 falla C11 por exceso | ✅ (regresión, adversarial `perfect-retention`; reconfirmado con accuracy=0.3 explícito) |
| F — practice/verification/learning-step no afectan C11 | ✅ `entries` de la traza son 100% `includedInC11`; attempts no-scheduled existen y quedan excluidos por el predicado canónico |
| G — C11 usa `recalled` (`assessment.correct`), no un sustituto | ✅ `assessmentCorrect === recalled` en el 100% de >50 reviews |
| H — misma seed reproduce la secuencia exacta de recalled | ✅ dos corridas independientes, secuencias idénticas |
| I — execution accuracy se mide por separado | ✅ hintsUsed no nulo entre recuerdos exitosos, medible independientemente |
| J — grade puede diferir sin alterar recalled de la review actual | ✅ existen casos `recalled=true && grade="Again"`; en todos, `assessmentCorrect` sigue `true` |
| K — 11 adversariales siguen correctos | ✅ ver validación abajo |

## Validación

- `c11-accuracy-independence.test.ts`: 13/13 ✅.
- `scheduled-review-outcome.test.ts`, `criteria-retention.test.ts` (tests
  originales de 8.5): sin cambios de comportamiento, siguen en verde.
- `adversarial.test.ts`: 11/11 casos correctos (incluye `low-retention`,
  `perfect-retention`).
- `acceptance.test.ts`: sin cambios respecto al baseline post-8.9f. C11
  sigue rojo en beginner/intermittent/bursty (0.624/0.789/0.756 aprox.,
  consistente con el hallazgo — no se tocó nada que pudiera moverlo) y verde
  en steady/advanced.
- Suite completa `lib/essential-words/simulation/**`: sin regresiones.
- `pnpm type-check`, `pnpm lint`, `git diff --check`: limpios.

## No mezclar con C8/C9 (§11)

La incompatibilidad de producto entre presupuesto/mandatory/C8/C9
demostrada en 8.9f **sigue vigente y sin relación** con este hallazgo. C11
seguir a `retrievability` correctamente no cambia que el headroom de
presupuesto sea insuficiente para C8+C9. **Fase 8 no se declara verde.**

## Decisión

**Caso B: no se encontró bug.** El pipeline `recalled`/C11 ya respetaba el
invariante de Task 8.5 antes de esta auditoría. La dependencia observada
entre `accuracyByModality` y C11 es indirecta, legítima y está mediada
enteramente por `retrievability`, con una causa mecánica identificada
(redondeo a día entero del intervalo FSRS penalizando desproporcionadamente
a items de baja `stability`, que son más frecuentes en perfiles de baja
precisión). No se modificó el perfil `beginner` ni se redefinió C11 para
forzar un resultado verde (§6). Si el contrato original de Task 8.5 (beginner
∈ [0.85, 0.95]) debe preservarse literalmente, se requiere una decisión de
spec/producto — no un fix de código dentro del alcance de 8.9g — entre, por
ejemplo:

1. Aceptar que perfiles con muchos lapsos reales (baja `accuracyByModality`)
   tengan un C11 estructuralmente más bajo mientras dure ese régimen.
2. Investigar (fuera de alcance) si `lib/srs/fsrs-schedule.ts` debería
   soportar aprendizaje de sub-día para items recién relapsados antes de
   volver a "Review", como hacen algunas implementaciones de FSRS/Anki.
3. Revisar si `desiredRetention` o los parámetros FSRS por defecto son
   apropiados para el rango de `stability` bajo que producen los perfiles de
   baja precisión.

## No se hizo (fuera de alcance de 8.9g)

- 8.10.
- Cambios a C1–C11, `desiredRetention`, los perfiles, presupuesto, C8/C9,
  `MaturityPolicy`, capacity/admission (salvo el campo diagnóstico aditivo
  `rngSample`).
- Cambios a `lib/srs/fsrs-schedule.ts` (el redondeo a día entero es la causa
  mecánica identificada, pero tocar el scheduler FSRS compartido excede el
  alcance de "aislar C11 de accuracyByModality" y afectaría a todo el
  sistema SRS, no solo a esta simulación).
- Cambios a `attempt-grade.ts` (la política de grading vía hints/rescue es
  preexistente y especificada; no reescribe `assessment.correct`).

## Archivos nuevos/modificados

- `lib/essential-words/simulation/scheduled-review-outcome.ts`: campo
  aditivo `rngSample` en `ScheduledReviewRecall` (diagnóstico, no cambia
  comportamiento).
- `lib/essential-words/simulation/criteria/retention.ts` /
  `criteria/index.ts`: extraído `isScheduledReviewEligibleForC11` como
  predicado canónico único (refactor sin cambio de comportamiento).
- `lib/essential-words/simulation/scheduled-review-trace.ts`: nuevo módulo
  de instrumentación diagnóstica (`traceScheduledReviews`,
  `violatesRecallInvariant`).
- Test: `lib/essential-words/simulation/__tests__/c11-accuracy-independence.test.ts`.
- Script de auditoría: `scripts/essential-words/fase8-9g-c11-audit.mts`.
