# Essential Words — Modelo de habilidades, verificación por evidencia y gating de repasos

**Fecha:** 2026-08-06
**Estado:** propuesto — pendiente de revisión
**Alcance:** el motor de aprendizaje. Vistas, pipeline de contenido, AI Coach y ruta
teórica quedan fuera (ver §11).

---

## Problema

Essential Words trata cada palabra como **una** unidad de conocimiento con **un**
estado de repaso. `lib/essential-words/grade.ts:85` persiste un único `SRSData` por
`wordId` (`c1k:not`), con una `stability`, una `difficulty` y un `nextReview`.

Eso produce tres fallos observables:

1. **No se puede dominar una palabra a medias.** Si reconoces `not` al leerlo pero no
   al escucharlo, FSRS reprograma la palabra entera. Qué habilidad se practica lo
   decide `selectMode` (`exercise-modes.ts:112`) a partir de `repetitions` —un
   contador global— así que la rotación puede devolverte reconocimiento cuando lo que
   falla es la escucha.

2. **"Ya la sé" es todo o nada.** `deferWordToFinalVerification`
   (`session-plan.ts:216`) difiere la palabra a la ronda final; si la apruebas, queda
   programada por completo. Una usuaria B1 que conoce el significado básico de una
   palabra frecuente pero no sus usos avanzados no tiene forma de expresar eso.

3. **La cola no tiene freno.** `queue.ts:89` calcula
   `quota = newPerDay - introducidasHoy`. Nada mira los repasos atrasados ni el
   tiempo disponible. Con más ítems por palabra (§1) la deuda crece más rápido, y sin
   gating el sistema se entierra solo.

Existe una escalera de dominio, pero vive **solo dentro de la sesión**:
`levelReached` es un campo de `SessionState`, en memoria, que se pierde al terminar.

### Lo que ya está bien y no se toca

- **FSRS real.** `lib/srs/fsrs-schedule.ts` usa `ts-fsrs` con `generatorParameters()`.
- **Los cuatro grados con semántica correcta.** `attempt-grade.ts:51` mapea a
  `Again|Hard|Good|Easy`; un fallo nunca cae en `Hard`.
- **Señal rica por intento.** `AttemptOutcome` ya captura pistas, rescate, typo,
  `firstTryFailed` y latencia. Hoy se colapsa a un número 0–5 y se descarta.
- **La estructura intra-sesión.** Bloques, `levelReached`, ronda final. Es ortogonal
  y sigue igual: orquesta la sesión, solo que sobre ítems de habilidad.

---

## Principio rector

> **Ninguna habilidad recibe crédito si la interacción no produjo evidencia de esa
> habilidad.**

Un acierto limpio en producción escrita no acredita escucha. La calidad de una
respuesta (`Grade`) y **qué** demuestra esa respuesta (modalidad → evidencia) son
dimensiones distintas, y colapsarlas es el error que esta spec corrige.

Tres conceptos que se mantienen separados en todo el diseño:

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Grade** | calidad de una respuesta concreta | `attempt-grade.ts` |
| **Evidencia** | qué habilidad evaluó realmente esa respuesta | `verification/policy.ts` |
| **Colocación** | con qué estado e intervalo arranca cada habilidad | `verification/policy.ts` |

---

## 1. Modelo de datos

### 1.1 `EssentialWord` — sin cambios

El JSON en `public/essential-words/`. Sigue siendo la fuente del léxico.

### 1.2 `LearningItem` — nuevo

Una fila por **habilidad** de una palabra. Reemplaza al `SRSData` único como unidad
de programación.

```ts
type Skill = "meaning" | "listening" | "production" | "usage";

type SkillStatus =
  | "unseen"
  | "learning"
  | "provisional"
  | "review"
  | "mature";

interface LearningItem {
  id: string;              // "c1k:on#meaning" | "c1k:on#usage:depend-on"
  wordId: string;          // "c1k:on"
  skill: Skill;
  status: SkillStatus;
  source: "authored" | "gemini" | "journal";
  payload?: UsagePayload;  // solo skill:"usage"

  // Estado FSRS — solo poblado en status "review" | "mature" (ver §1.5)
  stability?: number;
  difficulty?: number;
  state?: FsrsCardState;
  // Ausente en "unseen": un ítem no visto no está programado.
  // En "provisional" lo calcula verification/policy.ts, no FSRS.
  nextReview?: string;
  lastReview?: string;
  repetitions: number;
  lapses: number;
  suspended: boolean;
}
```

