# Fase 8 — Simplificación final del planner de Essential Words

Fecha: 2026-08-07
SHA base: `f76d7b8e69d4c5f40251056783d0eb24fc15a1b1` (dev)
Estado: propuesta — sin cambios de runtime todavía.

## 0. Hallazgo previo que reencuadra el trabajo

El motor `daily-budget.ts` (y toda la familia `planning-types`/`admission-*`/
`capacity-forecast`/`placement/*`) **no está conectado a producción**.
`app/`, `hooks/useEssentialWordsSession.ts` y `components/practice/essential-words/*`
corren sobre un sistema legacy completamente distinto: `session-loader.ts` →
`queue.ts` / `prepare-srs.ts` / `pending-lapses.ts` / `daily-quota.ts`, con un
`NEW_CARDS_PER_DAY` fijo. Confirmado con el usuario: es intencional — este
motor es diseño para una futura migración de skill-model, y hoy solo se
ejercita vía `simulation/run-simulation.ts`, sus propios tests, y los scripts
`scripts/essential-words/fase8-*.mts`.

Esto no cambia el objetivo de la tarea (simplificar antes de conectar), pero
sí el framing: no hay riesgo de romper sesiones reales de usuarios durante
este refactor. El riesgo es puramente sobre la coherencia interna del diseño
y sobre no perder los invariantes que la investigación de Fase 8 demostró.

## 1. Arquitectura actual (flujo real)

```
planDailySession(input, limits, recovery)      [daily-budget.ts]
  ├─ resolveMode()                               recovery-mode.ts
  ├─ selectMandatory()                           daily-budget.ts (inline)
  ├─ selectBaseDynamically()                      daily-budget-base.ts
  │    └─ selectPendingBaseWithDynamicAllowance() base-activation-allowance.ts (296 líneas)
  │         ├─ comparePendingBaseCandidates()     pending-base-fairness.ts
  │         └─ resolveAbsoluteBaseActivationSafetyCeiling()  activation-limits.ts
  ├─ buildFutureCapacity()                        future-capacity.ts
  │    └─ buildCapacityForecast() / reserveCapacity()  capacity-forecast.ts
  ├─ buildAdmissionLoadEnvelope()                 admission-envelope.ts
  ├─ admitPlacementConversions()                  placement/admission.ts (364 líneas)
  │    ├─ applyExpectedFsrsReserve()               hard-mandatory-forecast.ts
  │    └─ reserveCapacity() (de nuevo, forecast propio)
  ├─ selectActivations() (usage)                  daily-budget.ts (inline)
  ├─ admitNewWords()                              admission-control.ts
  │    ├─ applyAdmissionThroughputCap()            admission-capacity.ts
  │    └─ applyExpectedFsrsReserve()               hard-mandatory-forecast.ts
  └─ buildLoadBreakdown()                         planning-load.ts

Consumido únicamente por:
  simulation/run-simulation.ts → criteria/{load,progress,retention}.ts (C1–C11)
                               → adversarial.ts (11 motores)
  __tests__/*.test.ts (~20 archivos)
  scripts/essential-words/fase8-*.mts (auditoría offline)
```

Módulos sin ningún consumidor de producción **ni siquiera transitivo desde
`daily-budget.ts`** (viven solo en la capa de auditoría/telemetría de
simulación, aunque están en la raíz de `lib/essential-words/`, no en
`simulation/`):

- `base-throughput-contract.ts`
- `base-throughput-feasibility.ts`
- `throughput-feasibility.ts`
- `throughput-rates.ts`
- `criterion-applicability.ts`
- `active-session-map.ts` (solo lo usa `simulation/capacity.ts`)
- `placement/policy.ts`, `placement/bands.ts`, `placement/control-sampling.ts` (solo `simulation/candidates.ts` o su propio test)
- `usage/lifecycle.ts` (solo `simulation/candidates.ts`)
- `usage/validation.ts` (sin ningún consumidor)

## 2. Complejidad accidental identificada

