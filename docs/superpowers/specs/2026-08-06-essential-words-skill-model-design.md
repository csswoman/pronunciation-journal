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

| Concepto | Qué es | Determinado por | Dónde vive |
|---|---|---|---|
| **Grade** | calidad de una respuesta concreta | acierto, pistas, latencia | `attempt-grade.ts` |
| **Evidencia** | qué habilidad evaluó realmente esa respuesta | **la modalidad** | `deriveEvidence` |
| **Colocación** | con qué estado e intervalo arranca cada habilidad | **el grade**, sobre lo que tuvo evidencia | `derivePlacements` |

Que una habilidad quede en `learning` **no** significa que no hubo evidencia: una
respuesta `Good` de producción sí demostró producción; la política simplemente decide
colocarla ahí. Son dos pasos (§3.2), no una tabla.

---

## 1. Modelo de datos

### 1.1 `EssentialWord` — sin cambios

El JSON en `public/essential-words/`. Sigue siendo la fuente del léxico.

### 1.2 `LearningItem` — nuevo

Una fila por **habilidad** de una palabra. Reemplaza al `SRSData` único como unidad
de programación.

**Tres habilidades base + 0..N usos**, no "cuatro habilidades": `meaning`,
`listening` y `production` existen exactamente una vez por palabra; `usage` es
variable y se instancia bajo demanda (§5).

```ts
type Skill = "meaning" | "listening" | "production" | "usage";

interface LearningItem {
  id: string;              // "c1k:on#meaning" | "c1k:on#usage:depend-on"
  wordId: string;          // "c1k:on"
  skill: Skill;

  contentOrigin: "authored" | "generated" | "journal";
  generatorProvider?: "gemini";

  payload?: UsagePayload;  // solo skill:"usage" (§5)

  schedule: ItemSchedule;  // única fuente de verdad de programación
  lastReview?: string;
  repetitions: number;
  lapses: number;
  suspended: boolean;
}
```

`pronunciation` **no es una `Skill`**: es una modalidad (§1.4), y la evidencia que
produce acredita `production`. `context` se descarta: se solapa con `usage`.

### 1.3 `ItemSchedule` — unión discriminada

`nextReview` sobrecargado (fecha FSRS *y* fecha provisional en el mismo campo) hace
trivial que una query trate un provisional como tarjeta FSRS. Se separan por
construcción:

```ts
type ItemSchedule =
  | { kind: "none" }
  | {
      kind: "provisional";
      dueAt: string;
      source: "direct" | "placement-inference";
      evidenceConfidence: number;
    }
  | {
      kind: "fsrs";
      dueAt: string;
      stability: number;
      difficulty: number;
      state: FsrsCardState;
    };
```

Un ítem en aprendizaje o reaprendizaje **sí tiene estado FSRS real** (`state:
"Learning" | "Relearning"`). Lo que nunca existe es estado FSRS en un ítem
`provisional`.

### 1.4 `SkillStatus` — derivado, no persistido

`SkillStatus` no se almacena como campo independiente: se deriva de `schedule`. Así
no puede divergir.

```ts
type SkillStatus = "unseen" | "learning" | "provisional" | "review";

function deriveSkillStatus(item: LearningItem): SkillStatus {
  if (item.schedule.kind === "none") return "unseen";
  if (item.schedule.kind === "provisional") return "provisional";
  return item.schedule.state === "Review" ? "review" : "learning";
}
```

`relearning` **no** es un estado de dominio: FSRS ya lo distingue, y duplicarlo aquí
crearía dos fuentes de verdad. La razón del aprendizaje también se deriva:

```ts
function getLearningReason(item: LearningItem): "new" | "lapse" | undefined {
  if (deriveSkillStatus(item) !== "learning") return undefined;
  if (item.schedule.kind !== "fsrs") return "new";
  return item.schedule.state === "Relearning" ? "lapse" : "new";
}
```

Si por razones de consulta en Dexie hace falta materializar `SkillStatus` como índice,
es un **campo derivado** y se actualiza atómicamente con `schedule` en la misma
transacción.

### 1.5 `mature` — predicado, nunca estado

