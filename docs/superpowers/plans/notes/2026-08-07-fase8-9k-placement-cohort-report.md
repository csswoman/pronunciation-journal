# Task 8.9k — Aplicar admisión agregado C9-safe a placement

**Estado:** implementado y verificado. Regla de parada (§14) invocada: el
mecanismo de admisión quedó correcto, pero C9 sigue rojo en `advanced` por
una causa distinta y fuera del alcance de esta tarea. **8.10 no se inició.**

## Qué se cambió

`lib/essential-words/placement/admission.ts` (`admitPlacementConversions`):

1. **Envelope FSRS compartido (§1).** Acepta el mismo `AdmissionLoadEnvelope`
   que `admitNewWords`. Cada candidato aceptado reserva su propio margen de
   deuda FSRS esperada contra el forecast ya reducido por los candidatos
   previamente aceptados en la misma cohorte (mismo patrón que `reservePair`
   en `admission-control.ts`: N conversiones aceptadas apilan N unidades de
   deuda en la sesión donde cae el primer review Easy).
2. **Modelo de demanda explícito (§4).** Nueva interfaz
   `PlacementCapacityDemand` (`inferenceId`, `wordId`, `baseObligations`) y
   `buildPlacementCapacityDemand`, usados por `reserveDerivedSkills` en vez de
   construir las reservas de forma implícita.
3. **Re-chequeo agregado explícito (§5).** Tras cada reserva exitosa,
   `allCommittedWithinC9` verifica que *todas* las reservas
   listening/production comprometidas hasta ese punto sigan `deadlineSession
   <= 8` antes de aceptar la conversión en el forecast compartido. Cuenta en
   `rejectedForAggregateC9` (defensa en profundidad: por construcción de
   `reserveCapacity` —solo consume segundos sobrantes, nunca reescribe una
   reserva existente— este contador se mantuvo en **0** en todas las
   corridas, confirmando que la evaluación ya era sólida).
4. **Telemetría de rechazo (§6/§9).** `PlacementAdmissionResult` ahora expone
   `rejectedForCapacity`, `rejectedForSafetyCeiling` y
   `rejectedForAggregateC9`, además de `capacitySafeConversions` (ya
   existente). `DailyPlan.placementCapacity` y los campos
   `placement*` en `SimulatedDay` (`placementCapacitySafeConversions`,
   `placementRejectedForCapacity`, `placementRejectedForSafetyCeiling`,
   `placementRejectedForAggregateC9`) lo llevan hasta la telemetría de
   simulación.
5. **`daily-budget.ts`**: el `AdmissionLoadEnvelope` se construye una sola vez
   y se reutiliza tanto para `admitPlacementConversions` como para
   `admitNewWords` (antes solo lo usaba new-word).

La evaluación **acumulativa de la cohorte** (§2), el **contrato atómico**
(§3) y la distinción **ceiling vs. `capacitySafeConversions`** (§6,
`accepted = min(safetyCeiling, capacitySafeConversions)`) ya existían
estructuralmente en el código heredado — se verificaron con tests nuevos en
vez de reescribirse, porque ya cumplían la letra de la Task 8.7.

## Algoritmo acumulativo final

```
capacityForecast = forecast inicial (compartido con new-word, vía buildFutureCapacity)
committedForecast = forecast inicial
para cada candidato en orden:
  si no es inferido o ya no está "none": deferred, continuar
  trial = intentar reservar demanda completa (L, P, provisional)
          contra capacityForecast + envelope FSRS fresco de este candidato
  si trial falla: deferred, rejectedForCapacity++, continuar
  si allCommittedWithinC9(trial.forecast) es falso: deferred, rejectedForAggregateC9++, continuar
  capacityForecast = trial.forecast          # cuenta para capacitySafeConversions
  capacitySafeConversions++
  si admitted.length >= maxConversionsPerSession:
    deferred, rejectedForSafetyCeiling++, continuar
  committedForecast = trial.forecast          # solo lo realmente admitido
  admitted.push(candidato convertido)
retornar { admitted, capacitySafeConversions, forecast: committedForecast, ... }
```

`accepted.length` es siempre `min(maxConversionsPerSession,
capacitySafeConversions)`; nunca `= maxConversionsPerSession` mientras haya
candidatos, porque `capacitySafeConversions` se mide contra la demanda real
del ledger (segundos por sesión), no contra el techo.

## Diferencia entre safety ceiling y `capacitySafeConversions`