1. **Doble forecast de capacidad por sesión de planificación.** `daily-budget.ts`
   construye el forecast una vez (`buildFutureCapacity`), lo vuelve a
   envolver para placement (`admissionEnvelope` + `applyExpectedFsrsReserve`
   dentro de `placement/admission.ts`), y otra vez para new-words
   (`applyAdmissionThroughputCap` + `applyExpectedFsrsReserve` otra vez
   dentro de `admission-control.ts`). Tres reconstrucciones del mismo concepto
   ("cuánto tiempo queda por sesión, por modalidad, los próximos 8 días").

2. **Reservas de 8 sesiones como estructura de datos persistente**
   (`CapacityReservation[]`, `deadlineSession`, `mergeReservations`,
   `beyondHorizon`) en vez de una política de backpressure basada en un
   número simple (tamaño del backlog pendiente). El horizonte de 8 sesiones
   sigue siendo válido como *ventana de medición* para C9, pero no necesita
   ser una estructura que el runtime mantiene y reconciliga sesión a sesión.

3. **`base-activation-allowance.ts` (296 líneas)** mezcla: ranking de
   fairness, cálculo de "safety ceiling", interacción con `future-capacity`,
   y razón de "limiting factor" — cinco responsabilidades en un archivo.

4. **Módulos de feasibility multidimensional
   (`throughput-feasibility.ts`, `base-throughput-feasibility.ts`,
   `base-throughput-contract.ts`, `throughput-rates.ts`) sin consumidor de
   producción.** Fueron útiles para diagnosticar C8/C9 durante 8.6–8.9k pero
   duplican, con otro vocabulario, lo que `pending-base-fairness.ts` +
   `capacity-forecast.ts` ya hacen en el camino real.

5. **`admission-envelope.ts` + `hard-mandatory-forecast.ts` aplicados dos
   veces** (una en placement, otra en new-words) en vez de una sola vez sobre
   un forecast compartido antes de repartir entre las dos colas.

6. **Contadores de rechazo de grano fino**
   (`rejectedForCapacity`, `rejectedForSafetyCeiling`, `rejectedForAggregateC9`,
   `capacitySafeConversions`, `capacitySafeNewWords`…) que solo un audit
   necesita; el runtime final solo necesita saber *cuántas* se admitieron y
   *por qué se detuvo* (target/budget/backpressure/recovery), per spec §18.

## 3. Arquitectura objetivo

Una sola economía: **segundos disponibles en la sesión**, y una sola señal de
backpressure: **tamaño del backlog pendiente de listening/production**. Sin
ledger de 8 sesiones persistente; el horizonte de 8 sigue siendo el criterio
de medición (C9), no una estructura de reservas.

```
planDailySession(input)
  1. mandatory = selectMandatory(...)                    (sin cambios de fondo)
  2. pendingBase = selectPendingBase({ remainingSeconds, candidates })
       orden: deadline/antigüedad → evitar starvation listening/production → itemId
  3. placement = selectPlacementConversions({ remainingSeconds, pendingBaseBacklog })
       misma backpressure que pendingBase; maxConversionsPerSession como techo
  4. newWords = admitNewWords({ remainingSeconds, pendingBaseBacklog, targetMax: 10 })
       min(target, capacityEstimate); capacityEstimate simple, no rolling-window solver
  5. usage = selectUsage({ remainingSeconds })            (residual, puede ser 0)
```

`SessionCapacity`/`PlanningLoadBreakdown` per spec §18 quedan como el único
tipo de "presupuesto"; no hay `CapacityForecast` de 8 sesiones en el runtime.

## 4. Clasificación de módulos (A/B/C/D)

### A — runtime esencial (se conserva, algunos se simplifican)

