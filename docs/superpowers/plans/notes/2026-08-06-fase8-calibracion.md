# Fase 8 — calibración estructural y Task 8.10

Fecha: 2026-08-07

Estado: **Task 8.10 calibrada.** C1–C11 verdes en acceptance, incluido C9 en
5/5 perfiles. No se relajan criterios y no se inicia 8.11.

## Task 8.10 — baseline y diagnóstico C6

Definición canónica conservada: máximo en ventanas de 7 sesiones activas,
denominador mínimo 10, numerador `usageActivations`, denominador
`baseSkillActivations + newWordMeaningActivations + usageActivations`, límite
0.30 y cinco perfiles aplicables.

Cada perfil parte de 1.000 fixtures `context_usage` authored y 1.000
`advanced_usage` generated. Las cifras de segundos incluyen activaciones y
reviews mandatory de usage ya activo; las activaciones completadas se separan
por tipo.

| Perfil | elegibles únicos C/A | activados C/A | base | nuevas | mandatory completados | sesiones usage/activas | segundos usage | C6 | peor ventana C/A; base+nuevas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| steady | 155/104 | 63/59 | 310 | 156 | 6.550 | 122/180 | 33.504 | 0.500 | 2/3; 2+3 |
| intermittent | 64/29 | 16/11 | 127 | 65 | 3.425 | 27/96 | 9.915 | 0.231 | 0/3; 6+4 |
| bursty | 48/10 | 20/3 | 94 | 48 | 2.398 | 23/63 | 7.482 | 0.300 | 3/0; 5+2 |
| beginner | 26/0 | 18/0 | 52 | 26 | 6.190 | 18/156 | 22.995 | 0.333 | 4/0; 5+3 |
| advanced | 183/116 | 75/34 | 365 | 25 | 5.330 | 109/167 | 23.927 | 0.636 | 7/0; 4+0 |

Diagnóstico: había abundancia de elegibles y el cap por sesión seleccionaba
usage de forma continua cuando quedaba capacidad. C9 redujo el denominador
negociable. `advanced` y `beginner` fallaban por context, no por madurez;
`steady` mezclaba context y advanced. Por eso MaturityPolicy sola no podía
cerrar C6.

## Experimentos Task 8.10

| Maturity | cadence | C6 steady/intermittent/bursty/beginner/advanced | resto | decisión |
|---|---|---|---|---|
| 21/3/1/5 provisional | sin ventana | .500/.231/.300/.333/.636 | baseline C9 5/5 | rojo |
| 30/4/1/5 | sin ventana | .500/.286/.300/.333/.636 | no procede gate | maturity sola no basta |
| 21/3/1/5 | 1 sesión intermedia | .400/.273/.143/.200/.400 | no procede gate | cadence insuficiente |
| 30/4/1/5 | 2 sesiones intermedias | .250/.154/.167/.095/.300 | C9 beginner rojo | demasiado restrictiva |
| 21/3/1/5 | máximo 3/7 activas | .300/.250/.200/.182/.300 | C11 intermittent rojo | rechazada |
| **30/4/1/5** | **máximo 3/7 activas** | **.300/.250/.200/.182/.300** | **C1–C11 verdes** | **aceptada** |

Políticas finales:

- `maturity-v2`: estabilidad mínima 30 días, 4 reviews exitosas, máximo 1
  lapse en las 5 reviews recientes.
- `usage-activation-v1`: máximo 1 nueva activación por sesión y 3 en cualquier
  ventana de 7 sesiones activas.
- La pérdida de maturity no retira usage activo. Sus reviews FSRS continúan
  mandatory; la ventana solo controla nuevas activaciones completadas.

## Maturity final (porcentaje final; p50/p95 días hasta primera maturity)

