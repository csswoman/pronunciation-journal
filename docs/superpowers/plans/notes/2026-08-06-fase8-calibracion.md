# Fase 8 — Task 8.9e: dynamic base activation allowance

Fecha: 2026-08-07

Estado: **implementado allowance dinámico (opción B).** No se inicia 8.10.
Gate estructural C8/C9 **no cerrado**: el limitador real es mandatory de
sesión (~780s/900), no el hard cap de 4. C1–C5/C7/C10 verdes donde aplica
acceptance. C6 diferido a 8.10. No se relajan criterios.

## Decisión

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

## No hecho

8.10; cambios a umbrales C1–C11, target=10, C8 share, C9=8, presupuesto,
MaturityPolicy, desiredRetention, latencia, costes, perfiles.
