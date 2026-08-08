# Fase 8 — Task 8.9i: aprobación e implementación de C8/C11 (reporte final)

Fecha: 2026-08-07

Estado: **Decisión 1 y Decisión 2 de
[`2026-08-07-fase8-9h-decision-record.md`](2026-08-07-fase8-9h-decision-record.md)
implementadas y verificadas.** `8.10` **no** se inició durante esta tarea y
sigue bloqueada — resolver el spec no autoriza por sí solo continuar la
secuencia de fases.

## Qué cambió en código

- `lib/essential-words/simulation/criteria/progress.ts`: `newWordLiveness`
  (C8) reescrita con la semántica capacity-conditioned aprobada (Decisión
  1). El spec-candidate `progress-capacity-conditioned.ts` se integró aquí
  y se eliminó como archivo separado.
- `lib/essential-words/simulation/criteria/retention.ts`: nueva
  `retentionCalibrationWithinExpected` (C11 canónico, Decisión 2) y nueva
  `meanRetrievabilityAtReview` (métrica de scheduling, separada, sin
  pass/fail). `observedRetentionWithinTarget` (umbral fijo 0.9±0.05) queda
  `@deprecated`, retenida solo porque `criteria-retention.test.ts` y
  `c11-accuracy-independence.test.ts` fijan su comportamiento histórico
  como regresión — ya no se usa en acceptance ni en adversarial.
- `lib/essential-words/simulation/adversarial.ts`: `failedCriterionNumbers`
  usa `retentionCalibrationWithinExpected` para el criterio 11. El mutation
  `zero-new-words` se corrigió: la versión anterior vaciaba los candidatos
  de palabras nuevas *antes* del forecast, lo que bajo la nueva semántica
  hace que `capacitySafeNewWords` sea legítimamente 0 (deja de ser una
  violación de C8). La versión corregida preserva los candidatos (el
  forecast ve capacidad real) y solo vacía `plan.newWordsSelected`,
  forzando starvation genuina (capacidad positiva, cero admitido).
- `lib/essential-words/simulation/__tests__/acceptance.test.ts`: criterio 8
  y criterio 11 usan las funciones canónicas actualizadas.
- `lib/essential-words/simulation/__tests__/criteria-progress.test.ts`:
  reemplaza el test de C8 de umbral fijo (60%) por los 6 escenarios
  aprobados en 8.9i (capacidad≥6/admisión<6, capacidad≥6/admisión≥6,
  capacidad=2/admisión=2, capacidad=2/admisión=0 repetido, capacidad=0
  legítima, C8 pass ≠ C9 pass).
- `lib/essential-words/simulation/__tests__/criteria-retention-calibration.test.ts`
  (nuevo): cobertura de `retentionCalibrationWithinExpected` (calibrado con
  retrievability alta y baja, descalibrado, insuficiente, exclusión de
  eventos no elegibles, sin thresholds por perfil) y de
  `meanRetrievabilityAtReview` (segmentación, independencia de C11).
- `docs/superpowers/specs/2026-08-06-essential-words-skill-model-design.md`:
  Criterio 8, Criterio 11, fórmula exacta de C11 y tabla de trazabilidad
  actualizados a la semántica aprobada.
- `docs/superpowers/plans/2026-08-06-essential-words-skill-model.md`: filas
  de criterio 8/11 en la tabla de trazabilidad referencian 8.9h–8.9i.
- `docs/superpowers/plans/notes/2026-08-07-fase8-9h-decision-record.md`:
  ambas decisiones marcadas `APROBADA` con el resultado real (Decisión 2 se
  resolvió con una tercera vía — separar calibración de scheduling — no
  con ninguna de las 3 opciones originales tal cual).

`lib/srs/fsrs-schedule.ts` no cambió. `desiredRetention` sigue en 0.90.
Ningún perfil se modificó. `MaturityPolicy` no se implementó.

## Ejecución (Task 8.9i, checklist solicitada)

Todo ejecutado desde el estado final del código:

- Tests C8: `criteria-progress.test.ts` — 11/11 verdes (incluye los 6
  escenarios de la nueva semántica de C8 y los 5 tests preexistentes de C6,
  C9 y C10 que conviven en el mismo archivo).
- Tests C9: sin cambios de implementación; siguen en
  `criteria-progress.test.ts` (liveness por ítem) — verdes a nivel unitario.
- Tests C11: `criteria-retention-calibration.test.ts` (nuevo, 8/8 verdes) +
  `criteria-retention.test.ts` (histórico, 4/4 verdes, sin cambios).
- Cinco perfiles: `acceptance.test.ts` — 37/43 verdes; 6 rojos, todos
  pre-existentes y ajenos a este cambio (criterio 6 en `steady`/`advanced`,
  criterio 9 en `steady`/`intermittent`/`beginner`/`advanced` — ver
  «Criterios que siguen rojos» abajo).
- Once adversariales: `adversarial.test.ts` — **11/11 verdes**, incluyendo
  `zero-new-words` (criterio 8, ahora vía starvation genuina) y
  `low-retention`/`perfect-retention` (criterio 11, siguen fallando porque
  fuerzan `recalled` sin tocar `retrievability` — la descalibración es real
  bajo la nueva semántica igual que bajo la vieja).
- Simulación completa: `npx vitest run lib/essential-words/simulation`
  (pool forks, 2 workers) — 175/181 verdes; los 6 rojos son los mismos 6 de
  `acceptance.test.ts`.
- `npx tsc --noEmit`: sin errores.
- `npx eslint` sobre todos los archivos tocados en esta tarea: sin errores
  ni warnings.