| Módulo | Acción |
|---|---|
| `daily-budget.ts` | **Simplificar**: eliminar el doble-envelope, delegar a los 5 pasos de arriba |
| `planning-types.ts` | **Simplificar**: retirar campos que solo transportaban telemetría fina (`rejectedForSafetyCeiling`, etc.) |
| `planning-load.ts` | Conservar tal cual (`PlanningLoadBreakdown` ya es la forma correcta, spec §18) |
| `recovery-mode.ts` | Conservar sin cambios |
| `cost-estimate.ts` | Conservar sin cambios (fallback fijo; empírico es Task 8.11) |
| `pending-base-fairness.ts` | Conservar el ranking (`comparePendingBaseCandidates`); **simplificar** `diagnoseBaseBlocking` a las razones que el spec §18 pide (menos de las 8 actuales) |
| `activation-limits.ts` | **Simplificar**: retirar el campo `@deprecated` legacy si no tiene consumidor de producción real |
| `capacity-forecast.ts` | **Reducir alcance**: usarlo como estimador de "segundos disponibles próximas sesiones" para el nuevo `BaseBacklogPolicy`, no como ledger persistente de reservas por itemId |
| `placement/admission.ts` | **Simplificar drástico**: de 364 líneas con reserva atómica por-skill + verificación agregada C9 + provisional-due, a "¿el backlog admite esta conversión sin superar backpressure?" + `maxConversionsPerSession` como techo |
| `admission-control.ts` | **Simplificar**: `admitNewWords` como `min(target, estimateAffordable(...))`; retirar `reservePair`/reservas de 8 sesiones persistentes |

### B — helper simple reutilizable (se conserva)

| Módulo | Nota |
|---|---|
| `daily-quota.ts` | Del sistema legacy, no tocar (fuera de alcance) |
| `session-loader.ts` | Del sistema legacy, no tocar |
| `pending-lapses.ts` | Del sistema legacy, no tocar |

### C — simulación/test/audit (se mueve o se deja donde está, no bloquea runtime)

| Módulo | Destino |
|---|---|
| `simulation/**` (todo) | Se queda; es el simulador — pero debe seguir compilando contra las firmas nuevas y simplificadas |
| `simulation/audit/c9-obligation-trace.ts` | Se queda como auditoría |
| `criterion-applicability.ts` | **Mover** a `simulation/criterion-applicability.ts` (hoy vive por error en la raíz) |
| `active-session-map.ts` | **Mover** a `simulation/active-session-map.ts` (único consumidor real es `simulation/capacity.ts`) |
| `placement/policy.ts`, `placement/bands.ts`, `placement/control-sampling.ts` | **Mover** a `simulation/placement-policy.ts` etc. — son generadores de candidatos sintéticos, no runtime de placement |
| `usage/lifecycle.ts` | **Mover** a `simulation/usage-lifecycle.ts` (solo lo usa `simulation/candidates.ts`) |

### D — redundante / candidato a eliminar

| Módulo | Justificación |
|---|---|
| `base-throughput-contract.ts` | Sin consumidor de producción ni transitivo; duplica semántica de `pending-base-fairness.ts` con otro vocabulario. Constantes reales (`horizonSessions=8`) se preservan inline donde se necesiten. |
| `base-throughput-feasibility.ts` | Sin consumidor de producción; análisis multidimensional que el nuevo backpressure simple no necesita. Su valor de *diagnóstico* pasa a un script si algún script lo sigue necesitando; si no, se elimina. |
| `throughput-feasibility.ts` | Mismo caso; tiene múltiples campos `@deprecated` ya marcados por el propio código como legacy. |
| `throughput-rates.ts` | Solo alimenta telemetría de simulación (`day-forecast-telemetry.ts`); si esa telemetría sigue siendo útil se recalcula ahí mismo con una función de 5 líneas, no un módulo aparte. |
| `admission-envelope.ts` (forma actual) | Se reemplaza por un cálculo inline de reserva-de-seguridad dentro de `admitNewWords`/`selectPlacementConversions`; no un tipo/módulo aparte con su propio contrato versionado. |
| `hard-mandatory-forecast.ts` (forma actual) | Su única función real (`applyExpectedFsrsReserve`) se vuelve una función de 3 líneas donde se usa; `buildFutureCapacitySlots`/`reconcileCapacityLedger` no tienen consumidor de producción fuera de sus propios tests. |
| `usage/validation.ts` | Cero consumidores, ni siquiera en simulación. Se elimina salvo que el usuario confirme un uso previsto. |

**Nota de disciplina (spec §16, "no borres por nombre"):** antes de eliminar
cualquier fila D se releerá cada uno de sus tests y se verificará de nuevo
que ningún script `fase8-*.mts` lo necesita; si lo necesita, ese script se
actualiza para importar desde `simulation/` o se acepta que ese script quede
obsoleto y se archive (no se mantiene código de producción viva por un
script offline).

## 5. Invariantes que los tests de caracterización deben fijar antes de tocar runtime