**Cuatro habilidades, no seis.** `pronunciation` se descarta: el flujo hablado ya la
evalúa dentro de `production`. `context` se descarta: se solapa con `usage`. Menos
ítems significa menos carga de repaso, y con el gating de §2 eso importa
directamente.

`meaning` / `listening` / `production` existen para toda palabra: exactamente una de
cada. `usage` es **0..N por palabra**, se instancia bajo demanda (§4), y su `payload`
guarda el uso concreto. De ahí el sufijo en el id.

### 1.3 `SkillEvidence` — nunca booleanos sueltos

Colapsar evidencia directa e inferencia estadística a un `boolean` pierde
información que hace falta para depurar y recalibrar. La evidencia conserva
procedencia:

```ts
interface SkillEvidence {
  skill: Skill;
  source: "direct" | "placement-inference" | "journal";
  modality: "recognition" | "production" | "listening" | "pronunciation";
  confidence: number;      // 0–1. Directa ≈ 1.0; inferida = confianza de banda
  observedAt: string;
}
```

### 1.4 `AttemptAssessment` — Grade y modalidad viajan juntos

Un `Easy` en reconocimiento no equivale a un `Easy` en producción. El resultado de
un intento conserva ambas dimensiones:

```ts
interface AttemptAssessment {
  grade: Grade;
  modality: "recognition" | "production" | "listening" | "pronunciation";
  correct: boolean;
  latencyMs: number;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
  evidence: SkillEvidence[];   // vacío si el intento no acredita nada
}
```

### 1.5 Estados y transiciones

**La progresión NO es lineal.** Es un grafo con estas aristas válidas:

```
unseen ──────────────────────────► provisional     (verificación directa, §3)
unseen ──► learning ──► review ──► mature          (aprendizaje normal)
provisional ──► review                             (primer acierto FSRS real)
provisional ──► learning                           (fallo: se degrada)
review ──► learning                                (lapse)
review ──► mature                                  (madurez sostenida)
```

Dos reglas duras:

- **`provisional` se programa FUERA del historial FSRS.** No se crean reviews
  sintéticas ni se fabrica `stability`/`difficulty` para simular meses de estudio. El
  `nextReview` de un ítem provisional es una fecha calculada por
  `verification/policy.ts`, y los campos FSRS quedan **sin poblar**. La primera
  verificación futura que el ítem supere es su **primer evento FSRS real** y es ahí
  donde nace su estado FSRS.
- **La inferencia de colocación nunca produce `mature`.** Solo verificación directa
  repetida llega ahí.

### 1.6 `ReviewLog` — nuevo

Un evento por intento: ítem, `AttemptAssessment` completo, timestamp. Hoy esta
información se calcula y se tira. Guardarla habilita el optimizador FSRS (ya existe
`fsrs-optimizer-eligibility.ts`), la recalibración de umbrales de latencia (§3.4) y
—más adelante— que el AI Coach lea qué estás trabajando.

### 1.7 Persistencia

| Dato | Dónde | Por qué |
|---|---|---|
| `LearningItem` | Dexie ⇄ Supabase vía `lib/sync/` | dato de usuario, debe ir offline |
| `ReviewLog` | Dexie ⇄ Supabase vía `lib/sync/` | idem |
| `usage` generados | Supabase con RLS, cache en Dexie | contenido de sistema |

RLS obligatoria en las tablas nuevas antes de merge.

### 1.8 Migración

Cada `SRSData` con prefijo `c1k:` se convierte en un `LearningItem` de skill
`meaning`, heredando su estado FSRS **tal cual**: no se pierde progreso ni se
reinician intervalos. `listening` y `production` nacen `unseen`. Migración de un solo
sentido, con test.

---

## 2. Planificador y gating

### 2.1 Orden de la cola

Cinco tramos, en orden estricto:

