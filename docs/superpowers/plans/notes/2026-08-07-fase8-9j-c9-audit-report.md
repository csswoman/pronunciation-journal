# Task 8.9j — Auditoría del contrato C9 reservation → service

**Estado: DETENIDO.** C9 sigue rojo en steady, intermittent, beginner y
advanced. **8.10 NO se inició.** No se modificó C1–C11, la semántica de C8, la
calibración de C11, `targetNewWords`, `budget`, `desiredRetention`,
`MaturityPolicy`, latencia/costes ni perfiles. Solo se añadió instrumentación
de solo-lectura (auditor conectado vía `SimulationHarnessHooks`, igual que
`experiments/sub-day-relearning.ts`) y tests; ningún archivo de producción
(`admission-control.ts`, `placement/*.ts`, `daily-budget.ts`,
`pending-base-fairness.ts`, `base-throughput-contract.ts`) fue tocado.

## 1. Definición canónica de C9 (spec vigente, cita textual)

> Una habilidad base elegible no permanece con `schedule.kind === "none"` más
> de `Y` sesiones activas si existe presupuesto acumulado. Medir listening y
> production por separado en el diagnóstico.

(`docs/superpowers/specs/2026-08-06-essential-words-skill-model-design.md`,
sección "Criterio 9"; `Y = C9_BASE_ACTIVATION_LIMIT = 8`.)

Implementación: `baseSkillActivationLiveness(observations, 8)` en
`lib/essential-words/simulation/criteria/progress.ts`, sobre
`EligibilityObservation[]` construido por `observeEligibility` — el reloj
arranca en la primera sesión donde `introducedAt` está poblado y
`schedule.kind === "none"` (listening: inmediato al admitir; production:
solo una vez que listening deja de estar en `"none"`), y se resetea en cuanto
`scheduleKind !== "none"`.

**Población que cuenta C9** (respuesta a §1 y §10 de la tarea): listening y
production de toda palabra con `introducedAt` definido — sin distinguir en el
criterio mismo el origen. El origen (`new-word-admission` / `placement` /
`preexisting-pending` / `migration`) no existe como campo en el runtime; se
reconstruyó en esta tarea (`lib/essential-words/simulation/audit/c9-obligation-trace.ts`).

**Promesa de la Task 8.6 (cita textual):**

> Para una palabra nueva se clona el ledger y se intenta, como una
> transacción: 1) comprobar que introducción + meaning cabe en la sesión
> actual; 2) reservar listening en el primer slot futuro con capacidad; 3)
> reservar production en el primer slot posterior a listening y como máximo
> en `sessionOffset = 8`; 4) confirmar ambas reservas solo si las dos caben;
> de lo contrario, revertir. […] Por tanto, toda palabra admitida tiene
> listening y production reservados dentro de ocho sesiones activas.

**Promesa de la Task 8.7 (placement, cita textual — clave para el hallazgo
de §9):**

> Cada conversión reserva listening, production y provisional contra el
> mismo ledger. Probar offsets deterministas dentro de la ventana y
> **rechazar la cohorte si rompe C9** o no existe forecast hasta dueAt. **El
> límite diario queda como protección secundaria, nunca como control
> suficiente.**

## 2. Scope por source (perfil, 180 días, corpus 1000, budget 900s, target 10, seed 42)

| Perfil | new-word count / p50 / p95 / max wait / violations | placement count / p50 / p95 / max / violations | preexisting |
|---|---|---|---|
| steady | 370 / 1 / 7 / 31 / **12** | — (placementConfidence=low, sin conversiones) | 0 |
| intermittent | 146 / 2 / 8 / 22 / **7** | — | 0 |
| bursty | 104 / 1 / 7 / 8 / **0** | — | 0 |
| beginner | 66 servidas / 1 / 5 / 5 / 0 (+ **8 nunca servidas** en 180 días) | — (placementConfidence=none) | 0 |
| advanced | 216 / 1 / 2 / 3 / **0** | 224 / 7 / 26 / 47 / **93** | 0 |

