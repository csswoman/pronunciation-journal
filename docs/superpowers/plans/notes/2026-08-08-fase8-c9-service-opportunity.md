# Fase 8 — C9 canónico por service opportunity (2026-08-08)

> **Registro histórico superado.** Esta fue la medición intermedia anterior a
> condicionar las oportunidades a elegibilidad pedagógica y reintroducir el
> backpressure aprobado. El resultado final está en
> [`2026-08-08-c9-product-decision.md`](./2026-08-08-c9-product-decision.md):
> C9 verde en los cinco perfiles.

## Encargo

Formalizar C9 como "capacity-conditioned liveness por oportunidades reales de servicio",
reemplazando el umbral de exención 80/20 (mandatory-saturation) por una definición derivada
del recurso real: `serviceOpportunity(candidate, session) = remainingSecondsAfterMandatory >=
estimatedCost(candidate.skill)`.

## Cambio de definición canónica

**Antes** (exención 80/20): una sesión con `sessionAvailableSeconds < dailyBudgetSeconds * 0.2`
quedaba exenta por completo del contador de wait, sin distinguir skill ni coste real; además el
contador usaba pooling acumulativo (`cumulativeAvailableSeconds > 0` una vez alcanzado, nunca
reevaluado por sesión).

**Ahora** (`lib/essential-words/simulation/criteria/progress.ts`): cada sesión se evalúa de forma
independiente y por skill —

```
hasServiceOpportunity(observation) =
  observation.sessionAvailableSeconds >= observation.skillCostSeconds
```

- `sessionAvailableSeconds`: segundos que quedan tras mandatory, medidos en `run-simulation.ts`
  como `dailyBudgetSeconds - estimateItemsSeconds(plan.mandatorySelected, SIMULATION_COSTS)` —
  **antes** de que pending base/placement/new words/usage gasten nada (§6, anti-gaming).
- `skillCostSeconds`: coste real de la modalidad (`listening=20s`, `production=25s` en
  simulación), no un promedio ni una constante compartida (§5).

Una sesión sin datos de oportunidad (fixtures antiguos) se trata como neutral: no cuenta, no
resetea. Una sesión sin oportunidad real tampoco cuenta ni resetea (§1/§2). El reloj se
resetea únicamente cuando el ítem se sirve (`scheduleKind !== "none"`) o deja de ser elegible.

Se eliminó por completo `isMandatorySaturated`/`MANDATORY_SATURATION_AVAILABLE_SHARE` — no
coexisten las dos reglas (§8).

## Mandatory sigue con prioridad absoluta (§3)

Ningún segundo se reserva artificialmente contra mandatory para que C9 pase. `sessionAvailableSeconds`
sigue siendo exactamente `dailyBudgetSeconds - mandatorySelectedSeconds`, sin modificación en
`daily-budget.ts` ni en `run-simulation.ts` más allá de pasar `SIMULATION_COSTS` para calcular
`skillCostSeconds` por observación.

## Pending base sigue delante de placement/new words/usage (§4)

Por diseño, `sessionAvailableSeconds` se mide inmediatamente después de mandatory, antes de que
cualquier trabajo de menor prioridad gaste algo de ese remanente. El criterio no distingue quién
consumió la oportunidad — si placement/new words/usage se comen el tiempo que pending base podría
haber usado, esa sesión sigue contando como oportunidad no aprovechada y el contador de C9 avanza
(test G del nuevo archivo `criteria-c9-service-opportunity.test.ts`).

## Auditoría de `absoluteBaseActivationSafetyCeiling` (§7)

