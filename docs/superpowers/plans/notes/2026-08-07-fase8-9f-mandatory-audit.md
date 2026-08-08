# Fase 8 — Task 8.9f: auditoría, descomposición y feasibility de carga mandatory

Fecha: 2026-08-07

Estado: **auditoría completa. Un bug de ownership encontrado y corregido
(Caso A parcial). Carga mandatory residual (post-fix) es legítima y
estructuralmente incompatible con el presupuesto/target actual (Caso B).
DETENER. No se inicia 8.10.**

No se cambiaron C1–C11, presupuesto (900s), target newWords (10), C9 (8
sesiones), desiredRetention (0.9), MaturityPolicy, latencia ni costes.

## Objetivo

Determinar si la carga mandatory observada en 8.9e (~780/900 s en steady) es
(A) artificialmente inflada por un bug, o (B) legítima e inevitable bajo el
contrato actual.

## Resultado del bug hunt (§2/§3/§13 tests A–E, G)

Se instrumentó `runSimulation` con hooks puramente observacionales
(`mandatory-audit.ts`, `mandatory-rollover.ts`, `mandatory-load.ts`) para
rastrear cada trabajo mandatory por `itemId` a través de sesiones. Resultado
sobre los 5 perfiles, 180 sesiones activas:

- **Ownership** (`assertMandatoryOwnership`): 0 violaciones. Ningún itemId
  aparece simultáneamente en dos tranches (`learning`/`overdue`/`dueToday`/
  `provisionalDue`).
- **Rollover** (`advanceMandatoryLedger`, 20+ sesiones bajo presión continua
  en los 5 perfiles): 0 violaciones. Ningún item se clona; un item servido
  desaparece del ledger pendiente; un item diferido reaparece exactamente una
  vez con `rolloverCount` incrementado.
- **Backlog equation** (`backlog(t+1) = backlog(t) + arrival - service`):
  reconcilia **exactamente** (`reconciliationErrorSeconds = 0`) en los 5
  perfiles, de forma determinista (mismo seed ⇒ misma serie).
- **`otherMandatorySeconds`**: 0 en los 5 perfiles (las 4 fuentes conocidas
  son exhaustivas; `collectMandatory` no tiene una quinta categoría).
- **Provisional → FSRS**: sin doble contabilización; es la misma
  `LearningItem` mutando de `schedule.kind: "provisional"` a `"fsrs"` in
  place, nunca dos registros.

### Bug real encontrado y corregido (Caso A parcial)

`itemsObservedBy` (apply-session.ts) reprograma `meaning` como efecto
lateral de completar `listening`/`production` de la misma palabra
(mecanismo legítimo: una revisión de listening también "observa" meaning).
Se encontraron **dos variantes** de doble aplicación de FSRS al mismo item
en la misma sesión:

1. `meaning` tenía su propia completion directa ESA sesión y ADEMÁS un
   sibling (`listening`/`production`) la observaba — se aplicaba FSRS dos
   veces con calificaciones de skills distintas, la segunda pisando el
   `resultingSchedule` de la primera.
2. `meaning` sin completion propia, pero **dos siblings distintos**
   (`listening` con scheduled-review due hoy + `production` con activación
   base el mismo día) la observaban — igual doble aplicación.

Fix en `lib/essential-words/simulation/apply-session.ts`: un `settledItemIds`
que reserva de antemano todo item con completion propia esa sesión y crece
con cada item efectivamente observado, de forma que ningún `LearningItem`
se "asiente" (reciba un `srsEvent`) más de una vez por sesión salvo por su
propia completion. Regresión: `apply-session-observation-ownership.test.ts`
(3 casos, incluye la variante de dos siblings). Test E reescrito para
verificar el invariante real (`learningItemId` × `sessionId` ⇒ ≤1 srsEvent)
en vez de comparar `occurredAt` (constante dentro de una sesión, no
discriminaba nada).

**Impacto del fix en el baseline:** se repitió la corrida de los 5 perfiles.
El fix afecta timing fino de FSRS (evita crecimiento de estabilidad
duplicado), lo cual mueve levemente el criterio 6 (cuota usage, perfil
`steady`) de verde a rojo — C6 pertenece a 8.10 y ya estaba rojo para
`advanced`; no se optimiza. C1–C5, C7, C10 siguen verdes en los 5 perfiles.
11/11 adversariales siguen correctos.

## Descomposición mandatory por fuente (§1, tests F)