1. Ítems en `Learning` / `Relearning`
2. Repasos atrasados, ordenados por **menor recuperabilidad primero** (FSRS ya la
   calcula; hoy se ordena por `entry.rank`, que es frecuencia, no urgencia)
3. Repasos que vencen hoy
4. Activaciones de `usage` pendientes (sujetas a §4.4)
5. Palabras nuevas — **solo con el presupuesto que sobre**

Los tramos 4 y 5 desaparecen bajo presión. Es intencional.

### 2.2 Presupuesto

Helper puro nuevo, `lib/essential-words/daily-budget.ts`:

```ts
function newItemsAllowed(input: {
  targetNew: number;
  overdueCount: number;
  dueTodayCount: number;
  dailyBudgetMinutes: number;
  avgSecondsPerItem: number;
}): { allowed: number; mode: "normal" | "recovery" }
```

`avgSecondsPerItem` se **mide**, no se adivina: el `ReviewLog` (§1.6) guarda latencia
real. Arranca con una estimación declarada como provisional y se reemplaza por el
promedio del usuario en cuanto haya datos suficientes.

**Presupuesto por defecto: 15 minutos**, configurable.

### 2.3 Modo recuperación

Si `overdueCount > 2 × carga_diaria_normal`: `mode: "recovery"`.

- Cero palabras nuevas
- Cero activaciones de `usage`
- Sesión acotada
- Priorización por recuperabilidad ascendente
- **Se comunica explícitamente en pantalla** — no se adivina
- Se conservan fechas e historial; no se marca nada como estudiado ni se reinician
  tarjetas

Sale solo al bajar del umbral.

### 2.4 Consecuencia en la UI

Con habilidades separadas, "Hoy te tocan 2 palabras" deja de ser correcto: una
palabra puede aportar tres ítems. La pantalla pasa a hablar de **ítems y minutos**
("14 repasos · unos 8 min"), con las palabras como dato secundario.

Corrige de paso el "unos **1** min" (falta el singular) visible hoy.

---

## 3. Verificación por evidencia

### 3.1 Verificación inmediata, nunca diferida

Hoy `deferWordToFinalVerification` manda la palabra a la ronda final. Eso contamina
el resultado: entre pulsar el botón y la prueba, la palabra puede aparecer en otro
ejercicio, en una lectura, o simplemente seguir fresca en memoria de trabajo.

**La prueba ocurre inmediatamente después de pulsar el botón, antes de mostrar
definición, ejemplo o audio.**

Copy: **"Ya conozco esta palabra"** → **"Compruébalo con una pregunta corta"**. Deja
claro que no se está saltando definitivamente.

### 3.2 Prueba de producción (español → inglés, escrita)

| Resultado | `meaning` | `production` | `listening` | Siguiente paso |
|---|---|---|---|---|
| `Easy` sin pistas | provisional largo | provisional largo | **sin acreditar** | programar prueba auditiva |
| `Good` | provisional moderado | `learning`, entrando por encima del primer peldaño | **sin acreditar** | práctica de producción |
| `Hard` / con pista | provisional corto | aprendizaje normal | **sin acreditar** | reforzar producción |
| `Again` | aprendizaje normal | aprendizaje normal | **sin acreditar** | flujo completo |

### 3.3 Prueba auditiva (audio inglés → significado o transcripción)

| Resultado | `meaning` | `listening` | `production` |
|---|---|---|---|
| `Easy` | provisional largo | provisional largo | **sin acreditar** |
| `Good` | provisional moderado | provisional moderado | **sin acreditar** |
| `Hard` | provisional corto | aprendizaje normal | **sin acreditar** |
| `Again` | aprendizaje normal | aprendizaje normal | **sin acreditar** |

Las dos pruebas no tienen que ocurrir en la misma sesión. La auditiva puede
programarse como siguiente habilidad.

### 3.4 Latencia y pistas

El umbral fijo de 25 s (`LOW_LATENCY_MS`) es frágil: la latencia depende de longitud
de frase, escribir vs. hablar, teclado móvil vs. escritorio, complejidad gramatical y
accesibilidad.

Cambios:

