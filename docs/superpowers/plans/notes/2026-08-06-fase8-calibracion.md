# Fase 8 — Task 8.9b: hard mandatory forecast + feasibility

Fecha: 2026-08-07

Estado: **forecast implementado; C8/C9/C11 siguen rojos**. Feasibility
estructural media dice `feasible` → el bloqueo restante es de
**scheduling/servicio**, no de knobs estructurales adicionales. No se inicia
8.10.

## Baseline previo (fin 8.9 / DETENTE)

| Perfil | C8 | C9 | C11 | Notas |
|---|---|---|---|---|
| steady | ✗ ~0.10 | ✗ 16 | ✓ | maxBase=4 + debt + throughput cap |
| intermittent | ✗ | ✗ 55 | ✗ | |
| bursty | ✗ | ✓ 8 | ✗ | |
| beginner | ✗ | ✗ 72 | ✗ | |
| advanced | ✗ | ✗ 12 | ✓ | |

C1–C5, C7, C10 verdes. C6 entregado a 8.10.

## Hard mandatory forecast

- `mapDueAtToActiveSession(dueAt, activeSessionDates)` mapea vencimientos a
  offsets 1..8 (días inactivos omitidos → siguiente sesión activa).
- `buildSimulationCapacityInput` usa ese mapeo para FSRS/provisional/learning
  futuros; deduplica por `itemId`.
- `applyMandatoryWithRollover` mueve mandatory no atendido al siguiente slot
  sin duplicar `itemId`.
- Ownership: `CapacityWorkKind` + `dedupeCapacityWork` (scheduled-review gana
  sobre `admission-future-review`).

## Admission envelope (`admission-envelope-v1`)

Provenance: `simulation-model` (dataset 8.8 sigue `insufficient-data`).

```
immediateSeconds = intro(10) + recognition(12) = 22
baseActivationSeconds = listening(20) + production(25) = 45
expectedReviewSecondsBySession[7] = recognition(12)
  // primer Easy desde New ≈ 8 días (ts-fsrs@5.4.1, desiredRetention=0.9)
```

`admitNewWords` aplica `applyExpectedFsrsReserve` antes de cada par
listening/production cuando se pasa el envelope (vía `planDailySession`).

## Resultado post-8.9b (mismos parámetros estructurales)

| Perfil | C1–C5 | C6 | C7 | C8 | C9 | C10 | C11 |
|---|---|---|---|---|---|---|---|
| steady | ✓ | ✗ 0.40 | ✓ | ✗ 0.101 | ✗ 16 | ✓ | ✓ 0.855 |
| intermittent | ✓ | ✓ | ✓ | ✗ | ✗ 55 | ✓ | ✗ 0.776 |
| bursty | ✓ | ✓ | ✓ | ✗ | ✓ 8 | ✓ | ✗ 0.776 |
| beginner | ✓ | ✓ | ✓ | ✗ | ✗ 72 | ✓ | ✗ 0.663 |
| advanced | ✓ | ✗ 0.60 | ✓ | ✗ | ✗ 18 | ✓ | ✓ 0.882 |

## Feasibility (C8≥0.60 ⇒ 6 nuevas/sesión; C9≤8)

Requisito: `requiredNewWordsPerSession = 6`.

| Perfil | structuralFeasibility | días infeasible (telemetría) | avg mandatory horizonte (s) | arrival−service (steady) |
|---|---|---|---|---|
| steady | feasible | 5% | ~2792 | ~−760 (servicio > arrival medido) |
| intermittent | feasible | 0% | ~1317 | n/a |
| bursty | feasible | 0% | ~1175 | n/a |
| beginner | feasible | 0% | ~735 | n/a |
| advanced | feasible* | **69%** | ~3407 | n/a |

\*Media estructural con base/placement=0 en el dump; a nivel día advanced
suele marcar `infeasible` cuando se exige la tasa C8 completa sobre mandatory
alto.

## Interpretación

1. El presupuesto **no** es imposible en media para 6 nuevas/sesión + envelope
   FSRS si mandatory futuro está acotado.
2. C8/C9 siguen rojos → fallo de **servicio/scheduling** (activaciones,
   orden, saturación temprana, huecos de práctica), no de umbrales C1–C11.
3. No se tocan MaturityPolicy, latencia, costes empíricos ni perfiles.
4. Revisar diseño de servicio de pending-base / fairness dentro de la clase
   antes de 8.10.

## Adversariales

11/11 correctos tras 8.9b.

## Dataset empírico

Sigue `insufficient-data`. Envelope `simulation-model` no implica calibración
empírica ready.
