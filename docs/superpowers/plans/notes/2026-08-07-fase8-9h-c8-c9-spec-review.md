# Fase 8 — Task 8.9h: formalizar la revisión de spec de C8/C9 y C11

Fecha: 2026-08-07

Estado: **revisión de spec completada. Dos propuestas formalizadas con tests
que demuestran las consecuencias de cada alternativa. Ninguna decisión se
declara aprobada aquí — ver el ADR en
`2026-08-07-fase8-9h-decision-record.md`. DETENER. No se inicia 8.10.**

No se cambió comportamiento de producción: `criteria/index.ts` no exporta la
semántica de C8 propuesta (Parte A), `lib/srs/fsrs-schedule.ts` no fue
tocado (Parte B), `acceptance.test.ts` no fue tocado, C1–C11, `targetNewWords`
(10), presupuesto (900s), `desiredRetention` (0.9), `MaturityPolicy` y los
perfiles no cambiaron.

## Parte A — C8/C9

### 1. Hallazgos de 8.9f/8.9g formalizados (recapitulación, sin cambios)

- `targetNewWords=10` es leído hoy por `newWordLiveness` (`criteria/progress.ts`)
  como una exigencia de **>=60% de share**, es decir **>=6 palabras
  nuevas/sesión admitidas**, en cualquier sesión elegible (`active && normal
  && backlogSeconds < 0.8×budget`) — sin distinguir "había capacidad y no se
  usó" de "el forecast ya probó que 6 era imposible".
- Esa demanda cuesta **>=474s/sesión** bajo `admission-envelope-v1`
  (`buildAdmissionLoadEnvelope`): inmediato 132s (6×22) + activación base
  270s (6×45) + deuda FSRS esperada 72s (6×12) — ver
  `lib/essential-words/admission-envelope.ts` y el desglose de 8.9f §10.
- El headroom del régimen `middle` (maduro/estacionario, no transitorio —
  8.9f §11) es **insuficiente** en los 5 perfiles: 66–205s/sesión disponibles
  contra 474s/sesión requeridos, margen negativo de −269s a −408s.
- **C9 (`baseSkillActivationLiveness`) sí puede mantenerse como garantía
  post-admission**: es un límite por ítem (listening/production deben
  activarse dentro de 8 sesiones desde que el ítem es elegible), ortogonal a
  cuántas palabras se admiten por sesión. No depende de `targetNewWords` ni
  de `capacitySafeNewWords`.

### 2. Propuesta formal evaluada

`10 nuevas` deja de ser una cuota que C8 debe alcanzar aunque el forecast
diga que es imposible, y pasa a ser (a) un **máximo** por sesión (ya
enforced aguas arriba por `configuredNewWordLimit` en `daily-budget.ts`) y
(b) el denominador nominal de un 60% que **solo aplica cuando el forecast ya
demuestra que es alcanzable**.

Semántica propuesta (implementada como spec-candidate, no como reemplazo de
`newWordLiveness`):

```
when capacitySafeNewWords > 0:
    admission debe realizar progreso y no sufrir starvation
when capacitySafeNewWords >= ceil(target * 0.60):
    admittedNewWords >= ceil(target * 0.60)
when capacitySafeNewWords < ceil(target * 0.60):
    no fallar por no admitir trabajo que el forecast demuestra imposible
```

Implementación de referencia:
`lib/essential-words/simulation/criteria/progress-capacity-conditioned.ts`
→ `newWordLivenessCapacityConditioned(days, targetNewWords, starvationLimitSessions=8)`.

- Sesiones elegibles se particionan en tres grupos según
  `day.capacitySafeNewWords` (ya expuesto por el motor, ver
  `admission-control.ts::NewWordAdmissionResult.capacitySafeNewWords` y
  `SimulatedDay.capacitySafeNewWords`):
  - **alta capacidad** (`>= ceil(target*0.6)`): debe cumplir el 60%
    agregado sobre esas sesiones exclusivamente.
  - **baja capacidad** (`0 < capacity < ceil(target*0.6)`): exenta del 60%
    nominal; solo se exige liveness (no starvation).
  - **capacidad cero**: exenta por completo (ni cuenta para el 60% ni para
    starvation — el forecast ya demostró que 0 es lo máximo posible).