- Umbral **por modalidad**, configurable desde el día uno (no una constante global).
- Valores iniciales explícitos y **marcados como provisionales**.
- `ReviewLog` guarda latencia cruda para recalibrar por tipo de ejercicio con datos
  reales.
- **Las pistas se tipifican.** Repetir el audio no equivale a revelar la primera letra
  ni a eliminar opciones. Solo las pistas "sustantivas" degradan el grade.

Definiciones resultantes:

- `Easy`: correcta, sin pistas sustantivas, sin rescate, latencia razonable **para ese
  tipo de ejercicio**
- `Good`: correcta y autónoma, pero lenta o con autocorrección
- `Hard`: correcta solo tras una pista sustantiva
- `Again`: incorrecta, respuesta revelada, o rescate sustancial

### 3.5 Intervalos provisionales

| Origen | Rango |
|---|---|
| Verificación directa `Easy` | 14–30 días |
| Verificación directa `Good` | moderado (dentro del rango anterior, extremo bajo) |
| Inferencia de colocación | 7–21 días |

La evidencia directa es más fuerte que "conoce el 85 % de esta banda, probablemente
conoce esta". No reciben la misma colocación.

Los valores exactos dentro de estos rangos quedan **abiertos** (§10).

---

## 4. Colocación inicial

### 4.1 Bandas, no frontera

El conocimiento de vocabulario **no es monotónico**: alguien puede conocer términos
técnicos poco frecuentes, cognados avanzados o vocabulario de un dominio concreto y
fallar palabras más frecuentes de otro contexto. Una frontera única sería falsa.

Muestreo estratificado: ~5 palabras × ~6 bandas de frecuencia, estratificando además
por sustantivos, verbos, adjetivos, palabras funcionales, y cognados vs. no cognados.
**Se evitan varias palabras de la misma familia** (`develop` / `developer` /
`development`).

Por banda:

| Aciertos limpios | Confianza | Tratamiento |
|---|---|---|
| 5/5 o 4/5 | alta | fast-track a inferido |
| 3/5 | fronteriza | verificación individual |
| 0–2/5 | baja | aprendizaje normal |

Explicable y testeable, sin modelo estadístico complejo.

### 4.2 Inferido ≠ provisional activo

**La colocación no activa masivamente.** Las palabras de una banda de alta confianza
se marcan como **inferidas**, no como provisionales activas:

```ts
{ status: "unseen", inferred: { band, confidence, inferredAt } }
```

La conversión de inferido → `provisional` activo es **gradual**, con:

- **límite diario** de conversiones
- **distribución de vencimientos** — los `nextReview` se reparten en el tiempo en
  lugar de caer todos juntos a los 7–21 días

Sin esto, la colocación siembra cientos de vencimientos sincronizados: exactamente el
pico que §9 busca detectar.

### 4.3 Muestreo de control

De cada ~20 palabras fast-tracked, 1–2 se verifican en sesiones próximas. Si la tasa
de fallo de una banda es alta, se **reduce su confianza** y se adelantan más
verificaciones. La colocación se recalibra sin provocar una avalancha.

### 4.4 Sesión de colocación

Única, opcional, no bloqueante. Si no se hace, todo funciona como hoy, solo que más
lento.

**Límite declarado:** es inferencia sobre ~30 muestras. Se va a equivocar en algunas
palabras. Es aceptable *porque* existen los mecanismos de corrección (§4.3 y la
degradación `provisional → learning` de §1.5), no porque la estimación sea precisa.

---

## 5. Ítems `usage`

### 5.1 Dos tipos, no uno

Encadenar todo uso avanzado detrás de "las tres habilidades maduras" es
artificialmente rígido: el uso en contexto también **fortalece** `meaning` y
`production`, no solo las corona.

| Tipo | Se desbloquea con | Ejemplo (`on`) |
|---|---|---|
| `context_usage` | `meaning` en `review` o `mature` | `on Monday`, `on the table`, `the TV is on` |
| `advanced_usage` | `meaning` **y** `production` en `mature` | `depend on`, `on purpose`, `on the verge of` |

Los estados son los de §1.5. Un ítem `provisional` **no** desbloquea `usage`: la
evidencia todavía no se ha confirmado con un evento FSRS real.

