# Fase 8 — calibración estructural (Task 8.9)

Fecha: 2026-08-07

Estado: **DETENTE estructural en C8/C9/C11** — C1–C5/C7/C10 se preservan;
C6 queda explícitamente para 8.10. No se inicia 8.10.

## Configuración reproducible

- semilla: `42`
- horizonte: `180` días
- inicio: `2026-08-01T00:00:00.000Z`
- corpus: `1.000` palabras
- presupuesto: `900 s` por sesión activa
- objetivo: `10` palabras nuevas por sesión elegible
- costes fallback (provenance `fallback`, dataset empírico `insufficient-data`):
  recognition 12 / production 25 / listening 20 / pronunciation 30 / intro 10

```powershell
pnpm exec vitest run lib/essential-words/simulation/__tests__/acceptance.test.ts --maxWorkers=1
pnpm exec tsx scripts/essential-words/fase8-criteria-dump.mts
```

## Baseline de entrada (post 8.5–8.8, pre 8.9)

| Perfil | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| steady | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ 0.41 | ✓ | ✗ 0.096 | ✗ 34 | ✓ | ✓ 0.852 |
| intermittent | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ 0.33 | ✓ | — | ✗ 35 | ✓ | ✗ 0.804 |
| bursty | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | — | ✗ | ✓ | ✗ |
| beginner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✗ | ✓ | ✗ |
| advanced | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | — | ✗ | ✓ | ✓ |

Diagnóstico de entrada (steady):

- C8: tras ráfaga temprana (`capacitySafe` 40→0) la admisión queda en
  `capacitySafe=0` ~150 sesiones; solo ~173/1800 palabras.
- C9: espera listening hasta 34; el ledger de segundos prometía más work del
  que `maxBase=2` podía servir; además reservas incompletas se perdían al
  regenerar el plan.
- C11 (intermittent/bursty/beginner): retención observada <0.85 por reviews
  atendidas tarde / presión de backlog (fórmula 8.5 intacta).

## Causas por criterio

### C8 steady — new-word liveness

Clasificación: **política de admission + saturación del horizonte + carga
mandatory futura no reservada en el ledger**.

No es un simple déficit de `newWords`. El ledger reserva listening/production,
pero no el coste FSRS posterior; la admisión temprana llena el horizonte y
después `unreservedItemIds` / residual cero bloquean nuevas palabras mientras
las sesiones siguen en “low pressure” para C8.

### C9 — base skill liveness

| Perfil | Causa dominante |
|---|---|
| steady | cola listening/production supera servicio; debt de reservas |
| intermittent | mismos + huecos de práctica alargan espera activa |
| bursty | recuperable ≤8 con servicio 4 (único perfil verde al final) |
| beginner | starvation severa (completion 0.9 + menos residual) |
| advanced | placement añade listening; compite con new-word debt |

Motivos observados: `no capacity` / `mandatory load` / pérdida de deuda de
reserva (bug) / throughput de admisión desacoplado del límite de activación.

### C11 — retention

No se cambió la fórmula 8.5 ni `desiredRetention`. Fallos en intermittent /
bursty / beginner por **reviews programadas atendidas con retraso** relativo a
la estabilidad FSRS (ligado a C9/backlog), no por `accuracyByModality`.

## Parámetros explorados (uno a la vez / paquetes revertidos)

| Cambio | Efecto | Decisión |
|---|---|---|
| Preservar deuda de reservas en `updateSimulationCapacityReservations` | C9 steady 34→~10–16; C8 ≈igual | **Aceptado** (bug fix) |
| Cap de throughput en new-word admission (`applyAdmissionThroughputCap`) | Evita `capacitySafe≈40` el día 0; alinea admisión a activaciones | **Aceptado** |
| `maxBase` 2→8 / 12 | C8 no alcanza 0.6; regresa C3/C4/C5 | **Revertido** |
| Cap throughput antes de pending+placement | `provisional-due` trivial en advanced | **Revertido** |
| Relajar hard-block `unreservedItemIds` | C8 sigue ≪0.6; regresa C3/C4 bursty | **Revertido** |
| `maxBase=5` | C4 rojo en bursty/beginner/advanced | **Revertido** |
| `maxBase=4` + cap solo new-word + debt | Mejor equilibrio sin romper C1–C5/C7/C10 | **Aceptado** |

## Configuración final provisional 8.9

| Parámetro | Valor |
|---|---|
| `maxBaseSkillActivationsPerSession` | `4` |
| `maxUsageActivationsPerSession` | `1` |
| `applyAdmissionThroughputCap` en new words | sí (mismo maxBase) |
| Preservación de deuda de reservas | sí |
| Hard-block new words si `unreservedItemIds` | sí (garantía C9) |
| RecoveryPolicy | sin cambio (2.0 / 0.75) |
| Placement conversions/day | sin cambio (`band-v1`, 8) |
| Maturity / latency / costes fallback | **sin tocar** |
| Dataset empírico | `insufficient-data` |

## Resultado final 8.9

| Perfil | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| steady | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ ~0.10 | ✗ 16 | ✓ | ✓ |
| intermittent | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ 55 | ✓ | ✗ ~0.79 |
| bursty | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ 8 | ✓ | ✗ ~0.78 |
| beginner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ 72 | ✓ | ✗ ~0.66 |
| advanced | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ 12 | ✓ | ✓ |

Adversariales: deben seguir detectando motores defectuosos (sin cambios de umbral).

## Por qué DETENTE (revisión de diseño)

Cerrar C8 (≥0.6×10 nuevas/sesión low-pressure) exige ~6 admisiones/sesión
sostenidas. Cada palabra necesita 2 activaciones base → ~12 activaciones/sesión
solo para el pipeline de nuevas, además del mandatory FSRS que crece con el
inventario. Con presupuesto 900s el mandatory maduro deja residual insuficiente;
subir `maxBase` para servir C9 come el residual de C8 y regresa recovery/C4.

El ledger actual **no reserva el coste de reviews futuras** al admitir. Sin ese
contrato (o sin bajar el target / subir presupuesto / calibrar madurez en 8.10),
C8∧C9∧C11 no son alcanzables solo con parámetros estructurales seguros.

## Riesgos pendientes → 8.10+

- C6 (usage share) en steady/advanced — madurez/usage lifecycle
- C8/C9 estructurales pueden requerir reserva de reviews futuras en el ledger
- C11 en perfiles con huecos — depende de atender scheduled reviews a tiempo
- Dataset empírico sigue `insufficient-data`; no sustituir fallbacks