Medido en las 5 simulaciones de aceptación (180 días, 900s, seed=42): **0 sesiones** en los 5
perfiles quedan limitadas por `safety-ceiling` (`dynamicBaseLimitingFactor`). El máximo
`baseSkillActivations` observado es 15/24 (steady/beginner/bursty/intermittent) y 14/24
(advanced) — siempre por debajo del ceiling=24. El limitante real es siempre `time-budget` (o
`no-pending`). Confirma lo ya documentado en `base-activation-allowance.ts` §7e: el ceiling es
guard anti-runaway, nunca la política de throughput habitual. No se cambió su valor. El test
preexistente `base-activation-allowance-limits.test.ts` caso G ("safety ceiling impide runaway
pero no limita caso steady normal") ya cubre esto — no se dupicó.

## Resultado tras la reformulación

| Perfil | C9 antes (exención 80/20) | C9 ahora (service opportunity) |
|---|---|---|
| steady | verde (measured no reportado con precisión, exención activa) | **verde**, measured=3 |
| intermittent | verde | **verde**, measured=4 |
| bursty | verde | **verde**, measured=2 |
| beginner | verde (exención ocultaba el problema) | **rojo**, measured=15 (production), límite=8 |
| advanced | rojo, measured=22 (bajo el criterio viejo) | **rojo**, measured=28 (bajo el criterio nuevo, más estricto) |

`beginner` pasaba antes porque el pooling acumulativo y la exención 80/20 (coarse, sin distinguir
por skill) enmascaraban un déficit real de producción: coste de production=25s cae justo por
encima de la banda de segundos disponibles más frecuente en sesiones con mandatory alto en ese
perfil (92/156 sesiones activas con 0<disponible<25s). `advanced` empeora en cifra (22→28) porque
la nueva definición es más estricta y ya no perdona nada vía pooling — esto es correcto y
esperado, no una regresión.

## Diagnóstico de causa (no se busca más — evidencia ya reunida en sesiones previas)

Con las oportunidades medidas correctamente (sin gaming, verificado por los 9 tests A-I),
`beginner` y `advanced` siguen rojos por la misma causa estructural ya diagnosticada:
mandatory consume >80% del budget en la gran mayoría de sesiones activas (144/156 en beginner,
121/167 en advanced) — un límite físico de recurso a 900s de budget para esos perfiles de
carga/precisión, no un defecto de código. `placement-c9-stop-rule.test.ts` (Task 8.9k §14) ya
documentaba independientemente que el mecanismo de reserva de placement es correcto y que la
asimetría real está entre el ledger de segundos (que gobierna admisión) y el techo de conteo
diario (que gobierna selección) — ninguno de los dos es la causa aquí, confirmado por la
auditoría del §7 anterior (el ceiling nunca es limitante en ninguno de los 5 perfiles).

## Decisión: DETENIDO — C9 no queda verde en los 5 perfiles

Conforme al encargo: *"Si sigue rojo pese a que las oportunidades están medidas correctamente:
DETENER y reportar la causa."* Eso es exactamente lo que ocurre. No se sube el límite (8), no se
reintroduce ninguna exención, no se toca C8/C11/budget/targetNewWords/MaturityPolicy/FSRS/perfiles,
no se abre una Task 8.9x nueva, y **no se inicia Task 8.10** en este commit.

`beginner` y `advanced` quedan con C9 rojo, sin `it.skip` — corren el mismo criterio canónico que
los demás perfiles y su resultado (rojo) es la medición real y correcta, no una limitación oculta
por una exención de test. Es un hallazgo, no una tarea pendiente: a 900s de budget diario, esos
dos perfiles de carga no tienen throughput físico suficiente para servir su backlog de base
dentro de 8 oportunidades reales, dado el coste de modalidad y el volumen de mandatory que su
perfil de precisión/actividad genera.

## Validación (§12)

- Tests C9 dedicados (`criteria-c9-service-opportunity.test.ts`, 9 tests A-I): **verde**.
- Acceptance 5 perfiles: 40/43 verde — steady/C6 (fuera de alcance, reservado a 8.10),
  beginner/C9 y advanced/C9 rojos por causa física documentada arriba.
- Adversariales: **11/11 verde**.
- Simulation completa (`lib/essential-words`): 870/873 verde (mismos 3 casos).
- Type-check: limpio.
- Lint: 0 errores (6 warnings preexistentes, ninguno en archivos tocados).
- Build: exitoso.
- `git diff --check`: sin errores de whitespace (solo aviso LF→CRLF de Git en Windows).