`mature` **no se persiste**. Si se almacenara, un cambio de parámetros FSRS o del
umbral dejaría miles de filas mintiendo. Es una función pura sobre el estado FSRS, el
historial y una política versionada:

```ts
interface MaturityPolicy {
  version: string;
  minStabilityDays: number;
  minSuccessfulReviews: number;
  maxRecentLapses: number;
}

function isMature(
  item: LearningItem,
  history: ReviewLog[],
  policy: MaturityPolicy,
): boolean;
```

Solo un ítem con `schedule.kind === "fsrs"` y `state === "Review"` puede ser maduro.
Los umbrales concretos quedan abiertos (§10); el contrato queda cerrado aquí.

### 1.6 Estados y transiciones

**La progresión NO es lineal.** Aristas válidas:

```
unseen ─────────────────► provisional        (verificación directa, §3)
unseen ─────────────────► learning           (aprendizaje normal)
provisional + intento ──► lo que devuelva FSRS
learning ───────────────► review
review + lapse ─────────► learning
```

`mature` no aparece: es un predicado sobre ítems en `review` (§1.5), no un nodo.

**`provisional` se programa FUERA del historial FSRS.** No se crean reviews
sintéticas ni se fabrica `stability`/`difficulty`. El primer intento real sobre un
provisional **crea una tarjeta FSRS nueva, aplica el `Grade` real, y adopta el estado
que FSRS devuelva** — que con `Again` será aprendizaje, no `review`.

**La inferencia de colocación nunca produce un ítem maduro.**

### 1.7 `SkillEvidence` — nunca booleanos sueltos

Colapsar evidencia directa e inferencia estadística a un `boolean` pierde información
necesaria para depurar y recalibrar:

```ts
interface SkillEvidence {
  skill: Skill;
  source: "direct" | "placement-inference" | "journal";
  modality: "recognition" | "production" | "listening" | "pronunciation";
  /** Confianza en que ESTA interacción evaluó ESTA habilidad — no en que la
   *  persona la domine. Directa ≈ 1.0; inferida = confianza de banda. */
  evidenceConfidence: number;
  observedAt: string;
}
```

### 1.8 `AttemptAssessment` — Grade y modalidad viajan juntos

Un `Easy` en reconocimiento no equivale a un `Easy` en producción:

```ts
interface AttemptAssessment {
  grade: Grade;
  modality: "recognition" | "production" | "listening" | "pronunciation";
  correct: boolean;
  latencyMs: number;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
}
```

`AttemptAssessment` **no lleva evidencia**: la evidencia es el resultado de aplicarle
una política (§3.2), no un campo del intento.

### 1.9 `SkillPlacement`

```ts
interface SkillPlacement {
  skill: Skill;
  schedule: ItemSchedule;
  verificationSource: "direct" | "placement-inference";
}
```

### 1.10 `ReviewLog` — práctica ≠ evento SRS

Dentro de una sesión hay intentos iniciales, pistas, rescates, repeticiones,
verificaciones y ejercicios complementarios. **Todos se registran; solo algunos
modifican el calendario.** Alimentar el optimizador FSRS con ejercicios que no eran
recuperaciones programadas corrompería la calibración.

```ts
interface ReviewLog {
  id: string;
  learningItemId: string;
  sessionId: string;
  assessment: AttemptAssessment;
  evidence: SkillEvidence[];
  eventType: "practice" | "verification" | "scheduled-review" | "learning-step";
  affectsSchedule: boolean;
  fsrsLogId?: string;
  occurredAt: string;
}
```

> **Invariante:** todo intento produce telemetría; solo un intento con
> `affectsSchedule: true` puede modificar la programación o alimentar el optimizador.

### 1.11 Persistencia

| Dato | Dónde | Por qué |
|---|---|---|
| `LearningItem` | Dexie ⇄ Supabase vía `lib/sync/` | dato de usuario, debe ir offline |
| `ReviewLog` | Dexie ⇄ Supabase vía `lib/sync/` | idem |
| `usage` generados | Supabase con RLS, cache en Dexie | contenido de sistema |

RLS obligatoria en las tablas nuevas antes de merge.

### 1.12 Migración

