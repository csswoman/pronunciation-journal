# Fase 8 — decisión final de producto para C9

Fecha: 2026-08-08

Estado: **IMPLEMENTADA Y VALIDADA.** C9 queda verde en los cinco perfiles y el
gate previo a Task 8.10 queda abierto. Esta implementación no inicia Task 8.10.

## 1. Problema

C9 pretende detectar starvation de habilidades base. El estado actual cuenta
una oportunidad cuando quedan segundos suficientes después de mandatory, pero
no comprueba si la política pedagógica permitía ofrecer esa skill.

Conviene separar cuatro estados que hoy se solapan en la observabilidad:

1. **La obligación existe:** listening/production está pendiente y conserva
   identidad, origen y deadline contractual.
2. **El ítem es elegible:** las reglas pedagógicas permiten convertirlo en
   candidato base en esa sesión.
3. **La sesión tiene segundos:** el residual inmediatamente posterior a
   mandatory cubre el coste estimado de la skill.
4. **El scheduler lo selecciona:** el candidato elegible recibe servicio antes
   que placement, nuevas palabras o usage.

La existencia de una obligación no implica por sí sola elegibilidad. Tampoco
la elegibilidad implica que haya capacidad temporal. C9 debe evaluar el salto
entre (2)+(3) y (4): el scheduler podía servir y no sirvió.

## 2. Evidencia

- La spec vigente define C9 sobre una **habilidad base elegible**: no debe
  permanecer con `schedule.kind === "none"` más de ocho sesiones activas si
  existe presupuesto. La revisión 8.9h lo reafirma como garantía dentro de
  ocho sesiones desde que el ítem es elegible, no desde admission.
- El lifecycle de reservas no pierde obligaciones, no hace silent release y no
  duplica identidades. Fairness tampoco explica el rojo.
- Mandatory conserva prioridad absoluta. El safety ceiling 24 no limitó
  ninguna sesión de acceptance.
- `baseCandidates` bloquea todas las activaciones base mientras un meaning de
  placement siga provisional y su `dueAt` esté en el futuro. Esto preserva la
  verificación de la inferencia antes de activar skills dependientes.
- `observeEligibility`, en cambio, considera listening elegible tan pronto como
  la palabra fue introducida y meaning dejó de estar `none`; no replica el gate
  del provisional. Por eso cuenta oportunidades que el scheduler no podía usar.
- La ventana provisional de inferencia es determinista, versionable y acotada
  a 7–21 días. El caso `sim-0939#listening` acumuló aproximadamente 21
  oportunidades bajo la observabilidad actual mientras estuvo bloqueado por
  esa política.
- Backpressure por backlog/throughput reciente redujo beginner de C9=15 a 3,
  pero dejó C6 rojo. En advanced solo redujo C9 de 28 a 21 porque no podía
  corregir las oportunidades falsas anteriores a la elegibilidad.

## 3. Definición final propuesta de C9

**C9 mide starvation, no edad cronológica de la obligación ni número bruto de
sesiones desde su creación.**

Para cada obligación listening/production:

```ts
serviceOpportunity(item, session) =
  itemIsEligibleForBaseActivation(item, session)
  && session.availableSecondsAfterMandatory >= estimatedCost(item.skill)
```

C9 falla cuando una skill permanece pendiente y sin servicio durante más de
ocho service opportunities. Una sesión sin elegibilidad o sin segundos
suficientes no incrementa ni reinicia el reloj. El servicio, una suspensión o
retiro legítimos, o una transición de dominio que haga inaplicable la
obligación terminan o pausan su aplicabilidad según su propio contrato.

El residual se mide inmediatamente después de mandatory y antes de pending
base, placement, new words y usage. Así, si trabajo de menor prioridad consume
capacidad que pending base podía usar, la oportunidad sí cuenta y C9 detecta el
starvation.

Esta regla es única para todas las fuentes. No existe
`if (source === "placement") startClockLater`. New-word empieza a acumular
oportunidades casi inmediatamente porque sus skills se vuelven elegibles casi
inmediatamente. Placement empieza cuando el gate provisional permite que sus
skills entren realmente en `baseCandidates`.