`preexisting-pending`/`migration` = 0 en las cinco corridas: **el modelo de
simulación no siembra deuda heredada** (`createInitialWorld` arranca con
`introducedAt: undefined` para el 100% del corpus). La pregunta de §10 ("¿la
spec exige C9 también para deuda heredada?") queda **fuera de alcance de esta
simulación** — no hay población que auditar aquí; es una pregunta de
onboarding real (usuarios existentes con historial Dexie) que 8.9j no puede
responder con este arnés y que debe abrirse como su propia decisión de spec
si/cuando se diseñe el onboarding a producción.

**Conclusión §2:** el rojo agregado viene de **A** (new-word-admission,
steady/intermittent) + **B** (placement, advanced) + starvation total en un
puñado de ítems (beginner). Sin C, sin D combinado con deuda heredada — no
existe tal deuda en este arnés.

## 3. Promesa de 8.6 — invariante verificada

Test `A/B` (`c9-obligation-audit.test.ts`): `admitNewWords` sobre un
candidato produce **exactamente** una reserva listening + una production,
ambas con `deadlineSession <= 8`, production nunca antes que listening.
Verificado también empíricamente sobre las 5 corridas completas:
**`missingReservation = 0` en los cinco perfiles** — ninguna palabra
introducida carece de sus dos reservas. La invariante de §3 se sostiene sin
excepción. **No es un bug.**

## 4. Ciclo de vida de la reserva — identidad estable

`ReservationLifecycle` reconstruido por diff de `world.futureReservations`
sesión a sesión (identidad = `itemId`, estable de principio a fin).
Resultado agregado de transiciones sobre las cinco corridas:

| Perfil | reserved | rolled | completed | released | expired |
|---|---|---|---|---|---|
| steady | 370 | 528 | 315 | **0** | 55 |
| intermittent | 146 | 160 | 81 | **0** | 65 |
| bursty | 104 | 78 | 82 | **0** | 22 |
| beginner | 74 | 43 | 56 | **0** | 18 |
| advanced | 440 | 715 | 217 | **0** | 223 |

**`released = 0` en las cinco corridas y en los cinco perfiles.** Ninguna
reserva desaparece del ledger sin `completed` explícito. Esto es una prueba
directa (no una suposición) de que **no hay bug de "reserva perdida"** en
`updateSimulationCapacityReservations`/`beginActiveSessionReservations`.

`expired` (sesión actual > deadline absoluto de la reserva, sin servicio ni
liberación) es alto incluso en `bursty` (22/104, que sigue pasando C9). Esto
reveló una distinción importante que documento explícitamente: el
`deadlineSession` que vive en el ledger es **el slot asignado en el momento
de la reserva** (el resultado de `reserveInPlace`, la primera sesión con
hueco, no necesariamente "sesión 8"), no el límite legal real de C9 (que se
mide desde la primera elegibilidad, un reloj distinto que vive en
`EligibilityObservation`). Que una reserva "expire" respecto a su slot
asignado no equivale a violar C9: en las cinco corridas,
`violatedWithLedgerExpired` (violaciones de C9 reales que coinciden con una
reserva marcada `expired`) fue igual a `reservedButServedAfterDeadline` en
cada perfil (12/7/0/0/93) — es decir, **toda violación real de C9 coincide
con una reserva vencida**, pero no toda reserva vencida es una violación de
C9 (el sistema recupera la mayoría antes de los 8). Esto también responde
Test D y E: ninguna reserva se cierra dos veces (`terminal.length <= 1`
verificado) y el rollover conserva identidad (`rolled` monotónico).

## 5. Forecast promise vs. mandatory futuro real

Método (usando telemetría ya expuesta en `SimulatedDay`, sin instrumentación
nueva de producción): por cada sesión con admisión de palabras nuevas,
`forecastMandatorySeconds = futureMandatoryReservedSeconds + expectedFsrsDebtSeconds`
(lo que el envelope de admisión reservó para las próximas 8 sesiones) vs.
`actualMandatorySeconds` = suma real de `mandatorySelectedSeconds` en las 8
sesiones activas siguientes.

| Perfil | muestras | p50 error (s) | p95 error (s) | max error (s) | min error (s) |
|---|---|---|---|---|---|
| steady | 30 | 3685 | 4836 | 4876 | 2716 |
| intermittent | 11 | 4886 | 5241 | 5241 | 3693 |
| bursty | 8 | 5051 | 5296 | 5296 | 3922 |
| beginner | 6 | 5758 | 6058 | 6058 | 4499 |
| advanced | 13 | 2235 | 2565 | 2565 | 1715 |

**El error es positivo (mandatory real > forecast) en el 100% de las
muestras, en los cinco perfiles, sin una sola excepción negativa.** El
forecast de admisión (`admission-envelope-v1` + `expectedFsrsReserve`) es
**sistemáticamente optimista**, nunca pesimista — confirma cuantitativamente
lo ya documentado cualitativamente en 8.9f/8.9g. Importante: `bursty` tiene el
error absoluto más alto de los cinco perfiles y aun así pasa C9 — el error de
forecast por sí solo no determina el resultado de C9; lo que importa es si el
error se sostiene el tiempo suficiente para que la cola de pendientes crezca
sin drenar (bursty tiene pausas de 14 días sin nueva demanda que le dan
tiempo a la fairness de vaciar backlog; steady/intermittent/beginner/advanced
no tienen esa pausa).

## 6. Clasificación de violaciones por causa

Sobre 12+7+0+0+93 = 112 violaciones reales de C9 en las cinco corridas:

| Causa | Evidencia | Perfiles |
|---|---|---|
| `missing-reservation` | 0 casos — invariante de §3 se sostiene siempre | ninguno |
| `reservation-lost` | 0 casos — `released = 0` siempre | ninguno |
| `forecast-underestimated-mandatory` | 100% de las violaciones de new-word-admission (steady 12, intermittent 7) coinciden con forecast error > 0 sostenido; ninguna violación ocurrió con `admittedUnderCapacityForecast: false` | steady, intermittent |
| `placement-overcommit` | 93/224 (41%) de las obligaciones de placement en `advanced` violan C9 pese a que el 100% fue `admittedUnderCapacityForecast: true` — el contrato de la Task 8.7 exige "rechazar la cohorte si rompe C9" y que el límite diario sea solo protección secundaria; `DEFAULT_CONVERSIONS_PER_DAY = 8` (`placement/policy.ts`, comentado como "provisional") es hoy el único freno real y no verifica el efecto agregado sobre C9 | advanced |
| `physically-infeasible-after-admission` (starvation total, no solo tardanza) | beginner: 8 obligaciones nunca activadas en 180 días (de solo 74 totales) — no es "llegó tarde", es que nunca llegó dentro de la ventana observada; el perfil admite muy pocas palabras nuevas (46 obligaciones = 23 palabras en 180 días) por baja accuracy/alto churn de learning-step, y aun así una fracción se queda sin servir | beginner |
| `scheduler-skipped-reserved-work` | 0 casos — el ranking (`comparePendingBaseCandidates`) prioriza correctamente por deadline restante y luego por mayor `waitSessions`; no hay evidencia de que un ítem más antiguo pierda contra uno más nuevo por un empate mal roto | ninguno |
| `deadline-accounting-error` | 0 casos — verificado exactamente por Test F/G: servicio en la sesión 8 activa desde la primera elegibilidad pasa (`measured=8`), en la sesión 9 falla (`measured=9`); días inactivos no generan observación (Test H) | ninguno |
| `preexisting-unreserved-debt` | 0 casos — no existe población preexistente en este arnés (§2) | ninguno |
| `other` | 0 casos | — |

`other` no se usó en ningún caso — todas las 112 violaciones quedaron
explicadas por una causa concreta con diagnóstico adjunto.

## 7. Deadline accounting

Confirmado exactamente (test `F/G`): con `baseSkillActivationLiveness(obs, 8)`,
8 sesiones activas consecutivas de espera (`measured=8`) → `passed=true`; 9
sesiones (`measured=9`) → `passed=false`. Confirmado (test `H`) que solo los
días activos generan `EligibilityObservation` — los días inactivos no avanzan
`sessionIndex` ni el reloj de C9 (`run-simulation.ts` hace `continue` antes de
`observeEligibility` en días inactivos). Placement usa la misma semántica de
sesiones activas (mismo `world.sessionIndex`, mismo mecanismo de
`beginActiveSessionReservations`).

## 8. Listening vs. production

| Perfil | listening p50/p95/max/violations | production p50/p95/max/violations |
|---|---|---|
| steady | 1/5/7/0 | 1/9/31/**12** |
| intermittent | 2/7/9/**1** | 2/22/22/**6** |
| bursty | 1/5/6/0 | 1/8/8/0 |
| beginner | 1/2/2/0 | 2/5/5/0 |
| advanced | 7/26/47/**91** | 1/3/28/2 |

En steady/intermittent, **production concentra casi todas las violaciones**
(la regla "production después de listening" hace que production nazca
elegible más tarde y con menos margen real, aunque su reserva del ledger ya
tenga deadline propio desde la admisión). En advanced ocurre lo inverso:
**listening** concentra el 91/93 de las violaciones — porque el volumen viene
de placement, donde listening es el primer skill en competir por el residual
de la sesión contra un backlog de hasta 224 conversiones. No se eliminó la
precedencia listening→production (fuera de alcance); se deja documentado que
la precedencia por sí sola no es la causa dominante — el volumen/forecast sí.

## 9. Placement — hallazgo de contrato (CASE D)

Cada conversión de placement pasa por `admitPlacementConversions`, que
reserva contra el **mismo** ledger (`reserveCapacity`) que `admitNewWords`
— no hay una ruta paralela sin reserva (§9 de la tarea, primera pregunta,
respondida: **no**, placement no crea obligaciones sin capacidad/reserva
registrada; `admittedUnderCapacityForecast = true` en el 100% de los 224
casos de `advanced`). El bug no está en "reservar sin ledger"; está en que
**el volumen de conversiones por sesión no se valida contra el efecto
agregado sobre C9**, contradiciendo el texto explícito de la Task 8.7 citado
en §1. `conversionLimit` (`placement/policy.ts::conversionLimit`) solo
pondera por confianza promedio contra una constante fija
(`DEFAULT_CONVERSIONS_PER_DAY = 8`, marcada en el código como "provisional:
se calibra en la Fase 8"); no existe un análogo a `capacitySafeNewWords` que
mida cuántas conversiones son C9-seguras dado el backlog ya pendiente antes
de comprometerlas.

**No se corrigió en esta tarea.** Corregirlo exige diseñar el análogo de
`capacitySafeNewWords` para placement (cuántas conversiones caben sin
empujar ninguna obligación — propia o ajena, incluidas las de new-word que
comparten el mismo residual — más allá de 8 sesiones) y no es un cambio de
una línea: toca `placement/admission.ts`, `placement/policy.ts` y
probablemente el orden de reserva del ledger. Intentarlo al final de una
auditoría ya extensa arriesgaba romper C7/adversariales sin el ciclo de
tests dedicado que merece. **Queda documentado como corrección pendiente,
con ubicación exacta y criterio de aceptación (rechazar cohortes que
rompan C9, igual que new-word), para una tarea futura antes o dentro de
8.10.**

## 10. Deuda preexistente

Respondido en §2: en el arnés de simulación actual **no existe** población
preexistente (el mundo siempre arranca con `introducedAt: undefined` para
el 100% del corpus) — por lo tanto no hay ambigüedad que resolver *dentro de
esta simulación*. La pregunta real ("¿C9 aplica a deuda heredada de
onboarding real, y desde qué sesión arranca su reloj?") es de producción, no
de esta simulación, y **no se puede cerrar aquí**: se deja abierta
explícitamente para cuando se diseñe el flujo de onboarding/migración real
(Fase 9+). El módulo de auditoría (`c9-obligation-trace.ts`) ya sabe
clasificar `preexisting-pending` correctamente si algún día se siembra deuda
inicial (test `M`, con un mundo sintético construido a mano, confirma la
clasificación).

## 11. Escenario controlado-limpio

Backlog cero, `placementConfidence: "none"`, corpus 20, budget 1800s,
target 3 palabras/sesión, accuracy alta (0.95+), 40 días, dailyRate=1 (test
`I/J`). Resultado: **`baseSkillActivationLiveness` pasa** (`passed: true`);
**100% de las obligaciones servidas dentro de la corrida cumplen `<=8`**
(`served.every(o => !o.violatedC9) === true`); cero reservas `released`. Esto
prueba, con la admisión real (no un mock), que el mecanismo
reservation→service **funciona correctamente cuando la demanda admitida no
excede sostenidamente la capacidad real** — la falla en los perfiles rojos no
es un bug latente que también afecte al caso limpio.

## 12. Forecast shock

Test `K`: corrida de 90 días de `steady` (perfil de alta demanda continua,
sin inyectar nada artificial — el "shock" es el crecimiento natural de
mandatory a medida que se admite corpus, ya evidenciado en §5).
**`released = 0`** (el ledger no suelta ninguna reserva bajo esta presión) y
**el error de forecast es positivo en el 100% de las muestras** (nunca
negativo). Esto confirma la **Política A** que la spec pretende: las
reservas son compromisos que el ledger mantiene vivos (no se sueltan ni se
inventan bajo presión); lo que falla es que el *forecast* que decide cuánto
admitir es optimista, no que el *ledger* incumpla lo ya prometido. No se
inventó una política B de breach — no hace falta: no hay breach del ledger,
hay optimismo del forecast que alimenta la decisión de admisión.

## 13. Métricas por perfil (resumen)

Ver tablas §2, §4, §5, §8. Total de obligaciones auditadas: steady 370,
intermittent 146, bursty 104, beginner 74, advanced 440. Reservas creadas =
obligaciones (1:1, cada obligación tiene su reserva — confirma §3 otra vez).
`scheduler skips de reserved work` = 0 en los cinco perfiles (ninguna
violación se explica por un salto de ranking).

## 14. Tests obligatorios A–P

Implementados en
`lib/essential-words/simulation/__tests__/c9-obligation-audit.test.ts`
(11 tests, todos verdes) + reuso de `admission-control.test.ts` existente:

| Test | Resultado |
|---|---|
| A. New-word admission crea L+P | ✅ (`admitNewWords` unitario) |
| B. Reservations deadline <=8 sesiones activas | ✅ |
| C. Reserva no desaparece silenciosamente | ✅ (`released=0`, 5 perfiles) |
| D. Completion cierra la reserva exactamente una vez | ✅ (`terminal.length<=1`) |
| E. Rollover conserva identidad | ✅ (`rolled` monotónico) |
| F. Sesión 8 activa pasa C9 | ✅ |
| G. Sesión 9 activa falla C9 | ✅ |
| H. Días inactivos no consumen C9 | ✅ |
| I. Escenario controlado cumple C9 al 100% | ✅ |
| J. Mandatory correctamente forecast no rompe reserva prometida | ✅ |
| K. Forecast subestimado se identifica como causa, no starvation genérica | ✅ |
| L. Placement no crea obligaciones sin capacidad/reserva | ✅ (pero sí sobre-compromete el agregado — §9) |
| M. Preexisting debt se reporta separado | ✅ |
| N. Listening/production medidos separados | ✅ |
| O. Dedupe — sin doble conteo | ✅ |
| P. 11 adversariales siguen verdes | ✅ (`adversarial.test.ts`, 11/11) |

## 15. Regla de decisión aplicada

- **Steady, intermittent** (new-word-admission): **CASO B/E mixto** —
  reservas correctas y nunca perdidas; el forecast de admisión es
  sistemáticamente optimista bajo demanda sostenida (§5); esto no es un shock
  puntual sino el estado estacionario de perfiles de alta frecuencia. No es
  corregible con un ajuste de forecast trivial sin rehacer
  `admission-envelope-v1` (ya evaluado y explícitamente diferido en
  8.9h/8.9i). **DETENIDO** — requiere la decisión explícita de §15/Caso E:
  ¿C9 es un compromiso duro (el scheduler debe desplazar mandatory u otro
  trabajo para cumplirlo) o un objetivo best-effort bajo el envelope actual?
- **Beginner** (starvation total de 8 obligaciones): **CASO E** — capacidad
  genuinamente insuficiente dado el perfil (baja accuracy → alto churn de
  aprendizaje que consume casi todo el residual); no hay reserva perdida ni
  bug de ranking. Mismo DETENIDO que el punto anterior.
- **Advanced** (placement): **CASO D** — el contrato de la Task 8.7
  ("rechazar la cohorte si rompe C9... el límite diario nunca es control
  suficiente") no se cumple hoy. Corrección identificada y documentada
  (§9), no implementada en esta tarea por alcance/riesgo.

**Ninguna causa cae en `missing-reservation`, `reservation-lost`,
`scheduler-skipped-reserved-work`, `preexisting-unreserved-debt` ni
`deadline-accounting-error`.** El contrato de *creación e identidad* de la
reserva (8.6) está probado correcto. Lo que falla es *capacidad agregada*
(forecast optimista + placement sin freno agregado), no la mecánica de
reserva en sí.

## 16. Gate de salida

**No cumplido.** C9 permanece rojo en steady, intermittent, beginner y
advanced. Por regla explícita del enunciado, **8.10 no se inicia** mientras
C9 siga rojo — y no se inició. El resto de C1–C11 y los 11 adversariales
están verdes (ver validación).

## Validación ejecutada

- `c9-obligation-audit.test.ts` (11/11) ✅
- `lib/essential-words/**` completo: 862 tests, 856 pasan; **los 6 que
  fallan son exactamente el baseline ya conocido y documentado en 8.9i**
  (C6 cuota-usage en steady/advanced — reservado para 8.10; C9 liveness-base
  en steady/intermittent/beginner/advanced — auditado aquí, sigue rojo por
  diseño según §15). Ningún test nuevo falla; ningún test antes verde pasó a
  rojo.
- `adversarial.test.ts`: 11/11 ✅
- `tsc --noEmit`: sin errores ✅
- `eslint` sobre los archivos nuevos: sin errores ✅
- `git diff --check` sobre los archivos nuevos: limpio ✅

## Archivos añadidos

- `lib/essential-words/simulation/audit/c9-obligation-trace.ts` — instrumentación de solo lectura (hooks), `BaseObligationTrace`, `ReservationLifecycle`.
- `lib/essential-words/simulation/__tests__/c9-obligation-audit.test.ts` — tests A–P.
- `scripts/essential-words/fase8-9j-c9-audit.mts` — script de reporte por perfil (fuente de las tablas de este documento).
- Este documento y la actualización de trazabilidad en el plan (`§9 criterio 9`).

Ningún archivo de producción fue modificado.