Cada `SRSData` con prefijo `c1k:` se convierte en un `LearningItem` de skill
`meaning`, con `schedule: { kind: "fsrs", … }` heredando su estado **tal cual**: no
se pierde progreso ni se reinician intervalos. `listening` y `production` nacen con
`schedule: { kind: "none" }`.

Dos requisitos:

- **Idempotente.** Ejecutarla dos veces no crea duplicados (invariante 19).
- **Conservadora.** Los `SRSData` originales se conservan hasta verificar que la
  sincronización terminó correctamente; no se borran en la misma operación.

---

## 2. Planificador y gating

### 2.1 Orden de la cola

Cinco tramos, en orden estricto:

1. Ítems en `Learning` / `Relearning`
2. Repasos atrasados, ordenados por **menor recuperabilidad primero** (FSRS ya la
   calcula; hoy se ordena por `entry.rank`, que es frecuencia, no urgencia)
3. Repasos que vencen hoy
4. Activaciones de `usage` pendientes (sujetas a §5.3)
5. Palabras nuevas — **solo con el presupuesto que sobre**

Los tramos 4 y 5 desaparecen bajo presión. Es intencional.

### 2.2 Presupuesto

Helper puro nuevo, `lib/essential-words/daily-budget.ts`. Devuelve **tres unidades
distintas**, porque "palabra nueva" e "ítem nuevo" no son lo mismo:

```ts
interface DailyAllowance {
  newWords: number;          // palabras a introducir
  skillActivations: number;  // activaciones de habilidad base (§2.5)
  usageActivations: number;  // activaciones de usage (§5.3)
  mode: "normal" | "recovery";
}

function newWordsAllowed(input: {
  targetNewWords: number;
  overdueCount: number;
  dueTodayCount: number;
  dailyBudgetMinutes: number;
  avgSecondsPerItem: number;
}): DailyAllowance;
```

`targetNewWords` cuenta **palabras**, no ítems. El coste estimado de una palabra
nueva incluye las habilidades que previsiblemente activará (§2.5), no solo su
exposición.

`avgSecondsPerItem` se **mide**, no se adivina: el `ReviewLog` (§1.10) guarda latencia
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

### 2.5 Activación de habilidades base

**Este es el principal origen potencial de acumulación.** Sin política explícita, diez
palabras nuevas producirían treinta ítems programados antes siquiera de que `usage`
entre en juego.

Política:

- Al introducir una palabra se crean sus tres habilidades base con
  `schedule: { kind: "none" }` — existen, pero **no están programadas**.
- **Solo se programa la habilidad efectivamente practicada.** Un ítem pasa de `none`
  a programado cuando la sesión lo ejercita, no cuando la palabra se introduce.
- **Cada activación consume presupuesto** (`skillActivations` en `DailyAllowance`).
- **Máximo una activación nueva persistente por habilidad y sesión.**
- `targetNewWords` cuenta palabras; el coste estimado de una palabra incluye las
  activaciones que previsiblemente disparará.
- En modo recuperación (§2.3): cero activaciones nuevas.

Orden natural de activación: `meaning` al introducir la palabra; `listening` y
`production` cuando la sesión las ejercita o cuando una verificación las acredita
(§3).

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

### 3.2 Dos pasos, no uno

Evidencia y colocación son funciones separadas. Colapsarlas hace que `learning` se
lea erróneamente como "no hubo evidencia":

```ts
function deriveEvidence(assessment: AttemptAssessment): SkillEvidence[];

function derivePlacements(
  evidence: SkillEvidence[],
  assessment: AttemptAssessment,
  currentItems: LearningItem[],
): SkillPlacement[];
```

**Paso 1 — evidencia, determinada por la modalidad**, no por el grade:

| Modalidad | Acredita evidencia de |
|---|---|
| `production` (correcta) | `meaning` + `production` |
| `listening` (correcta) | `meaning` + `listening` |
| `recognition` (correcta) | `meaning` |
| `pronunciation` (correcta) | `production` — **nunca** `listening` por sí sola |

Una respuesta incorrecta no produce evidencia de dominio, pero sí se registra.

**Paso 2 — colocación, determinada por el grade** sobre las habilidades que sí
tuvieron evidencia.

### 3.3 Prueba de producción (español → inglés, escrita)

Evidencia: `meaning` + `production`. **`listening` nunca**, en ninguna fila.