### 5.2 Generado ≠ disponible ≠ activado

```ts
interface UsageItem {
  generationStatus: "pending" | "ready" | "failed";
  activationStatus: "inactive" | "active" | "retired";
  source: "authored" | "generated";
  generatedAt?: Date;
  activatedAt?: Date;
}
```

Permite generar varios candidatos sin añadirlos todos a la carga futura.

### 5.3 Los `usage` cuentan contra el presupuesto

Sin esto el gating de §2 tiene un agujero: limitas nuevas a 10 y `usage` mete 20 por
la puerta de atrás.

- Máximo **1 ítem nuevo activo por palabra** a la vez
- Máximo **N ítems `usage` nuevos por sesión**
- **Cero activaciones** con deuda alta de repasos (modo recuperación, §2.3)

### 5.4 Offline y prefetch

Generación **anticipada**: se dispara cuando la palabra *se acerca* al umbral, no
cuando llega, y se cachea en Dexie. Si no hay conexión ni caché, el ítem
**simplemente no aparece** esa sesión y la palabra espera. La sesión nunca se rompe.

### 5.5 Versionado, validación y telemetría

```ts
interface GeneratedContentMetadata {
  source: "authored" | "generated";
  generatorVersion?: string;
  promptVersion?: string;
  modelVersion?: string;
  schemaVersion: number;
  reviewed?: boolean;
}
```

Validación antes de activar: que el ejemplo evalúe la acepción correcta; que la
respuesta sea inequívoca; que no haya varias respuestas válidas no contempladas; que
el nivel sea apropiado; que no duplique un ítem existente; que las variantes
aceptadas estén registradas. Una actualización del generador puede invalidar
contenido viejo.

**Motivos de no-aparición, registrados:** `not_generated`, `generation_failed`,
`offline`, `invalid_content`, `daily_capacity_reached`. Sin esta telemetría es
imposible distinguir "funciona correctamente" de "la generación lleva tres semanas
fallando".

Prompts en `lib/ai-prompts.ts`; llamadas por `/api/gemini/*`. Sin excepciones.

---

## 6. Arquitectura de archivos

`session-plan.ts` construye la sesión. **No** decide qué significa pedagógicamente una
respuesta.

```
lib/essential-words/
  session-plan.ts          sin cambios de responsabilidad
  daily-budget.ts          §2.2 — presupuesto y modo recuperación
  verification/
    policy.ts              evidencia + colocación (§1.3, §1.4, §3)
    types.ts               AttemptAssessment, SkillEvidence, SkillPlacement, SkillStatus
  placement/
    bands.ts               muestreo estratificado + estimación por banda (§4.1)
    policy.ts              confianza → colocación, conversión gradual, control (§4.2, §4.3)
  usage/
    lifecycle.ts           elegibilidad, prefetch, activación, límites (§5)
```

Flujo:

```
attempt-grade.ts        → AttemptAssessment
verification/policy.ts  → SkillEvidence[]
                        → SkillPlacement[]
session-plan.ts         → qué ítems entran hoy
```

Si un archivo supera ~250 líneas se parte **entonces**, con la evidencia delante.

---

## 7. Invariantes verificables

Cada una es un test:

1. Una prueba textual **nunca** acredita `listening`.
2. Una prueba auditiva **nunca** acredita `production`.
3. Una respuesta revelada **nunca** produce `Easy` ni `Good`.
4. Una inferencia de colocación **nunca** crea estado `mature`.
5. Un ítem generado pero inactivo **nunca** aparece en la cola SRS.
6. Una palabra **no puede** tener dos ítems activos equivalentes.
7. Los ítems `usage` **cuentan** contra el presupuesto diario.
8. Pulsar "Ya la sé" **no expone** la respuesta antes de verificarla.
9. La app funciona **offline** aunque `usage` no esté generado.
10. Un ítem `provisional` **no tiene** estado FSRS poblado (§1.5).
11. La colocación **no activa** más de `N` provisionales por día (§4.2).

---

## 8. Testing

Vitest, junto a cada módulo o en `__tests__/`. Los helpers de §6 son puros: se testean
sin I/O.