## 4. Decisión advanced / placement

**RECOMMEND A: condicionar C9 a elegibilidad real.**

No tiene sentido llamar starvation a no servir una skill que la política
prohíbe servir. La opción A restaura la semántica ya escrita en la spec, corrige
la contradicción entre `baseCandidates` y `observeEligibility` y no requiere
una excepción por origen.

### Consecuencias

- **Pedagógicas:** conserva el meaning provisional como verificación de la
  inferencia antes de activar listening/production. Acertar una muestra escrita
  sigue sin asumirse como evidencia auditiva o productiva.
- **Técnicas:** no cambia el planner, la prioridad ni el lifecycle. Cambia la
  fuente de verdad de observabilidad para que use exactamente la misma
  elegibilidad que genera candidatos base.
- **Complejidad:** baja. No requiere forecast, reservas futuras, solver ni una
  segunda economía de capacidad.
- **Efecto esperado:** advanced deja de acumular oportunidades durante la
  ventana en que placement todavía no puede ser servido. C9 seguirá pudiendo
  fallar después del desbloqueo si el scheduler desaprovecha más de ocho
  oportunidades reales.
- **Riesgo:** una implementación duplicada de elegibilidad podría volver a
  divergir. Debe compartirse un predicado/resultado de dominio, no copiarse la
  condición del provisional dentro del criterio.

## 5. Decisión beginner

**Adoptar backpressure simple de backlog/throughput reciente y dejar la
calibración de C6 para Task 8.10.**

Beginner no tiene placement y su C9=15 representa starvation real bajo
capacidad escasa: la skill era elegible, existían oportunidades y el scheduler
no logró drenarla antes de admitir más deuda. La evidencia descarta un bug de
fairness y muestra la cadena esperada: baja accuracy → más
learning/relearning → mandatory alto → throughput base bajo → admission actual
demasiado agresivo para el régimen.

El backpressure probado corrigió el contrato estructural (C9=3) sin cambiar
budget, perfiles, FSRS ni C9. Que C6 pase temporalmente a rojo no invalida esa
corrección: el gate escrito para 8.10 exige C1–C5 y C8–C11 verdes, no C6, y
Task 8.10 existe precisamente para calibrar `MaturityPolicy` y revalidar C6,
C7 y C9. Se acepta esa transición únicamente si la implementación demuestra
que C6 es la única regresión y registra el before/after por perfil.

Esto no autoriza comenzar 8.10 ahora. Primero deben quedar implementados y
verdes C9 eligibility-conditioned y el backpressure de beginner sin reglas por
nombre de perfil.

## 6. Alternativas rechazadas

### B — servir listening/production antes del vencimiento provisional

Rechazada. El gate existe para que una inferencia de meaning obtenida por
muestreo escrito sea verificada antes de activar evidencia auditiva/productiva,
y para evitar que un sibling reescriba prematuramente el provisional. Eliminar
el gate introduciría conocimiento no confirmado, adelantaría carga base y luego
mandatory, y cambiaría el aprendizaje solo para hacer verde una métrica cuya
observabilidad está mal alineada.

### C — anticipar vencimientos y rechazar placement mediante forecast

Rechazada. Exigiría calendario de sesiones hasta `dueAt`, carga mandatory/FSRS
futura, costes por modalidad, reservas atómicas y reconciliación de capacidad.
Eso reconstruye `CapacityForecast`, admission envelopes, rolling ledgers y el
solver recientemente eliminados. No aporta una garantía pedagógica adicional
frente a A: intenta reservar servicio para un ítem que todavía no es elegible.

### Mantener admission actual en beginner

Rechazado. Mantiene starvation real C9=15 pese a que una política simple ya
demostró que el backlog puede acotarse. El conflicto con C6 pertenece a la
calibración posterior, no justifica conservar un fallo estructural conocido.

### Relajar C9 o crear excepciones por perfil/source

Rechazado. El límite sigue siendo ocho oportunidades y no depende de
`profile.id`. La elegibilidad explica la diferencia entre fuentes mediante una
regla general; no hace falta una excepción para placement.