`MandatoryLoadBreakdown`/`MandatoryItemCounts` (`mandatory-load.ts`).
`sum(fuentes) === totalMandatorySeconds` exactamente en todas las sesiones
auditadas (verificado en test F y en el dump). Promedio por sesión activa,
180 días, seed 42, budget 900s, target 10:

| Perfil | scheduled | overdue | learning-step | provisional | carried* | total | service (seleccionado) |
|---|---|---|---|---|---|---|---|
| steady | 535.0 | 67.9 | 220.6 | 36.5 | 66.6 | 860.1 | 791.4 |
| intermittent | 267.8 | 440.7 | 253.8 | 33.6 | 183.3 | 996.0 | 761.6 |
| bursty | 244.9 | 699.0 | 300.8 | 63.2 | 495.6 | 1307.9 | 823.7 |
| beginner | 345.3 | 366.9 | 437.3 | 7.0 | 271.8 | 1156.6 | 833.8 |
| advanced | 443.9 | 126.4 | 141.9 | 70.7 | 86.6 | 782.9 | 694.6 |

\* `carried` es overlay informativo (subset ya contado en su bucket de
origen), no se suma aparte. `otherMandatorySeconds = 0` en los 5 perfiles.

`total` (candidato mandatory identificado ese día) es sistemáticamente ≥
`service` (lo efectivamente servido dentro del budget): el resto se
difiere y retroalimenta el backlog — consistente con `carried` del día
siguiente.

## Amplificación de learning steps (§5)

`learning-step-amplification.ts`, vía `srsEvents`/`attemptLogs`:

| Perfil | learningSteps/newWord | learningSteps/lapse | segundos/newWord |
|---|---|---|---|
| steady | 3.41 | 1.22 | 244.4 |
| intermittent | 4.08 | 1.32 | 394.5 |
| bursty | 4.12 | 1.40 | 436.1 |
| beginner | 8.22 | 2.08 | 2197.6 |
| advanced | 2.45 | 1.11 | 117.0 |

Cada palabra nueva genera de 2.4 a 8.2 learning-steps adicionales antes de
graduar a Review (más en perfiles con baja precisión/beginner, por más
lapsos). No se cambió FSRS; es medición de su salida.

## Carga generada por palabra admitida — cohorte aislada (§7)

`estimateMandatoryLoadPerAdmittedWord` (`mandatory-cohort.ts`), presupuesto
sin restricción, sin otras fuentes de carga, 200 días, perfil neutro
aislado (`placementConfidence: "none"`, sin acoplarse a los 5 perfiles de
aceptación):

- **1 palabra**: 1457 s mandatory totales en 200 días (≈7.3 s/día activo).
  Desglose: introducción inmediata 22s; activación listening 20s +
  production 25s; scheduled-review 1139s (meaning 24 + listening 240 +
  production 350 + usage 525); learning-step 293s; provisional 25s (usage,
  origen "direct", no placement).
- **10 palabras**: 16 239 s totales (1623.9 s/palabra) — **no** escala
  perfectamente lineal (10× esperado sería 14 570s; real es 1.11×
  eso), dentro de la tolerancia de test I (<3×), sin evidencia de
  duplicación cruzada entre palabras.

Confirma cuantitativamente: cada palabra admitida arrastra un costo mandatory
de vida completa muy superior a su costo de introducción — el "780s/sesión"
en steady no es una anomalía, es la acumulación esperable de cientos de
palabras ya admitidas generando revisión continua.

## Flujo arrival/service/backlog en steady (§8)

`summarizeBacklogFlow` sobre `runMandatoryAudit`, 180 sesiones activas:

| Perfil | arrival medio/s | service medio/s | Δbacklog medio/s | backlog p50 | p95 | max | slope |
|---|---|---|---|---|---|---|---|
| steady | 791.9 | 791.4 | 0.47 | 0 | 357 | 671 | −0.60 |
| intermittent | 767.2 | 761.6 | 5.64 | 184 | 666 | 827 | +0.62 |
| bursty | 823.7 | 823.7 | 0 | 237 | 1514 | 1645 | +7.10 |
| beginner | 835.9 | 833.8 | 2.03 | 316 | 617 | 704 | +0.58 |
| advanced | 694.6 | 694.6 | 0 | 0 | 519 | 961 | −0.34 |

`reconciliationErrorSeconds` máximo absoluto = 0 en los 5 perfiles.

## Estabilidad mandatory (§9)