Además de las 11 invariantes: la migración §1.8 (preservación de estado FSRS), las
transiciones del grafo §1.5 (incluidas las degradaciones), y el gating §2 en sus tres
regímenes (normal, presupuesto ajustado, recuperación).

---

## 9. Simulación de carga — requisito de aceptación

**Se ejecuta ANTES de dar el motor por terminado, no después.**

Con 4 habilidades por palabra, más `usage`, más provisionales de colocación, el
sistema puede parecer correcto una semana y enterrar al usuario al mes.

### 9.1 Horizonte

60–90 días simulados, con reloj inyectado.

### 9.2 Perfiles de usuario

| Perfil | Comportamiento |
|---|---|
| **Constante** | practica a diario, precisión ~85 % |
| **Intermitente** | 3–4 días/semana, se salta fines de semana |
| **Ráfagas** | una semana intensa, dos de abandono, retoma |
| **Principiante** | colocación de baja confianza, precisión ~60 % |
| **Avanzada (B1+)** | colocación de alta confianza en bandas bajas, muchos `usage` |

### 9.3 Comprobación específica de picos sincronizados

La colocación siembra provisionales que vencen a 7–21 días; los `usage` se activan en
cohortes. **Se mide explícitamente si esos dos vencimientos se sincronizan.**

Métrica: desviación de la carga diaria respecto a la media móvil de 7 días, y
detección de días cuya carga supera 2× esa media.

### 9.4 Criterios de aprobación

Para **todos** los perfiles, en el horizonte completo:

1. La carga diaria no supera el presupuesto en más del **20 %** en más del **10 %** de
   los días.
2. **Ningún** día supera **2×** la media móvil de 7 días (§9.3).
3. El modo recuperación se activa cuando debe y **sale** de él (no queda atrapado).
4. Los atrasados no crecen de forma monótona en el perfil **Constante**.
5. En el perfil **Ráfagas**, tras una ausencia de 14 días el sistema vuelve a régimen
   normal en ≤ 14 días de práctica.
6. La proporción de ítems `usage` no supera el **30 %** de la carga diaria en ningún
   día.

Si alguno falla, se ajustan los parámetros (§10) y se vuelve a simular.

---

## 10. Decisiones abiertas

Dependen de datos que hoy no existen. Se declaran, no se adivinan:

1. **Umbrales de latencia por modalidad** (§3.4) — valores iniciales provisionales,
   recalibrados con `ReviewLog`.
2. **Intervalos provisionales exactos** dentro de los rangos de §3.5.
3. **`avgSecondsPerItem` inicial** (§2.2) — estimación hasta tener medición real.
4. **`N` de activaciones `usage` por sesión** (§5.3) y **límite diario de conversión
   inferido → provisional** (§4.2) — ambos se fijan con la simulación de §9.

---

## 11. Fuera de alcance — specs siguientes

Todas dependen de que exista el `LearningItem`. Por eso van después, no en paralelo.

| # | Spec | Qué habilita |
|---|---|---|
| 1 | **Vistas de habilidad** | scan navegable de "ya la sé" + detalle por palabra ("qué me falta: pronunciación sí, uso no") |
| 2 | **Pipeline de contenido** | poblar `usage` en Supabase; mezcla manual / Gemini / suscripciones; generación diaria; migración del JSON estático |
| 3 | **AI Coach consciente** | leer qué habilidades están abiertas para sugerir contenido relacionado |
| 4 | **Ruta teórica conectada** | enlazar teoría con las palabras/habilidades en curso |

### Ganchos dejados listos en esta spec

- `LearningItem.source` (`authored` | `gemini` | `journal`) — el pipeline escribe
  filas, no migra esquema. El valor `journal` reserva el caso "usé esta palabra
  escribiendo en el diario" (hoy no hay ningún puente entre `lib/journal/` y
  essential-words).
- Query de estado de habilidades en `lib/essential-words/queries.ts` — legible por
  Coach y ruta teórica sin tocar el motor.
- Tablas `usage` en Supabase con RLS desde el día uno.
- `ReviewLog` — sustrato para el optimizador FSRS y para el Coach.