- Starvation: mayor racha de sesiones consecutivas con `capacity>0` y
  `newWords===0`; el límite (8 sesiones) se tomó igual al deadline de C9
  para tener un único reloj de "no progreso" en el sistema, documentado, no
  arbitrario por duplicado.

### 3. C9 permanece sin cambios

`baseSkillActivationLiveness` (`criteria/progress.ts`) no se modificó. La
garantía sigue siendo: toda palabra realmente admitida debe activar
listening y production dentro de <=8 sesiones activas desde que el ítem es
elegible.

### 4. Tests de especificación

`lib/essential-words/simulation/__tests__/spec-8.9h-c8-capacity-conditioned.test.ts`
(6 tests, todos en verde):

| Escenario | Resultado |
|---|---|
| capacidad suficiente (>=6) + 0 admitidas | **FAIL** (60% agregado no se cumple) |
| capacidad para 6 + se admiten 6 | **PASS** |
| capacidad legítima solo para 2 + se admiten 2 | **PASS** (no se exige el 60% nominal) |
| capacidad para 2 + se admiten 0 durante 10 sesiones | **FAIL** por starvation (racha 10 > límite 8) |
| capacidad cero sostenida | **PASS** (exenta por completo) |
| C8-nuevo en verde con C9 en rojo simultáneo | demuestra que **ninguno sustituye al otro**: el gate de aceptación debe seguir exigiendo ambos de forma independiente |

### 5. No se cambió acceptance global

`newWordLivenessCapacityConditioned` **no** se exporta desde
`criteria/index.ts` y **no** se usa en `acceptance.test.ts`. Es un
spec-candidate aislado hasta que la Decisión 1 del ADR sea aprobada
explícitamente.

## Parte B — C11

### 1–2. Invariantes mantenidos y experimento aislado

Sin cambios: `desiredRetention=0.90`, C11=`[0.85, 0.95]`,
`recalled = rng < retrievability` (ver `scheduled-review-outcome.ts`, sin
tocar). Sandbox nuevo, aditivo:
`lib/essential-words/simulation/experiments/sub-day-relearning.ts`.

- **Política A (actual)**: `lib/srs/fsrs-schedule.ts::scheduleFsrsReview`
  redondea el intervalo a día entero, mínimo 1 (`Math.max(1, Math.round(...))`).
  No se tocó.
- **Política B (experimental)**: hook `mutateDay` que, tras aplicarse una
  sesión, busca ítems FSRS que acaban de resultar en `state: "Review"` con
  `stability < 1 día` (umbral `SUB_DAY_STABILITY_THRESHOLD_DAYS`) y
  **adelanta** su `dueAt` a un intervalo fraccionario de día (mínimo 1 hora)
  calculado invirtiendo la misma `forgetting_curve` de ts-fsrs para
  `desiredRetention=0.9` — sin redondeo a día entero. Solo muta el mundo
  privado de esa corrida de `runSimulation`; nunca el scheduler compartido.

### 3. Sin cambios globales a fsrs-schedule.ts

Confirmado: `lib/srs/fsrs-schedule.ts` no aparece en el diff de esta tarea.
El sandbox reconstruye los mismos parámetros (`generatorParameters` con el
mismo `request_retention`) y solo **lee** `calculateFsrsRetrievability` del
módulo de producción.

### 4. Grilla de stabilities (0.1 → 2.0)

`buildStabilityGrid([0.1, 0.3, 0.5, 0.8, 1.0, 2.0])`, metodología: para cada
`stability` se invierte la curva de olvido para hallar el intervalo ideal
que llega exactamente a `desiredRetention=0.9`; la política actual redondea
ese intervalo a día entero (mínimo 1), la experimental lo deja fraccionario
(mínimo 1 hora). **Nota metodológica**: a diferencia de la tabla de 8.9g (que
medía el intervalo resultante de aplicar una calificación real sobre una
`stability` previa, es decir post-actualización FSRS), esta grilla mide
directamente el intervalo/retrievability para la `stability` dada como si
fuera el valor ya vigente a programar — ambas muestran el mismo fenómeno
(el redondeo a día entero deprime la retrievability para `stability` baja),
pero los números no son directamente comparables entre sí porque parten de
definiciones distintas de "stability".