- `git diff --check`: sin problemas en los archivos de esta tarea (los dos
  hallazgos de "blank line at EOF" son de archivos modificados antes de
  8.9i, fuera de alcance).

## Reporte C1–C11 (config. de `acceptance.test.ts`: budget 900s, target 10,
corpus 1000, 180 días, seed 42 — reproducible con
`scripts/essential-words/fase8-9i-acceptance-report.mts`)

| Criterio | steady | intermittent | bursty | beginner | advanced |
|---|---|---|---|---|---|
| C1 presupuesto | ✅ | ✅ | ✅ | ✅ | ✅ |
| C2 p95 | ✅ | ✅ | ✅ | ✅ | ✅ |
| C3 salida recovery | ✅ | ✅ | ✅ | ✅ | ✅ |
| C4 backlog estable (solo steady) | ✅ | — | — | — | — |
| C5 regreso tras ausencia (solo bursty) | — | — | ✅ | — | — |
| C6 cuota usage | ❌ | ✅ | ✅ | ✅ | ❌ |
| C7 sin picos sincronizados | ✅ | ✅ | ✅ | ✅ | ✅ |
| C8 liveness nuevas (solo steady, `isC8Applicable`) | ✅ | n/a | n/a | n/a | n/a |
| C9 liveness base | ❌ | ❌ | ✅ | ❌ | ❌ |
| C10 no starvation atrasados | ✅ | ✅ | ✅ | ✅ | ✅ |
| C11 calibración de retención | ✅ | ✅ | ✅ | ✅ | ✅ |

### C8 por perfil aplicable (solo `steady`)

`passed: true`, `measured: 1.40` (140% de lo exigido en sesiones de alta
capacidad — admite más que el mínimo cuando el forecast lo permite).
Detalle: 19 sesiones de alta capacidad (`capacitySafeNewWords >= 6`), 11 de
baja capacidad (exentas del 60% nominal), 145 de capacidad cero (exentas
por completo), 0 rachas de starvation (límite 8). Los demás perfiles no
son `isC8Applicable` (sin cambios respecto a la tabla de aplicabilidad
existente; no se amplió el alcance de C8 en esta tarea).

### C9 (`baseSkillActivationLiveness`, límite 8 sesiones)

| Perfil | passed | `measured` (sesiones de espera del peor ítem) |
|---|---|---|
| steady | ❌ | 31 |
| intermittent | ❌ | 22 |
| bursty | ✅ | 8 |
| beginner | ❌ | 144 |
| advanced | ❌ | 47 |

Sin cambios de implementación en esta tarea — mismo patrón documentado en
8.9f (solo `bursty` pasa). C9 permanece ortogonal a C8 tal como exige
Decisión 1: el escenario "capacidad=2/admisión=2 pasa C8" del test unitario
usa un C9 fallido a propósito para demostrar la independencia.

### C11 — observed vs expected (calibración, Decisión 2)

| Perfil | n elegible | observedRetention | expectedRetention | z | \|z\|<=3 |
|---|---|---|---|---|---|
| steady | 7282 | 0.8494 | 0.8531 | −0.913 | ✅ |
| intermittent | 3172 | 0.7989 | 0.7938 | +0.704 | ✅ |
| bursty | 2013 | 0.7586 | 0.7499 | +0.895 | ✅ |
| beginner | 3494 | 0.6322 | 0.6160 | +1.976 | ✅ |
| advanced | 6231 | 0.8877 | 0.8825 | +1.272 | ✅ |

Los 5 perfiles calibran: `recalled` sigue la retrievability que FSRS
calculó, incluyendo `beginner` (`observed`≈0.63, muy lejos de 0.90, pero
calibrado — exactamente el punto de la Decisión 2: eso ya no es un fallo de
C11).

### `meanRetrievabilityAtReview` — estable vs low-stability/post-lapse

| Perfil | stable (n, meanR) | low-stability-post-lapse (n, meanR) |
|---|---|---|
| steady | 5680, 0.8815 | 1602, 0.7527 |
| intermittent | 2022, 0.8503 | 1150, 0.6945 |
| bursty | 1240, 0.8055 | 773, 0.6608 |
| beginner | 769, 0.8262 | 2725, 0.5566 |
| advanced | 5738, 0.8904 | 493, 0.7906 |

Lectura: el segmento `stable` está razonablemente cerca de 0.90 en todos
los perfiles (0.81–0.89); el segmento `low-stability-post-lapse` está lejos
en todos (0.56–0.79), y es el que domina la muestra en `beginner` (2725 de
3494 reviews elegibles, 78%) — consistente con 8.9g. Esto confirma
visualmente por qué `beginner` tiene el `expectedRetention` más bajo
(0.616): no es un fallo de calibración, es el scheduler compartido
(redondeo a día) rindiendo peor exactamente donde más lo necesita ese
perfil.

## Criterios que siguen rojos (no tocados por 8.9i, prioridad fuera de esta
tarea)

- **C6** (`usageActivationShare`) en `steady` y `advanced` — documentado
  como del alcance de 8.10 en notas previas de Fase 8; no se investigó ni
  se modificó aquí.
- **C9** (`baseSkillActivationLiveness`) en `steady`, `intermittent`,
  `beginner`, `advanced` — mismo patrón que el baseline de 8.9f, sin
  relación con C8/C11; no se tocó su implementación.

Ninguno de los 6 rojos anteriores es nuevo ni fue introducido por esta
tarea: ambos criterios (C6, C9) no dependen de `newWordLiveness` ni de
`observedRetentionWithinTarget`/`retentionCalibrationWithinExpected`, y ya
aparecían en rojo en el baseline de 8.9f/8.9g bajo la implementación
anterior.