| Perfil | meaning | production | advanced usage activado |
|---|---:|---:|---:|
| steady | 64.5%; 41/99 | 50.0%; 99/158 | 31 |
| intermittent | 33.3%; 57/144 | 41.7%; 125/157 | 6 |
| bursty | 18.9%; 80/166 | 34.0%; 150/174 | 1 |
| beginner | 8.3%; 39/126 | 33.3%; 107/169 | 2 |
| advanced | 68.4%; 47/89 | 48.9%; 112/157 | 21 |

`context_usage` conserva meaning en `Review` como único requisito. Advanced
conserva meaning + production maduras; no exige listening. El adversarial
`never-usage` continúa fallando y advanced mantiene usage real.

## Registro histórico — Task 8.9e

`maxBaseSkillActivationsPerSession=4` **no** es hard cap de producto.
Sustituido por:

| Campo | Valor | Rol |
|---|---|---|
| `absoluteSafetyCeiling` / `absoluteBaseActivationSafetyCeiling` | **24** | Anti-runaway (2× demanda C8=12). No target habitual. |
| `reserveShare` | 0.1 | Reserva residual para mandatory no previsto |
| `maxWaitSessions` | 8 | Deadline C9 |
| Packer | uno-a-uno por fairness + coste modalidad | Capacidad real |

Legacy `maxBaseSkillActivationsPerSession` queda `@deprecated`.
`describeMaxBaseSkillActivationsContract()` → `isHardCap: false`.

## Algoritmo

```
residualAfterReserve = residualSecondsToday × (1 − reserveShare)
ordenar: deadline C9 → wait → urgency → itemId
  (+ interleave L/P urgentes; pending > placement)
recovery: near-C9 primero, luego menos urgentes (pending no desaparece)
para cada candidato:
  si no cabe (segundos / forecast / ceiling) → PARAR
  si cabe → seleccionar y descontar coste real de modalidad
```

No `floor(available / averageBaseCost)`.

## Justificación ceiling=24

Superior a la demanda normal factible C8 (12 act/sesión) para que
`limitingFactor` habitual sea `time-budget` / `future-capacity` / `no-pending`,
no `safety-ceiling`. Acota runaway si el packer o admission fallan.

## Dump seed=42 / 180d / budget 900 (post-8.9e)

| Perfil | allow p50/p95/max | limiting | served | L/P | C8 | C9 | C11 | mand s | proj svc | sec | slots |
|---|---|---|---|---|---|---|---|---|---|---|---|
| steady | 0/9/20 | no-pend 93, time 87 | 2.11 | 1.08/1.08 | 0.11 fail | 26 | pass | 779 | 4 | **infeas** | **infeas** |
| intermittent | 0/10/20 | time 68 | 1.73 | 1.17/1.08 | n/a | 21 | fail | 780 | 4 | feas | infeas |
| bursty | 0/10/20 | mix | 1.78 | 0.94/0.84 | n/a | 14 | fail | 783 | 4 | feas | infeas |
| beginner | 0/6/20 | time 124 | 0.55 | 0.58/0.58 | n/a | 66 | fail | 839 | 2 | feas | infeas |
| advanced | 1/10/20 | mix | 2.75 | 1.39/1.40 | n/a | 24 | pass | 715 | 7 | feas | infeas |

Feasibility ahora usa `mandatorySelectedSeconds` real. Con ~780s mandatory,
proyección ≈ 2–4 act/sesión ≪ 12 requeridas → overall **infeasible** de forma
honesta (el “seconds feasible” de 8.9d subestimaba mandatory de sesión vía
`futureMandatory/8`).

Tests unitarios A–P del packer: con 12 pending y segundos suficientes
selecciona **>4**. Live residual tras mandatory ≈ 100s → ~2 served.

## Loop admission ↔ service

- Admission cap = safety ceiling 24 (`admission-capacity-v2`).
- Servicio no rechaza solo por maxBase=4.
- `clearServedBaseEligibility` solo limpia **completados**.

## Adversariales

11/11 correctos.

## Fuera de Task 8.10

Task 8.11; cambios a umbrales C1–C11, target=10, C8 share, C9=8,
presupuesto, desiredRetention, latencia, costes o perfiles.