En `advanced` (180 días, corpus 1000, budget 900s, target 10), en los días en
que placement corre (`hasProvisionalForecast` verdadero, ~1 de cada 4 días
activos):

| Día muestra | candidatos | admitted | capacitySafe | rejByCapacity | rejByCeiling |
|---|---|---|---|---|---|
| 2026-08-01 | 230 | 8 | 122 | 108 | 114 |
| 2026-08-17 | 182 | 8 | 80 | 102 | 72 |
| 2026-08-21 | 174 | 8 | 78 | 96 | 70 |

Totales acumulados (180 días): `admitted=112`, `capacitySafe=1153`,
`rejectedForCapacity=1339`, `rejectedForCeiling=1041`,
`rejectedForAggregateC9=0`.

`capacitySafeConversions` siempre excede ampliamente el techo de 8 —
confirma el diagnóstico de 8.9j: `DEFAULT_CONVERSIONS_PER_DAY=8` es hoy el
freno operativo, no un límite artificial sobre una capacidad ya escasa. El
ledger (medido en segundos) declara mucha más capacidad "segura" que la que
`maxConversionsPerSession` permite usar.

## Resultado: violaciones de placement antes/después

| | antes de 8.9k | después de 8.9k |
|---|---|---|
| `advanced` placement base obligations | 224 | 224 |
| `advanced` placement violations C9 | 93 (~41%) | **93 (~41%) — sin cambio** |
| `missingReservation` | 0 | 0 |
| `released` inesperado | 0 | 0 |
| `notAdmittedUnderCapacityForecast` | 0 | 0 |
| `rejectedForAggregateC9` | n/a | 0 |

El fix del envelope FSRS no cambió el resultado porque el único slot no-cero
del envelope cae en la sesión 8 (`FSRS_NEW_EASY_INTERVAL_DAYS=8`), y las
obligaciones listening/production de placement tienen deadline interno 6/7 —
nunca llegan a competir por la sesión 8. Se verificó con un test dedicado
(`el envelope de FSRS reduce la capacidad disponible para el provisional de
sesión 8`) que el envelope sí reduce la capacidad disponible para el
provisional de *meaning*, que puede caer en sesión 8; pero eso no es lo que
está violando C9 en `advanced` (91 de las 93 violaciones son de listening,
2 de production — ninguna de "meaning"/provisional).

## Regla de parada (§14): diagnóstico exacto

Con el contrato agregado ya correcto (confirmado por los tests y por
`rejectedForAggregateC9 = 0`), la causa real de las 93 violaciones
persistentes es una **asimetría entre dos ledgers independientes**:

- **Ledger de admisión** (`CapacityForecast`, en `admitPlacementConversions`
  y `admitNewWords`): mide **segundos disponibles por sesión**. Con
  `dailyBudgetSeconds=900` y costes de listening/production de decenas de
  segundos, el residual en segundos permite reservar decenas de conversiones
  por ventana de 8 sesiones — de ahí `capacitySafeConversions` en el orden de
  80-122 mientras el techo es 8.
- **Ledger de selección real** (`selectBaseDynamically`, vía
  `absoluteBaseActivationSafetyCeiling = 24` en
  `base-activation-allowance.ts`): limita cuántos ítems base se activan **por
  conteo**, sin importar cuántos segundos sobren. Una ráfaga sostenida de 8
  conversiones/día (16 obligaciones nuevas) más el new-word admission propio
  ya compiten diariamente por ese cupo de 24 slots, junto con TODO el
  pending-base heredado de ráfagas anteriores que aún no fue servido.

Una reserva de `admitPlacementConversions` reserva **segundos** en una
sesión futura, pero no reserva un **slot de conteo** en
`selectBaseDynamically`. El día en que esa reserva "vence", puede perder la
competencia por los 24 slots frente a ítems con deadline canónico C9 más
urgente (`Math.max(1, 8 - waitSessions)`, calculado independientemente en
`base-wait.ts`, sin relación con el `deadlineSession` interno 6/7 que usa la
reserva de placement) — y termina sirviéndose después de sesión 8.

Evidencia:
- `reservation lifecycle`: 440 reservas totales, 0 `missingReservation`, 0
  `released` inesperado, 93 `reservedButServedAfterDeadline` — exactamente
  las 93 violaciones, todas con la reserva **presente y correcta hasta el
  final**, nunca perdida.
- `forecast al admitir`: `notAdmittedUnderCapacityForecast = 0` — el ledger
  de segundos declaró "seguro" en el 100% de los casos que luego violaron.
