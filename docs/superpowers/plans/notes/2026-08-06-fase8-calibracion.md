# Fase 8 — Task 8.9d: feasibility multidimensional (segundos + slots)

Fecha: 2026-08-07

Estado: **DETENER — C8/C9 matemáticamente incompatibles con el contrato
actual de `maxBaseSkillActivationsPerSession=4`.** No se inicia 8.10.
No se elige automáticamente opción A ni B.

## Contrato real de `maxBaseSkillActivationsPerSession`

Documentado en `describeMaxBaseSkillActivationsContract()`
(`base-throughput-contract-v1`):

| Pregunta | Respuesta (comportamiento LIVE) |
|---|---|
| A. ¿Hard cap? | **Sí**, techo de `selectActivations` para pending-base |
| B. ¿Safety/default? | Origen Task 8.9 como knob estructural; hoy se aplica |
| C. ¿L+P conjunto? | **Sí**, un solo contador |
| D. ¿Placement consume el cap? | **No** en conversión; sí después al activar L/P |
| E. ¿Learning steps? | **No** — van por `selectMandatory` |
| Excepción | `dueBaseCount` puede **subir** el techo para due ya reservados |

Para demanda C8 de nuevas palabras, feasibility modela
`serviceCapacity = maxBase` (sin due override): los due excepcionales sirven
deuda heredada, no crean capacidad para 12 activaciones/sesión nuevas.

## Demanda derivada (no hardcode)

```
requiredNewWords = ceil(10 × 0.60) = 6
requiredBaseSkills = [listening, production]  // contrato C9
requiredBase/session = 6 × 2 = 12
requiredBase/horizonte8 = 12 × 8 = 96
serviceBase/horizonte8 = 4 × 8 = 32
96 > 32 ⇒ baseActivations.infeasible ⇒ overall.infeasible
```

Segundos pueden seguir `feasible` — **no** salvan overall.

## Steady (hipótesis 96 vs 32)

| Métrica | Valor |
|---|---|
| required new words/sesión | 6 |
| required base/sesión | 12 |
| base service cap/sesión | 4 |
| served base/sesión (sim) | ~2.1 |
| required over 8 (solo C8) | **96** |
| capacity over 8 | **32** |
| seconds status | feasible |
| base-slot status | **infeasible** |
| overall target | **infeasible** |
| worst rolling-window margin | −213 |
| placement base demand | 0 |

## Cinco perfiles (sin cambiar políticas)

| Perfil | C8 | req base/s | cap | served | over8 req* | over8 cap | placement/s | worst window | seconds | slots | overall |
|---|---|---|---|---|---|---|---|---|---|---|---|
| steady | sí | 12 | 4 | ~2.1 | 96† / ~131* | 32 | 0 | −213 | feasible | **infeasible** | **infeasible** |
| intermittent | n/a | 0 | 4 | ~1.6 | ~57* | 32 | 0 | −178 | feasible | infeasible | n/a |
| bursty | n/a | 0 | 4 | ~1.9 | ~38* | 32 | 0 | −134 | feasible | infeasible | n/a |
| beginner | n/a | 0 | 4 | ~0.6 | ~36* | 32 | 0 | −120 | feasible | infeasible | n/a |
| advanced | n/a | 0 | 4 | ~2.7 | ~239* | 32 | **~23.3** | −875 | feasible | infeasible | n/a |

\*Incluye pending (+ placement). †Hipótesis pura C8→C9 sin deuda heredada.

## Efecto placement

Advanced añade ~23 activaciones/sesión de reservas L/P de placement al
numerador → bottleneck `placement` + `base-activation-slots`.

## C11

Sin cambios. Baseline 8.9c conservado.

## Adversariales

11/11 correctos.

## Opciones de diseño (NO elegidas)

**A.** `maxBase` es hard cap de producto.
→ Spec C8≥0.60 + C9≤8 + target 10 es **incompatible** con service≤4.
Requiere decisión de producto (bajar target/share, relajar C9, o aceptar
cap más alto como política explícita).

**B.** `maxBase` era safety/default.
→ Tarea posterior: `dynamicBaseActivationAllowance` desde capacidad residual
real, preservando C1–C5 y recovery. No subir el knobs en silencio aquí.

## No hecho

Sin subir/eliminar maxBase, sin cambiar admission/fairness para forzar verde,
sin tocar C8/C9/presupuesto/MaturityPolicy/8.10.