| stability | intervalo actual (días) | retrievability actual al due | intervalo experimental (días) | retrievability experimental al due |
|---|---|---|---|---|
| 0.1 | 1 | 0.6928 | 0.100 | 0.9000 |
| 0.3 | 1 | 0.7995 | 0.300 | 0.9000 |
| 0.5 | 1 | 0.8459 | 0.500 | 0.9000 |
| 0.8 | 1 | 0.8840 | 0.800 | 0.9000 |
| 1.0 | 1 | 0.9000 | 1.000 | 0.9000 |
| 2.0 | 2 | 0.9000 | 2.000 | 0.9000 |

Lectura: el redondeo a día entero solo penaliza cuando el intervalo ideal
cae por debajo de 1 día (`stability<~1`); a partir de `stability=1` el
redondeo ya no introduce distorsión en este modelo aislado (coincide con el
umbral elegido para la política experimental).

### 5. Backlog-cero, 5 perfiles: política A vs B

Script: `scripts/essential-words/fase8-9h-c11-sub-day-experiment.mts`
(seed 42, 300 palabras, 180 días, `dailyBudgetSeconds: 200000`).

| Perfil | C11 (A) | C11 (B) | ΔC11 | avg R (A) | avg R (B) | learning/relearning (A→B) | scheduled reviews (A→B) | items reprogramados | días adelantados (total) |
|---|---|---|---|---|---|---|---|---|---|
| beginner | 0.6641 ❌ | 0.6878 ❌ | +0.0237 | 0.6700 | 0.6940 | 31452→32261 (+2.6%) | 35273→40969 (+16.1%) | 30459 | 47503.2 |
| intermittent | 0.7878 ❌ | 0.8164 ❌ | +0.0285 | 0.8018 | 0.8212 | 7126→6064 (−14.9%) | 17002→16702 (−1.8%) | 5690 | 8201.3 |
| bursty | 0.7639 ❌ | 0.7989 ❌ | +0.0351 | 0.7761 | 0.8030 | 5818→5328 (−8.4%) | 11063→12024 (+8.7%) | 4992 | 6972.3 |
| steady | 0.8603 ✅ | 0.8703 ✅ | +0.0100 | 0.8638 | 0.8756 | 4234→4225 (−0.2%) | 15215→15527 (+2.1%) | 2867 | 3946.3 |
| advanced | 0.8841 ✅ | 0.8884 ✅ | +0.0043 | 0.8857 | 0.8870 | 2408→2473 (+2.7%) | 11651→11906 (+2.2%) | 1178 | 1498.4 |

Corrida completa (los 5 perfiles, seed 42, 180 días, corpus 300,
`dailyBudgetSeconds: 200000`). El script tarda ~7-8 min/perfil porque el
hook de instrumentación escanea `world.srsEvents` completo cada sesión —
aceptable para un experimento puntual, no apto para producción sin
optimizar.

Lectura:

- **C11 mejora en los 5 perfiles**, pero **nunca cruza el borde
  [0.85, 0.95]** en el sentido que importa: los 3 perfiles ya rojos
  (beginner, intermittent, bursty) siguen rojos tras la política B — la
  mejora (+0.010 a +0.035) es real pero insuficiente para entrar al rango
  en el perfil más afectado (beginner: 0.664→0.688, sigue a 0.162 del
  borde inferior 0.85). Los 2 perfiles ya verdes (steady, advanced) siguen
  verdes, con mejoras marginales (+0.004 a +0.010).
- **`avgRetrievability` sube en casi exactamente la misma magnitud que C11**
  en los 5 perfiles (diferencia <=0.003) — confirma que el canal es el mismo
  que documentó 8.9g (retrievability), no un atajo artificial.