`evaluateMandatoryFeasibility` (`serviceCapacity` = budget 900s):

| Perfil | utilization | backlogSlope | status |
|---|---|---|---|
| steady | 0.880 | −0.60 | **marginal** |
| intermittent | 0.852 | +0.62 | **unstable** |
| bursty | 0.915 | +7.10 | **unstable** |
| beginner | 0.929 | +0.58 | **unstable** |
| advanced | 0.772 | −0.34 | stable |

4 de 5 perfiles son `unstable`/`marginal` — la carga mandatory sola (sin
contar nuevas activaciones) ya consume 77–93% del presupuesto.

## Headroom de crecimiento (§10)

`computeMandatoryHeadroom`, usando el **required** de C8/C9
(`deriveRequiredBaseActivations`: 6 palabras nuevas/sesión mínimas al 60% de
share, no la admisión actual):

| Perfil | headroom s | headroom % | required inmediato | required base | FSRS debt esperado | required total | **margin** |
|---|---|---|---|---|---|---|---|
| steady | 108.6 | 12.1% | 132 | 270 | 72 | 474 | **−365.4** |
| intermittent | 138.4 | 15.4% | 132 | 270 | 72 | 474 | **−335.6** |
| bursty | 76.3 | 8.5% | 132 | 270 | 72 | 474 | **−397.7** |
| beginner | 66.2 | 7.4% | 132 | 270 | 72 | 474 | **−407.8** |
| advanced | 205.4 | 22.8% | 132 | 270 | 72 | 474 | **−268.6** |

**Margen negativo en los 5 perfiles.** Incluso el perfil más favorable
(`advanced`) le faltan 269s/sesión de presupuesto para sostener el mínimo
requerido de C8+C9 por encima de su carga mandatory actual.

## Warm-up vs steady-state (§11)

`splitByWarmupSteadyWindow` (30 primeras sesiones activas = warm-up, 30
últimas = final, resto = middle):

| Perfil | warm-up (30) | middle | final (30) |
|---|---|---|---|
| steady | 687.1 | 919.7 | 794.4 |
| intermittent | 925.2 | 1028.5 | 1027.7 |
| bursty | 1156.3 | 1491.0 | 1441.2 |
| beginner | 870.2 | 1258.9 | 1115.8 |
| advanced | 440.7 | 892.4 | 734.7 |

En los 5 perfiles el mandatory **sube** del warm-up al middle y luego se
estabiliza en un plateau alto en `final` — nunca decae por debajo del
warm-up. El "~780s" citado en 8.9e corresponde aproximadamente a la zona
`final` de `steady`; la zona `middle` (régimen ya maduro) es en realidad
**más alta** (~920s, por encima del presupuesto). Conclusión: **no es un
pico transitorio (Caso C descartado)** — es carga estacionaria, y la cifra
de referencia previa subestimaba el régimen intermedio.

## Correlación lateness vs C11 (§12)

`correlateLatenessWithRecall` sobre eventos `scheduled-review`/
`overdue-review` reales (excluye learning-step/provisional):

| Perfil | n | lateness p50/p95/max | % on-time | retention on-time | retention late | C11 medido |
|---|---|---|---|---|---|---|
| steady | 4747 | 0/1/2 | 87.2% | 0.848 | 0.809 | 0.843 (rojo) |
| intermittent | 2236 | 0/1/2 | 57.6% | 0.782 | 0.799 | 0.789 (rojo) |
| bursty | 1411 | 1/3/3 | 44.9% | 0.756 | ~0.75 | 0.756 (rojo) |
| beginner | 2694 | 1/2/3 | 23.5% | 0.668 | ~0.61 | 0.624 (rojo) |
| advanced | 3867 | 0/1/2 | 82.9% | 0.887 | 0.882 | 0.886 (verde) |

Lectura: en `steady` y `beginner`, retención on-time > retención late (la
lateness sí penaliza recall, consistente con backlog contribuyendo al rojo
de C11). En `intermittent`/`bursty` la diferencia es plana o invertida con
muestra pequeña en los buckets muy tardíos — el patrón dominante allí es
`accuracyByModality` del perfil, no el backlog. **Conclusión: la lateness
contribuye parcialmente al rojo de C11 (steady, beginner) pero no lo
explica por completo — ningún perfil pasaría C11 con backlog cero**, porque
incluso `retentionOnTime` está por debajo de 0.85 en steady/intermittent/
bursty/beginner.