## 7. Salvaguardas contra gaming

1. `eligibleAt` y `itemIsEligibleForBaseActivation` provienen del dominio
   pedagógico que genera candidatos, nunca de admission ni del planner.
2. El criterio y `baseCandidates` consumen la misma decisión de elegibilidad;
   no mantienen implementaciones paralelas.
3. Una vez elegible, una obligación no vuelve a ineligible salvo suspensión,
   retiro o transición de estado legítima y auditable.
4. La ventana provisional de placement permanece acotada y versionada
   (`inference: 7–21 días`). Cambiarla requiere su propia decisión.
5. Debe existir un test/invariante separado de desbloqueo provisional: en la
   primera sesión activa aplicable a partir de `dueAt`, la skill aparece como
   candidata salvo suspensión/retiro o transición válida.
6. C10 continúa detectando starvation de trabajo mandatory vencido. C9 no
   intenta detectar todos los bugs del lifecycle provisional.
7. La capacidad se observa post-mandatory y pre-trabajo residual; el planner no
   puede reducir artificialmente el valor para evitar que una sesión cuente.

## 8. Cambios de código necesarios después de aprobar la ejecución

Cambio pequeño esperado, todavía no implementado:

1. Extraer o exponer una única decisión de elegibilidad base desde el dominio
   usado por `simulation/candidates.ts`.
2. Hacer que `observeEligibility` reciba/consuma esa decisión por item y sesión,
   en vez de inferir elegibilidad solo desde `introducedAt`/schedule.
3. Mantener la medición de segundos post-mandatory y costes por skill actual.
4. Reintroducir el backpressure pequeño de backlog/throughput reciente,
   compartido por new-word y placement, sin profile names ni persistencia
   nueva.
5. Conservar sin cambios fairness, mandatory, FSRS, budget, target, C8, C11 y
   safety ceiling 24.

## 9. Cambios de spec y tests esperados

Después de implementar, no antes:

- Actualizar la spec de C9 con la fórmula exacta de elegibilidad + segundos y
  las salvaguardas anti-gaming.
- Añadir casos donde una obligación existe pero todavía es ineligible: no
  cuenta oportunidades.
- Añadir el caso general de desbloqueo: desde la primera sesión elegible, una
  oportunidad suficiente sí cuenta, sin distinguir source.
- Verificar new-word: elegibilidad inmediata y dos obligaciones reales.
- Verificar placement: gate provisional conservado, desbloqueo acotado y reloj
  C9 iniciado por elegibilidad, no por source.
- Verificar que trabajo residual no puede ocultar una oportunidad.
- Añadir tests del backpressure de backlog bajo/alto, reapertura, startup,
  señal compartida, coste real de obligaciones y determinismo.
- Retirar cualquier skip/comentario de excepción C9 solo cuando los cinco
  perfiles pasen C9 y C1–C5/C7/C8/C10/C11 no regresen.
- Registrar C6 por perfil como deuda explícita para 8.10, sin modificar su
  criterio durante la implementación C9.

## 10. Gate para Task 8.10

**8.10 puede comenzar después de implementar esta decisión: SÍ, condicionado.**

El gate se abre únicamente si:

1. C9 eligibility-conditioned pasa en los cinco perfiles;
2. C1–C5, C7, C8, C10 y C11 permanecen verdes;
3. los adversariales siguen verdes y la dinámica no se vuelve trivial;
4. cualquier rojo adicional queda limitado a C6 y está documentado por perfil;
5. no se introduce lógica por profile name, forecast de ocho sesiones,
   reservation ledger ni feasibility solver.

Con ese resultado, C6 deja de ser un blocker previo y pasa a ser exactamente
el objeto de Task 8.10. Hasta que esos cinco puntos estén demostrados, la
respuesta es NO y 8.10 sigue bloqueada.

## 11. Resultado de implementación

La fuente canónica de elegibilidad quedó en
`simulation/base-eligibility.ts`. `baseCandidates` y la captura pre-planning de
C9 consumen el mismo predicado. La captura ocurre antes de hooks y selección:
admission o el planner no pueden ocultar una oportunidad quitando candidatos.