| Grade | `meaning` | `production` | Siguiente paso |
|---|---|---|---|
| `Easy` sin pistas | provisional largo | provisional largo | programar prueba auditiva |
| `Good` | provisional moderado | `learning` (hubo evidencia; la política lo coloca ahí) | práctica de producción |
| `Hard` / con pista sustantiva | provisional corto | `learning` | reforzar producción |
| `Again` | `learning` | `learning` | flujo completo |

### 3.4 Prueba auditiva (audio inglés → significado o transcripción)

Evidencia: `meaning` + `listening`. **`production` nunca**.

| Grade | `meaning` | `listening` |
|---|---|---|
| `Easy` | provisional largo | provisional largo |
| `Good` | provisional moderado | provisional moderado |
| `Hard` | provisional corto | `learning` |
| `Again` | `learning` | `learning` |

Las dos pruebas no tienen que ocurrir en la misma sesión. La auditiva puede
programarse como siguiente habilidad.

### 3.5 Latencia y pistas

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

### 3.6 Intervalos provisionales

| Origen | Rango |
|---|---|
| Verificación directa `Easy` | 14–30 días |
| Verificación directa `Good` | moderado (dentro del rango anterior, extremo bajo) |
| Inferencia de colocación | 7–21 días |

La evidencia directa es más fuerte que "conoce el 85 % de esta banda, probablemente
conoce esta". No reciben la misma colocación.

**La fecha dentro de la ventana se distribuye de forma determinista** —función del
`itemId` y una semilla, no `Math.random()`— para que sea testeable y para repartir
vencimientos en lugar de amontonarlos (invariante 18).

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
- **distribución de vencimientos** — los `schedule.dueAt` se reparten en el tiempo en
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
degradación `provisional → learning` de §1.6), no porque la estimación sea precisa.

---

## 5. Ítems `usage`

### 5.1 Dos tipos, no uno

Encadenar todo uso avanzado detrás de "las tres habilidades maduras" es
artificialmente rígido: el uso en contexto también **fortalece** `meaning` y
`production`, no solo las corona.

| Tipo (`usageKind`) | Se desbloquea con | Ejemplo (`on`) |
|---|---|---|
| `context_usage` | `meaning` con `status === "review"` | `on Monday`, `on the table`, `the TV is on` |
| `advanced_usage` | `meaning` **y** `production` con `isMature() === true` | `depend on`, `on purpose`, `on the verge of` |

Un ítem `provisional` **no** desbloquea `usage`: la evidencia aún no se ha confirmado
con un evento FSRS real.

**Perder la madurez no retira contenido ya activado.** La madurez controla la
*activación de contenido nuevo*, nada más:

- Un lapse posterior de `meaning` o `production` **no elimina ni retira** los `usage`
  ya activos: siguen su propio calendario.
- Mientras la palabra no vuelva a ser madura, **no se activan nuevos**
  `advanced_usage`.

Sin esta regla, un fallo aislado —o un cambio de `MaturityPolicy`— retiraría
contenido ya introducido y volvería la experiencia inestable.

### 5.2 `usage` es un `LearningItem`, no una entidad aparte

Un `usage` **es** un `LearningItem` con `skill: "usage"`; su ciclo de vida y contenido
viven en `payload`. Un solo registro programable, no dos entidades que sincronizar:

```ts
interface UsagePayload {
  usageKind: "context_usage" | "advanced_usage";
  expression: string;        // "depend on"
  sentence: string;
  sentenceIpa?: string;
  acceptedVariants: string[];

  generationStatus: "pending" | "ready" | "failed";
  activationStatus: "inactive" | "active" | "retired";
  generatedAt?: string;
  activatedAt?: string;

  metadata: GeneratedContentMetadata;
}
```

Permite generar varios candidatos sin añadirlos todos a la carga futura: un `usage`
con `activationStatus: "inactive"` nunca entra en la cola (invariante 5).

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

La procedencia vive en `LearningItem.contentOrigin` / `generatorProvider` (§1.2) y no
se duplica aquí. Esto son los datos de **versionado**:

```ts
interface GeneratedContentMetadata {
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
  daily-budget.ts          §2.2, §2.5 — presupuesto, activaciones, recuperación
  skill-item.ts            deriveSkillStatus, getLearningReason, isMature (§1.4, §1.5)
  verification/
    policy.ts              deriveEvidence + derivePlacements (§3.2)
    types.ts               ItemSchedule, AttemptAssessment, SkillEvidence, SkillPlacement
  placement/
    bands.ts               muestreo estratificado + estimación por banda (§4.1)
    policy.ts              confianza → colocación, conversión gradual, control (§4.2, §4.3)
  usage/
    lifecycle.ts           elegibilidad, prefetch, activación, límites (§5)
```

Flujo:

```
attempt-grade.ts        → AttemptAssessment
verification/policy.ts  → deriveEvidence  → SkillEvidence[]
                        → derivePlacements → SkillPlacement[]
session-plan.ts         → qué ítems entran hoy
```

`skill-item.ts` es aparte porque sus tres funciones derivadas las consumen el
planificador, las políticas y las vistas por igual; enterrarlas en `verification/`
las escondería de la mitad de sus llamadores.

Si un archivo supera ~250 líneas se parte **entonces**, con la evidencia delante.

---

## 7. Invariantes verificables

Cada una es un test:

1. Una prueba textual **nunca** acredita `listening`.
2. Una prueba auditiva **nunca** acredita `production`.
3. Una respuesta revelada **nunca** produce `Easy` ni `Good`.
4. Una inferencia de colocación **nunca** produce un ítem maduro.
5. Un ítem generado pero inactivo **nunca** aparece en la cola SRS.
6. Una palabra **no puede** tener dos ítems activos equivalentes.
7. Los ítems `usage` **cuentan** contra el presupuesto diario.
8. Pulsar "Ya la sé" **no expone** la respuesta antes de verificarla.
9. La app funciona **offline** aunque `usage` no esté generado.
10. Un ítem `provisional` **nunca** usa campos reservados al estado FSRS (§1.3).
11. La colocación **no activa** más de `N` provisionales por día (§4.2).
12. Un intento con `affectsSchedule: false` **no modifica** FSRS ni alimenta el
    optimizador (§1.10).
13. Una respuesta correcta de producción **siempre** produce evidencia de
    `production`, aunque su colocación resultante sea `learning` (§3.2).
14. Una palabra nueva **no puede** activar habilidades base sin consumir presupuesto
    (§2.5).
15. Un ítem maduro **puede degradarse** tras un lapse.
16. La modalidad `pronunciation` **solo** puede acreditar `production`, nunca
    `listening` por sí sola (§3.2).
17. Una fecha provisional se distribuye de forma **determinista** y testeable dentro
    de su ventana (§3.6).
18. La misma ejecución de la migración **no crea registros duplicados** (§1.12).
19. `mature` **nunca** se persiste en `LearningItem` (§1.5).
20. Si existe programación FSRS, la razón de aprendizaje se deriva **exclusivamente**
    de `FsrsCardState` (§1.4).
21. Un estado FSRS `Relearning` se presenta **siempre** como `status: "learning"` con
    `reason: "lapse"` (§1.4).
22. Un cambio en `MaturityPolicy` puede cambiar `isMature`, pero **no modifica ni
    reescribe** el historial FSRS (§1.5).
23. Perder la madurez **bloquea** nuevas activaciones de `advanced_usage`, pero **no
    desactiva** los `usage` ya activos (§5.1).

---

## 8. Testing

Vitest, junto a cada módulo o en `__tests__/`. Los helpers de §6 son puros: se testean
sin I/O.

Además de las 23 invariantes: la migración §1.12 (preservación de estado FSRS +
idempotencia), las transiciones del grafo §1.6 (incluidas las degradaciones), y el
gating §2 en sus tres regímenes (normal, presupuesto ajustado, recuperación).

---

## 9. Simulación de carga — requisito de aceptación

**Se ejecuta ANTES de dar el motor por terminado, no después.**

Con 3 habilidades base por palabra, más 0..N `usage`, más provisionales de
colocación, el sistema puede parecer correcto una semana y enterrar al usuario al mes.

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

### 9.3 Qué se mide

Ambigüedad a eliminar antes de escribir los criterios. Se distinguen cuatro
magnitudes:

| Magnitud | Definición |
|---|---|
| **Cola planificada** | lo que el planificador presenta al usuario ese día |
| **Trabajo completado** | lo que el usuario efectivamente hizo |
| **Vencidos** | ítems cuyo `dueAt` cayó ese día |
| **Backlog** | atrasados acumulados |

**Los criterios de gating se evalúan sobre la cola planificada**, porque es lo único
que el planificador controla. El backlog se mide aparte: es consecuencia del
comportamiento del usuario, no del planificador.

Los criterios se expresan en **sesiones activas**, no en días naturales — un día sin
práctica no es un fallo del planificador.

### 9.4 Comprobación de picos sincronizados

La colocación siembra provisionales que vencen a 7–21 días; los `usage` se activan en
cohortes. Se mide explícitamente si esos dos vencimientos **se sincronizan**.

Métrica: proporción de la cola planificada que proviene de (a) provisionales de
colocación y (b) activaciones de `usage`, por ventana móvil de 7 días activos, y
correlación entre ambas series.

### 9.5 Criterios de aprobación

Para **todos** los perfiles, en el horizonte completo:

1. En al menos el **90 % de las sesiones activas**, la cola planificada no supera
   **1.2 ×** el presupuesto diario.
2. El **percentil 95** de minutos planificados no supera **1.5 ×** el presupuesto.
3. El modo recuperación se activa cuando debe y **sale** de él (no queda atrapado).
4. El backlog no crece de forma monótona en el perfil **Constante**.
5. En el perfil **Ráfagas**, tras una ausencia de 14 días el sistema vuelve a régimen
   normal en ≤ 14 **sesiones activas**.
6. Las activaciones nuevas de `usage` no superan el **30 %** de las activaciones
   totales en una **ventana móvil de 7 días activos**, con un denominador mínimo de
   **10 activaciones** antes de aplicar el porcentaje.
7. Las series de (a) provisionales y (b) `usage` de §9.4 **no muestran picos
   coincidentes** que dupliquen la cola planificada respecto a la ventana previa.

Si alguno falla, se ajustan los parámetros (§10) y se vuelve a simular.

> Los criterios 1, 2 y 6 sustituyen a formulaciones anteriores que eran inválidas:
> "ningún día supera 2× la media móvil" se rompe en el perfil Ráfagas (la media se
> contamina con ceros de la ausencia, y el primer día de regreso la viola con el
> planificador sano), y "`usage` ≤ 30 % diario" da 100 % cuando el día tiene un solo
> repaso.

---

## 10. Decisiones abiertas

Dependen de datos que hoy no existen. Se declaran, no se adivinan:

1. **Umbrales de latencia por modalidad** (§3.5) — valores iniciales provisionales,
   recalibrados con `ReviewLog`.
2. **Intervalos provisionales exactos** dentro de los rangos de §3.6.
3. **`avgSecondsPerItem` inicial** (§2.2) — estimación hasta tener medición real.
4. **`N` de activaciones `usage` por sesión** (§5.3), **límite diario de conversión
   inferido → provisional** (§4.2) y **límite de `skillActivations`** (§2.5) — los
   tres se fijan con la simulación de §9.
5. **Umbrales de `MaturityPolicy`** (§1.5) — `minStabilityDays`,
   `minSuccessfulReviews`, `maxRecentLapses`. El contrato está cerrado; los valores
   se calibran con la simulación. Al ser derivada, cambiarlos no requiere migración.

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

- `LearningItem.contentOrigin` (`authored` | `generated` | `journal`) +
  `generatorProvider` — el pipeline escribe filas, no migra esquema. El valor
  `journal` reserva el caso "usé esta palabra escribiendo en el diario" (hoy no hay
  ningún puente entre `lib/journal/` y essential-words).
- `SkillEvidence.source: "journal"` — el mismo gancho en la capa de evidencia: un uso
  correcto en el diario podrá acreditar `production` sin inventar una modalidad nueva.
- Query de estado de habilidades en `lib/essential-words/queries.ts` — legible por
  Coach y ruta teórica sin tocar el motor.
- Tablas `usage` en Supabase con RLS desde el día uno.
- `ReviewLog` — sustrato para el optimizador FSRS y para el Coach.