## Baseline C1–C11 tras el fix (seed 42, 180 días, budget 900, target 10)

| Perfil | C1 | C2 | C3 | C4 | C5 | C7 | C8 | C9 (medido) | C10 | C11 (medido) |
|---|---|---|---|---|---|---|---|---|---|---|
| steady | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ (31) | ✅ | ❌ (0.843) |
| intermittent | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ❌ (22) | ✅ | ❌ (0.789) |
| bursty | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ✅ (8) | ✅ | ❌ (0.756) |
| beginner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ❌ (144) | ✅ | ❌ (0.624) |
| advanced | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ❌ (47) | ✅ | ✅ (0.886) |

Adversariales: **11/11 correctos**. C6 no evaluado (pertenece a 8.10).

## Decisión: Caso A (parcial, corregido) + Caso B (final)

1. **Caso A — corregido**: se encontró y corrigió un bug real de ownership
   (doble aplicación de FSRS a `meaning` por observación cruzada de
   siblings en la misma sesión, en dos variantes). Se repitió el baseline
   de los 5 perfiles tras el fix.
2. **Caso B — la carga residual es legítima**: tras corregir el bug, la
   auditoría exhaustiva (ownership, rollover, backlog equation, cohorte,
   warm-up/steady) no encuentra ningún otro mecanismo de duplicación,
   reclasificación incorrecta o contabilización cruzada. El backlog
   reconcilia exactamente en los 5 perfiles. La carga por palabra admitida
   (cohorte aislada) es sustancial y coherente con el desglose observado
   en producción. El régimen `middle`/`final` no decae — es estacionario.

**Se declara incompatibilidad de producto** entre:

- presupuesto (900 s/sesión),
- carga mandatory de retención FSRS ya generada por el corpus admitido
  (694–1308 s/sesión según perfil, en su mayoría "unstable"/"marginal"),
- C8 (10 palabras nuevas/sesión, mínimo 60% share ⇒ 6 palabras/sesión),
- C9 (activación de listening+production dentro de 8 sesiones).

El headroom disponible (66–205 s/sesión) es 3–7× menor que el mínimo
requerido para sostener C8+C9 (474 s/sesión) en los 5 perfiles.

## No se hizo (fuera de alcance de 8.9f)

- 8.10.
- Cambios a C1–C11, target=10, C8 share, C9=8, presupuesto (900s),
  MaturityPolicy, desiredRetention, latencia, costes, perfiles.
- Optimización de scheduling/FSRS/reclasificación de trabajo — sólo se
  corrigió el bug de ownership confirmado, nada más.

## Opciones de spec para decisión externa (no se elige automáticamente)

1. Subir presupuesto por sesión.
2. Bajar target newWords (C8) y/o su `minimumC8Share`.
3. Relajar C9 (`maxWaitSessions` > 8) para amortizar activaciones base en
   más sesiones.
4. Aceptar `desiredRetention` más bajo (reduce frecuencia de review FSRS).
5. Reducir `learningSteps`/lapsos vía otros parámetros FSRS (fuera de
   alcance de esta auditoría; requeriría su propia validación).
6. Aceptar C11 con umbral distinto para perfiles intermitentes/bursty por
   diseño, documentando que el objetivo de retención uniforme no es
   alcanzable con el presupuesto actual bajo cualquier scheduling correcto.

## Archivos nuevos (auditoría, sin cambios de comportamiento salvo el fix)

- `lib/essential-words/simulation/mandatory-load.ts`
- `lib/essential-words/simulation/mandatory-rollover.ts`
- `lib/essential-words/simulation/mandatory-audit.ts`
- `lib/essential-words/simulation/mandatory-feasibility.ts`
- `lib/essential-words/simulation/mandatory-cohort.ts`
- `lib/essential-words/simulation/lateness-correlation.ts`
- `lib/essential-words/simulation/learning-step-amplification.ts`
- Tests: `mandatory-load.test.ts`, `mandatory-rollover.test.ts`,
  `mandatory-audit.test.ts`, `mandatory-feasibility.test.ts`,
  `mandatory-cohort.test.ts`, `lateness-correlation.test.ts`,
  `learning-step-amplification.test.ts`,
  `apply-session-observation-ownership.test.ts` (regresión del bug).
- Fix de producción: `lib/essential-words/simulation/apply-session.ts`
  (ownership de observación cruzada, `settledItemIds`).
- Script de diagnóstico: `scripts/essential-words/fase8-9f-mandatory-audit.mts`.