- `mandatory posterior`: `forecastMandatoryErrorSeconds` para `advanced`
  (p50=2235s, p95=2565s, siempre positivo) confirma que el problema no es
  "reservas perdidas" sino "más demanda competitiva de la que el forecast en
  segundos anticipa" — coherente con el mecanismo de conteo, no con un fallo
  del contrato de reserva.
- `deadline`: las violaciones concentran en listening (91/93), consistente
  con que production requiere que listening ya se haya servido primero —
  amplifica la cola cuando el conteo diario está saturado.
- `causa`: no es Caso A (reserva perdida/ignorada — descartado, 0 casos), no
  es el Caso D originalmente hipotetizado en 8.9j (contrato agregado ausente
  — corregido en 8.9k, confirmado con `rejectedForAggregateC9=0`). Es una
  variante nueva, no listada explícitamente en el catálogo de causas de
  8.9j: el ledger de admisión (segundos) y el ledger de selección (conteo)
  son independientes y placement, al operar en ráfagas de 8/día, satura el
  segundo sin que el primero lo module.

**No se subió ni bajó `maxConversionsPerSession`** para intentar forzar un
resultado en verde, conforme a la instrucción explícita.

Corregir esto requeriría unificar ambos ledgers (por ejemplo, que
`CapacityForecast` module también un cupo de conteo por sesión, o que
`admitPlacementConversions` consulte `absoluteBaseActivationSafetyCeiling`
antes de reservar) — un cambio que toca la semántica compartida de
activación base (`activation-limits.ts`, `base-activation-allowance.ts`,
`selectBaseDynamically`) usada también por new-word y por pending-base
preexistente. Eso excede el alcance de "aislar y eliminar el Caso D de
placement" de 8.9k y requiere una decisión de spec explícita, tal como prevé
la regla de parada.

## Validación

- `admitPlacementConversions` tests dedicados (heredados + nuevos): **12/12
  verdes** (`capacity-reservations-cohort.test.ts`, Task 8.9k) + 8 verdes
  heredados (`capacity-reservations.test.ts`) + 6 heredados
  (`capacity-reservations-planning.test.ts`).
- Diagnóstico de regla de parada: `placement-c9-stop-rule.test.ts` — 2/2
  verdes (advanced ejerce placement real; mecanismo de admisión correcto,
  violaciones documentadas sin forzar verde).
- Suite completa `lib/essential-words`: **868/876** verdes. Los 8 rojos son
  exactamente el baseline conocido (C6 steady/advanced — reservado 8.10; C9
  steady/intermittent/beginner/advanced — bloqueo de diseño); 2 de los 8
  aparecen solo por contención de recursos al correr toda la suite en
  paralelo y pasan en aislamiento (`mandatory-rollover.test.ts`,
  `multidimensional-feasibility.test.ts` — confirmado, no regresiones).
- 11 adversariales: **verdes** (confirmado en aislamiento).
- `tsc --noEmit`: limpio.
- `eslint .`: 0 errores (8 warnings preexistentes no relacionados).
- `git diff --check`: limpio sobre los archivos de esta tarea.

## C9 por perfil/source (sin cambio de perfiles/knobs, 180d)

| Perfil | new-word violations | placement violations | preexisting | C9 canónico |
|---|---|---|---|---|
| steady | 12 | — | 0 | rojo (sin cambio, fuera de alcance) |
| intermittent | 7 | — | 0 | rojo (sin cambio, fuera de alcance) |
| bursty | 0 | — | 0 | **verde** |
| beginner | 0 (+8 nunca servidas) | — | 0 | rojo (sin cambio, fuera de alcance) |
| advanced | 0 | **93 (sin cambio)** | 0 | rojo — causa reclasificada (ver arriba) |

## C1–C11

Sin cambios respecto a 8.9j: C1–C5, C7, C8, C10, C11 verdes; C6 rojo
(steady/advanced, reservado 8.10); C9 rojo (steady/intermittent/beginner/
advanced, causas documentadas arriba y en el reporte de 8.9j).

## Confirmación

**8.10 no se inició.** No se modificaron C1–C11, la semántica C8
capacity-conditioned, la calibración C11, `targetNewWords`, `budget`,
`desiredRetention`, `MaturityPolicy`, costes/latencia, perfiles, ni el
contrato de new-word admission (solo se le pasó explícitamente el mismo
`AdmissionLoadEnvelope` que ya usaba internamente, sin cambiar su lógica).