Traducción directa de la sección 12 del encargo, en forma de tests
observables (no de implementación):

1. FSRS schedule es source of truth — ya cubierto por tests de scheduling existentes, no tocar.
2. Un `LearningItem` no recibe dos eventos SRS por el mismo trabajo — `apply-session-observation-ownership.test.ts` ya lo cubre.
3. No double-write — idem.
4. No reservas/pending duplicados por itemId — hoy verificado indirectamente por `capacity-reservations*.test.ts`; se necesita una versión que sobreviva el cambio de "reserva persistente" a "contador de backlog".
5. Palabra nueva crea meaning + obligaciones base — `admission-control.test.ts`.
6. listening/production no starvation indefinido — `base-skill-activation-liveness` (C9) + `simulation/__tests__/c9-obligation-audit.test.ts`.
7. Backlog alto frena nuevas palabras — **nuevo test de caracterización**, hoy implícito en la interacción de varios módulos, debe hacerse explícito contra la firma simplificada.
8. Al liberar backlog, nuevas palabras vuelven a admitirse — **nuevo test**, mismo motivo.
9. Mandatory siempre tiene prioridad — `daily-budget.test.ts` existente.
10. Planner nunca excede budget salvo política explícita — `budget-respected`/`percentile95WithinBudget` (C-load).
11. Placement no inunda pending base — **nuevo test**: placement debe respetar el mismo backpressure, hoy no está probado directamente porque placement tiene su propio motor de capacidad paralelo.
12. Usage solo consume residual — cubierto por orden de `selectActivations` en `daily-budget.ts`.
13. Misma seed/context ⇒ mismo resultado — `determinism.test.ts` + `simulation/__tests__/random.test.ts`.
14. C8 capacity-conditioned — `criteria-progress.test.ts` (`newWordLiveness`), no reabrir semántica.
15. C9 ≤8 active sessions — `criteria-progress.test.ts` (`baseSkillActivationLiveness`) + `c9-obligation-audit.test.ts`.
16. C11 calibración — `criteria-retention.test.ts` + `criteria-retention-calibration.test.ts`, no tocar.
17. 11 adversariales siguen detectando motores defectuosos — `simulation/__tests__/adversarial.test.ts`.

Antes de simplificar: se añadirán tests explícitos para los puntos 4, 7, 8 y
11 (los que hoy dependen de detalles de implementación que van a cambiar),
de forma que capturen el comportamiento observable actual como línea base.

## 6. Qué NO se toca en este trabajo

Por instrucción explícita del encargo (§15): C6/MaturityPolicy,
`desiredRetention`, FSRS global, perfiles, presupuesto, target=10, semántica
de C8/C11, sub-day, Task 8.10, Task 8.11 (dataset/telemetría empírica).

## 7. Plan de ejecución (PASOs 3–7 del encargo)

1. Añadir/asegurar tests de caracterización (§5 arriba) contra el código
   **actual**, en verde, antes de tocar ningún archivo de producción del
   planner.
2. Simplificar en este orden (cada paso deja la suite verde antes de seguir):
   a. Colapsar `admission-envelope.ts` + `hard-mandatory-forecast.ts` en una
      función inline de reserva de seguridad.
   b. Reemplazar `capacity-forecast.ts`/reservas persistentes por el
      `BaseBacklogPolicy` de backpressure simple (spec §7) dentro de
      `pending-base-fairness.ts`.
   c. Reescribir `placement/admission.ts` sobre la misma backpressure.
   d. Reescribir `admission-control.ts::admitNewWords` como
      `min(target, capacityEstimate)`.
   e. Simplificar `base-activation-allowance.ts` a los 5 pasos del flujo
      objetivo.
3. Mover los módulos C (criterion-applicability, active-session-map,
   placement/{policy,bands,control-sampling}, usage/lifecycle) a `simulation/`.
4. Eliminar los módulos D después de confirmar en verde y sin consumidores.
5. Validación completa (§21 del encargo).

## 8. Riesgo abierto a vigilar

C9 se remedirá bajo el modelo simplificado (§20 del encargo): si sigue rojo
por falta física de tiempo (mandatory consumiendo la mayoría del budget), se
documentará con evidencia y **no** se construirá otro forecast — se
presentará como decisión de producto pendiente, igual que C8.