- **El costo NO es uniforme entre perfiles**: en `beginner` sube el volumen
  de scheduled-reviews (+16.1%) porque muchos ítems que antes esperaban 2+
  días ahora quedan disponibles antes y se sirven (backlog-cero, sin límite
  de presupuesto); en cambio en `intermittent`/`bursty`/`steady` el efecto
  neto en `learning/relearning` es **negativo** (menos re-aprendizaje, no
  más) — items que se re-aprenden antes también re-estabilizan antes y dejan
  de recaer tan seguido. Esto es un resultado no trivial: la política no
  "multiplica sin límite"; en la mayoría de perfiles reduce el trabajo de
  relearning aun aumentando el de scheduled-review.
- **Costo de reprogramación**: 1178–30459 ítems reprogramados según perfil,
  adelantando entre 1498 y 47503 "días-ítem" de espera en agregado — mayor
  cuanto más bajo es el `accuracyByModality` del perfil (más ítems caen bajo
  el umbral de 1 día de `stability`), consistente con 8.9g (73.3% de
  reviews de `beginner` tenían `stability`<1 día vs 8.1% en `advanced`).

### 6. Criterios de descalificación (evaluados sobre los 5 perfiles)

- **¿Multiplica revisiones sin límite?** No. El cambio en scheduled-reviews
  va de −1.8% (intermittent) a +16.1% (beginner); en 3 de 5 perfiles el
  `learning/relearning` **baja**. No hay evidencia de crecimiento
  descontrolado con este umbral (`stability<1 día`).
- **¿Rompe el presupuesto más de lo ya demostrado en 8.9f?** **No evaluado
  bajo presupuesto real** — esta corrida es backlog-cero (900_000s de
  presupuesto, no vinculante) por diseño (aislar el efecto de scheduling del
  efecto de capacidad de sesión, igual que 8.9g). Extrapolar el +16.1% de
  scheduled-reviews de `beginner` a un régimen con presupuesto de 900s
  agravaría la incompatibilidad ya declarada en 8.9f, no la resolvería —
  esto es una razón en contra de adoptar la política sin más trabajo, no una
  confirmación de que la descalifica por sí sola.
- **¿Convierte el sistema en loops de relearning?** No: en 4 de 5 perfiles
  el conteo de `learning-step` (que incluye relearning) es igual o menor
  que el baseline; el único aumento (beginner, +2.6%; advanced, +2.7%) es
  proporcional al aumento de scheduled-reviews, no un loop aislado.
- **¿Altera C11 artificialmente sin que la retrievability mejore?** No, en
  ningún perfil: la mejora de C11 coincide con la mejora de
  `avgRetrievability` (diferencia <=0.003 en los 5 casos).

**Conclusión (Parte B): la política experimental NO se descalifica por
ninguno de los cuatro criterios explícitos, pero tampoco resuelve C11 en el
perfil más afectado (`beginner` sigue en rojo, a 0.162 del borde) y su
costo bajo presupuesto real no está medido.** No puede marcarse como
"solución" con la evidencia disponible — ver Decisión 2 del ADR.

## No se hizo (fuera de alcance de 8.9h)

- 8.10.
- Cambios a C1–C11, `targetNewWords`, presupuesto (900s), `desiredRetention`,
  `MaturityPolicy`, perfiles.
- Cambios a `criteria/index.ts` / `acceptance.test.ts` (el candidato de C8 no
  se wireó al pipeline de aceptación).
- Cambios a `lib/srs/fsrs-schedule.ts` (el sandbox de sub-day vive fuera,
  como hook de simulación).
- Aprobar ninguna de las dos decisiones — ver el ADR.

## Archivos nuevos

- `lib/essential-words/simulation/criteria/progress-capacity-conditioned.ts`
- `lib/essential-words/simulation/__tests__/spec-8.9h-c8-capacity-conditioned.test.ts`
- `lib/essential-words/simulation/experiments/sub-day-relearning.ts`
- `lib/essential-words/simulation/experiments/__tests__/sub-day-relearning.test.ts`
- `scripts/essential-words/fase8-9h-c11-sub-day-experiment.mts`
- `docs/superpowers/plans/notes/2026-08-07-fase8-9h-c8-c9-spec-review.md` (este archivo)
- `docs/superpowers/plans/notes/2026-08-07-fase8-9h-decision-record.md` (ADR, Parte C)
