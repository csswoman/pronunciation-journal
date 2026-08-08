# Fase 8 — C9 `advanced`: decisión de spec (2026-08-08)

> **Registro histórico superado.** La decisión posterior
> [`2026-08-08-c9-product-decision.md`](./2026-08-08-c9-product-decision.md)
> aprobó elegibilidad real más backpressure compartido y dejó C9 verde 5/5.
> Las conclusiones y métricas de este experimento no describen el estado final.

## Encargo

Cerrar el único blocker estructural restante de Fase 8: C9 (`base-skill-activation-liveness`)
en el perfil `advanced` (measured=22 > límite=8), sin introducir ledgers, forecasts, solvers ni
feasibility engines nuevos — solo backpressure simple de placement, si el diagnóstico lo justifica.

## Diagnóstico (§1-6 del encargo)

Simulación `advanced`, 180 días, budget=900s, seed=42, 167 sesiones activas:

1. **Obligaciones creadas/sesión**: `newWords` media=0.31 (p95=2); `placementConversions`
   admitidas media=1.38 (p95=8, tope de `maxConversionsPerSession`).
2. **Base servida/sesión**: media=2.65 (p95=12).
3. **Backlog pendiente** (`pendingBaseCount`): p50=32, p95=103, max=103 — muy por encima del
   límite C9=8.
4. **Saturación mandatory**: 121/167 sesiones (72.5%) con mandatory >80% del budget; mediana=98%.
5. **Placement bajo backlog alto**: ya se autolimita correctamente — bucket backlog 21-40 admite
   0.11/sesión, bucket 41+ admite 0.13/sesión.
6. **Drenado**: 0 eventos de recuperación completa observados en 180 días — el backlog nunca
   vuelve a ≤8 una vez que sube, porque mandatory casi nunca baja de 50% de forma sostenida.

**Mecanismo confirmado** (trazado sesión por sesión, s0-s29): durante s0-s17, mandatory share
sube gradualmente 0%→70% mientras backlog se mantiene bajo (4-12) porque el servicio base
todavía compensa placement admitiendo cerca de su techo (8/sesión). El backlog es una señal
rezagada: no anticipa nada. En s18-20 mandatory cruza 80-97% y el servicio base colapsa a 0-1/
sesión; ya hay ~88 candidatos diferidos y backlog en 20-29. De ahí en adelante placement se
autolimita bien, pero es tarde — sin throughput por ~40 sesiones consecutivas, esa deuda no
puede drenarse dentro del horizonte de 8 sesiones de C9.

## Hipótesis probada y falsificada

**Hipótesis inicial**: placement admite a una tasa superior al throughput sostenible porque su
única señal de backpressure (`backlogFactor`, sobre `pendingBaseBacklogSeconds`) es puramente
reactiva al stock acumulado, nunca a la tendencia de saturación de mandatory — que ya era visible
en s0-17 antes de que el backlog subiera.

**Experimento**: se añadió una segunda señal — "leading" — a `backpressureFactor`, compartida por
`admitPlacementConversions` y `admitNewWords` (test D del encargo): el share de segundos
restantes justo después de mandatory (`remainingAfterMandatory / dailyBudgetSeconds`), sin
ledger ni historial, ya disponible en `daily-budget.ts` en el momento de admitir. Se probó con
tres umbrales:

| Umbral (`LEADING_THROTTLE_AVAILABLE_SHARE`) | C9 advanced measured | Regresiones C6 |
|---|---|---|
| 0.5 (paridad con remainingSeconds ya depleted, señal incorrecta) | 22 (sin cambio real) | steady, beginner, advanced |
| 0.2 (mismo corte que la exención mandatory-saturation de C8/C9) | 22 (sin cambio) | steady, intermittent, beginner, advanced |
| 0.6 (agresivo, corregido para usar `remainingAfterMandatory` correctamente) | 21 | steady, intermittent, bursty, beginner, advanced |

Incluso suprimiendo casi toda la admisión temprana de placement/new-words (umbral 0.6, que
además rompió C6 en los 5 perfiles porque throttlear la entrada de trabajo nuevo reduce el
denominador de `usageActivationShare`), el measured de C9 solo bajó de 22 a 21 — muy lejos del
límite 8.

**Conclusión**: el backpressure de placement/new-word admission **no es la causa**. Tocarlo más
agresivamente solo daña otros perfiles sin acercarse a resolver `advanced`. El experimento fue
revertido en su totalidad (`git checkout` sobre los 4 archivos de producción tocados); el único
cambio que permanece es el comentario documentando esta evidencia en `acceptance.test.ts`.

## Por qué no es backpressure — evidencia independiente

`placement-c9-stop-rule.test.ts` (Task 8.9k §14, preexistente) ya documentaba la causa real:
placement es capacity-safe en segundos (su mecanismo de reserva es correcto — cero reservas
perdidas, cero admisiones "a ciegas"), pero el **techo de conteo diario de activaciones base**
(`absoluteBaseActivationSafetyCeiling`, hoy 24/sesión) que gobierna la SELECCIÓN real
(`selectBaseDynamically`) es independiente del ledger de segundos que usa la ADMISIÓN. Una
ráfaga admitida "segura en segundos" puede seguir sin poder servirse a tiempo si el conteo diario
de slots está saturado por el propio backlog que la ráfaga generó — asimetría entre dos ledgers
distintos (segundos vs. conteo), no una tasa de entrada mal calibrada.

Unir esos dos ledgers, o subir/relajar el techo de conteo, es una decisión de spec nueva que
toca C8/C9/límites — explícitamente fuera de alcance de este encargo y del anterior (8.9k).

## Decisión

**No se resuelve C9 `advanced` en esta tarea.** Se restaura el `it.skip` en
`acceptance.test.ts`, con el comentario actualizado documentando la evidencia de que backpressure
de placement ya no es sospechoso — el cuello de botella es throughput de servicio base bajo
saturación sostenida de mandatory, un límite físico del perfil a 900s de budget, no un defecto de
código corregible sin tocar C8/C9/límites.

No se subió ningún límite, no se relajó ninguna exención, no se introdujo ningún ledger/forecast/
solver nuevo. El único artefacto que permanece en el código es el comentario explicativo en el
test.

## Cierre

- C1-C8, C10, C11: verdes (sin cambio).
- C9: verde en steady/intermittent/bursty/beginner; rojo documentado en `advanced` (measured=22,
  límite=8) — limitación conocida, no defecto.
- C6: reservado para Task 8.10 (sin cambio, rojo en `steady` como ya estaba).
- 11 adversariales: verdes.
- Type-check: limpio.
- No se inició Task 8.10.
