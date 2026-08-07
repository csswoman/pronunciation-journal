# Fase 8 — Task 8.9c: feasibility objetivo + fairness pending-base

Fecha: 2026-08-07

Estado: **rates corregidos; fairness integrada; C8/C9 siguen rojos en
perfiles aplicables**. Target feasibility steady = `feasible` con margen,
pero C8/C9 no pasan → **seguir diagnóstico de scheduler**. No se inicia 8.10.
No se declara 8.9 estructuralmente cerrada.

## Baseline 8.9b

| Perfil | C8 | C9 | C11 |
|---|---|---|---|
| steady | ✗ ~0.10 | ✗ 16 | ✓ |
| intermittent | n/a* | ✗ 55 | ✗ |
| bursty | n/a* | ✓ 8 | ✗ |
| beginner | n/a* | ✗ 72 | ✗ |
| advanced | n/a* | ✗ 12–18 | ✓ |

\*C8 solo aplica a perfil **constante** (`steady`) según tabla de aceptación
de la spec. No aplicable ≠ PASS/FAIL.

## Cambios 8.9c

### Rates
- `actualArrival` = trabajo realmente admitido (envelope × admitted).
- `requiredArrival` = `ceil(target × 0.60) × envelopeSecondsPerWord` cuando C8
  aplica. Con target=10 y envelope=79 → **474 s/sesión**.
- No se usa admitted words para required arrival.

### Feasibility
- `actualStatus` / `targetStatus`: `feasible` | `marginal` | `infeasible`.
- Política versionada `marginal-feasibility-v1` (margen < 5% del presupuesto).
- Dump advanced incluye placement real (no forzado a 0).

### Fairness pending-base (`pending-base-fairness-v1`)
Prioridad dentro de pending-base:
1. deadline C9 más próximo (`remainingSessions`);
2. mayor `waitSessions`;
3. `serviceUrgency`;
4. desempate `itemId`.

No puede saltar mandatory, exceder presupuesto ni consumir hard reserves.

### Gate provisional
No activar listening/production mientras meaning es provisional
`placement-inference` aún no due (evita reescribir el schedule al observar
meaning). Tradeoff: advanced C9 empeora (más espera en palabras de placement).

## Resultado post-8.9c

| Perfil | C1–C5 | C6 | C7 | C8 | C9 | C10 | C11 |
|---|---|---|---|---|---|---|---|
| steady | ✓ | ✗ ~0.37 | ✓ | ✗ ~0.109 | ✗ 15 | ✓ | ✓ ~0.863 |
| intermittent | ✓ | ✓ | ✓ | n/a | ✗ 55 | ✓ | ✗ ~0.778 |
| bursty | ✓ | ✓ | ✓ | n/a | ✓ 8 | ✓ | ✗ ~0.776 |
| beginner | ✓ | ✓ | ✓ | n/a | ✗ 72 | ✓ | ✗ ~0.662 |
| advanced | ✓ | ✗ ~0.60 | ✓ | n/a | ✗ 46 | ✓ | ✓ ~0.887 |

## Steady rates / feasibility

| Métrica | Valor |
|---|---|
| requiredArrival | 474 s/sesión |
| actualArrival | ~83 s/sesión |
| service | ~839 s/sesión |
| mandatory horizonte / sesión | ~2811 / ~351 s |
| target margin | ~50 s/sesión |
| targetFeasibility | **feasible** (días infeasible ~26%) |
| topBaseBlockingReason | `mandatory-capacity` |
| capacitySafeNewWords avg | ~1.11 |
| pendingBase avg count / oldest wait | ~4.4 / ~2.3 |

## Feasibility por perfil

| Perfil | C8 applicable | target | actual | placement / base |
|---|---|---|---|---|
| steady | true | feasible | feasible | base~109s; placement n/a |
| intermittent | false | not-applicable | feasible | base~166s |
| bursty | false | not-applicable | feasible | base~116s |
| beginner | false | not-applicable | feasible | base~100s |
| advanced | false | not-applicable | feasible | **placement~630s**, demandSessions=167; base~147s |

## Efecto fairness / hipótesis C8

- C9 steady: 16 → **15** (mejora marginal; sigue rojo).
- C8 steady: 0.101 → **0.109** (mejora marginal; sigue rojo).
- `capacitySafeNewWords` avg ~1.1 frente a required 6 → el horizonte sigue
  saturado por mandatory + throughput cap, no solo por orden injusto.
- Hipótesis “pending ineficiente bloquea admission pese a capacidad agregada”:
  **parcialmente rechazada**. Hay capacidad agregada y target feasible, pero el
  bloqueo dominante diagnosticado es `mandatory-capacity` / saturación de
  servicio base (maxBase=4), no solo orden FIFO.

## C11 / lateness

Fórmula C11 sin cambios. Tras fairness:
- steady/advanced siguen verdes;
- intermittent/bursty/beginner siguen rojos (retención observada baja).
Pendiente: lateness p50/p95/max por perfil (diagnóstico; no desiredRetention).

## Adversariales

11/11 correctos.

## Cierre 8.9

target feasible + C8/C9 rojos con causa explicada (servicio/mandatory/
throughput, no rates ficticios) → **no cerrar 8.9 estructuralmente**;
continuar scheduler. **No 8.10.**