El backpressure `base-throughput-backpressure-v1` usa las últimas ocho sesiones
activas. Su tasa es base realmente servida por sesión con oportunidad; proyecta
esa tasa al horizonte C9, resta las obligaciones L/P pendientes y entrega el
saldo común primero a placement y después a new words. Cada palabra nueva crea
dos obligaciones; placement consume la cantidad de obligaciones que realmente
crea. Sin historial, la tasa se aproxima con segundos post-mandatory divididos
por el coste medio listening/production. No hay nombres de perfil, forecast,
ledger nuevo, reservations futuras ni solver.

### C9 por perfil (180 días, seed 42, budget 900s)

“Elegibles” cuenta obligaciones que permanecieron pendientes al menos una
sesión elegible en la observabilidad C9; “oportunidades” cuenta sus sesiones
elegibles con segundos suficientes.

| Perfil | Elegibles | Oportunidades | wait p95 | wait max | Violaciones |
| --- | ---: | ---: | ---: | ---: | ---: |
| steady | 44 | 25 | 1 | 2 | 0 |
| intermittent | 31 | 19 | 1 | 3 | 0 |
| bursty | 19 | 0 | 0 | 0 | 0 |
| beginner | 6 | 8 | 1 | 2 | 0 |
| advanced | 76 | 72 | 1 | 3 | 0 |

`beginner` mejora de C9=15 a C9=2. `advanced` mejora de C9=28 a C9=3.
En advanced, 1,824 sesiones-item de listening de 158 obligaciones placement
que la medición anterior habría contado durante provisional quedan ahora
correctamente excluidas. Desde la primera elegibilidad real, wait p95=1 y
wait max=3.

| Perfil | pendingBase p50/p95/max | Throughput reciente medio | New words | Placement | Base servida |
| --- | --- | ---: | ---: | ---: | ---: |
| beginner | 0 / 1 / 9 | 1.29 | 26 | 0 | 52 |
| advanced | 24 / 55 / 62 | 3.41 | 25 | 158 | 365 |

### Gate C1–C11

| Perfil | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| steady | ✅ | ✅ | ✅ | ✅ | — | ❌ 0.500 | ✅ | ✅ | ✅ | ✅ | ✅ |
| intermittent | ✅ | ✅ | ✅ | — | — | ✅ 0.231 | ✅ | ✅ | ✅ | ✅ | ✅ |
| bursty | ✅ | ✅ | ✅ | — | ✅ | ✅ 0.300 | ✅ | ✅ | ✅ | ✅ | ✅ |
| beginner | ✅ | ✅ | ✅ | — | — | ❌ 0.333 | ✅ | ✅ | ✅ | ✅ | ✅ |
| advanced | ✅ | ✅ | ✅ | — | — | ❌ 0.636 | ✅ | ✅ | ✅ | ✅ | ✅ |

C4 se evalúa canónicamente en carga constante (`steady`), C5 en retorno tras
ausencia (`bursty`) y C8 conserva su semántica capacity-conditioned. C6 es el
único criterio rojo y no se modificaron su threshold, usage target,
activation share ni `MaturityPolicy`.

### Validación

- elegibilidad, `baseCandidates`, lifecycle provisional, backpressure,
  admission new-word/placement y C9 dedicados: 48/48;
- acceptance y 11 adversariales: 58/58;
- Essential Words serial: 129 archivos, 886/886 tests;
- `pnpm type-check`: limpio;
- `pnpm lint`: 0 errores, 6 warnings preexistentes fuera del alcance;
- `pnpm build`: exitoso;
- `pnpm test`: 3,058/3,066 pasaron en paralelo; ocho tests de simulación
  excedieron el timeout ambiental de 5s. Los cinco archivos afectados pasaron
  serialmente 37/37 y están incluidos en el 886/886 anterior;
- `git diff --check`: limpio (solo avisos informativos LF→CRLF de Git).

**READY FOR 8.10. NO se inició Task 8.10.**
