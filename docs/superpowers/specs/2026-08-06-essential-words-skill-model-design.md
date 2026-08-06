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

> **Ninguna habilidad recibe crédito positivo si la interacción no produjo evidencia
> positiva de esa habilidad.**

Un acierto limpio en producción escrita no acredita escucha. La calidad de una
respuesta (`Grade`) y **qué** demuestra esa respuesta (modalidad → observación) son
dimensiones distintas, y colapsarlas es el error que esta spec corrige.

**Un fallo también es evidencia.** No es evidencia de dominio; es evidencia de que la
recuperación no fue exitosa, y es exactamente la información que el planificador
necesita para colocar la habilidad en `learning`. Por eso el modelo registra
**observaciones** con signo (`success` | `failure`), no solo créditos positivos: si
solo se representara el crédito, un `Again` dejaría la lista vacía y la colocación
tendría que reinterpretar la modalidad por su cuenta, volviendo a mezclar
responsabilidades.

Tres conceptos que se mantienen separados en todo el diseño:

| Concepto | Qué es | Determinado por | Dónde vive |
|---|---|---|---|
| **Grade** | calidad de una respuesta concreta | acierto, pistas, latencia | `attempt-grade.ts` |
| **Observación** | qué habilidad evaluó esa respuesta, y con qué signo | **la modalidad** (habilidad) + **el acierto** (signo) | `deriveObservations` |
| **Colocación** | con qué estado e intervalo arranca cada habilidad | **el grade**, sobre lo observado | `derivePlacements` |

Que una habilidad quede en `learning` **no** significa que no hubo observación: una
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

`pronunciation` **no es una `Skill`**: es una `AttemptModality` (§1.7), y lo que
observa acredita `production`. `context` se descarta: se solapa con `usage`.

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
  /** Ventana de "recent": las últimas N revisiones con `affectsSchedule: true`. */
  recentReviewWindow: number;
}

function isMature(
  item: LearningItem,
  history: SrsReviewEvent[],
  policy: MaturityPolicy,
): boolean;
```

`maxRecentLapses` no significa nada sin definir "recent". Se define en **número de
revisiones**, no en días: esta app tiene perfiles intermitentes y de ráfagas (§9.2), y
una ventana temporal deja a un usuario que estuvo dos semanas ausente con un historial
reciente vacío, declarando maduro cualquier ítem por omisión de datos. Una ventana de
N revisiones se comporta igual con práctica diaria que con práctica esporádica.

**Solo cuentan los eventos con `affectsSchedule: true`.** Los pasos de práctica intra-
sesión no producen un evento SRS; incluir intentos sin evento inflaría tanto
`minSuccessfulReviews` como la ventana de lapses.

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

### 1.7 `SkillObservation` — con signo, nunca booleanos sueltos

Colapsar evidencia directa e inferencia estadística a un `boolean` pierde información
necesaria para depurar y recalibrar. Y representar **solo** el crédito positivo deja
a `derivePlacements` sin contrato en un `Again` (§ principio rector). La unidad es
por tanto una observación con signo y con una base tipada:

```ts
interface SkillObservation {
  skill: Skill;
  outcome: "success" | "failure";
  source: "direct" | "placement-inference" | "journal";
  basis:
    | { kind: "attempt"; modality: AttemptModality }
    | { kind: "band-inference"; bandId: string; policyVersion: string };
  /** Confianza en que ESTA observación evaluó ESTA habilidad — no en que la
   *  persona la domine. Directa ≈ 1.0; inferida = confianza de banda. */
  evidenceConfidence: number;
  observedAt: string;
}

type AttemptModality = "recognition" | "production" | "listening" | "pronunciation";
```

`basis` es una unión, no un `modality` obligatorio: una inferencia de banda **no fue
evaluada** por reconocimiento, producción ni escucha, y obligarla a declarar una
modalidad sería inventarle una procedencia que no tuvo. `AttemptModality` se extrae
como tipo con nombre porque lo consumen `AttemptAssessment` (§1.8), la estimación de
coste (§2.2) y los umbrales de latencia (§3.5).

### 1.8 `AttemptAssessment` — Grade y modalidad viajan juntos

Un `Easy` en reconocimiento no equivale a un `Easy` en producción:

```ts
interface AttemptAssessment {
  grade: Grade;
  modality: AttemptModality;
  correct: boolean;
  latencyMs: number;
  /** Tiempo total de la interacción: audio, lectura, respuesta y transición.
   *  `latencyMs` mide solo la respuesta y subestima el coste real (§2.2). */
  interactionDurationMs: number;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
}
```

`AttemptAssessment` **no lleva observaciones**: la observación es el resultado de
aplicarle una política (§3.2), no un campo del intento.

`interactionDurationMs` existe porque el presupuesto (§2.2) se calibra con el tiempo
que la sesión consume de verdad. `latencyMs` no incluye reproducción de audio,
lectura del enunciado, transiciones ni el hueco entre ejercicios; usarlo para estimar
duración subestima sistemáticamente toda modalidad con audio.

### 1.9 `SkillPlacement`

```ts
interface SkillPlacement {
  skill: Skill;
  schedule: ItemSchedule;
  verificationSource: "direct" | "placement-inference";
}
```

### 1.9b `PlacementInference` — la inferencia de banda necesita dónde vivir

La colocación por bandas (§4) produce una estimación que **no es una programación**:
la palabra queda inferida y todavía sin activar. No cabe en `ItemSchedule` (no hay
fecha) ni en `SkillStatus` (que es derivado y no se persiste), así que es un campo
propio de `LearningItem`:

```ts
interface PlacementInference {
  bandId: string;
  confidence: number;
  inferredAt: string;
  policyVersion: string;
}

interface LearningItem {
  // …
  placementInference?: PlacementInference;
}
```

Invariantes (24–26 en §7):

- `placementInference` solo puede existir en habilidades base, nunca en `usage`.
- Un ítem inferido y no activado conserva `schedule.kind === "none"`.
- Al confirmarse con evidencia directa, la inferencia **se conserva como telemetría**
  —sirve para recalibrar bandas (§4.3)— pero deja de determinar la programación.

### 1.10 `AttemptLog` y `SrsReviewEvent` — intento pedagógico ≠ efectos SRS

Una interacción puede evaluar varias habilidades: una producción escrita, por
ejemplo, observa `meaning` y `production`. Persistir un único registro singular con el
primer `learningItemId` pierde el segundo calendario y hace imposible reconstruirlo.
Por ello hay dos hechos inmutables relacionados, no uno:

```ts
interface AttemptLog {
  id: string;
  sessionId: string;
  assessment: AttemptAssessment;
  observations: SkillObservation[];
  eventType: "practice" | "verification" | "scheduled-review" | "learning-step";
  occurredAt: string;
}

interface SrsReviewEvent {
  id: string;
  attemptLogId: string;
  learningItemId: string;
  /** Siempre true: la ausencia de evento representa un intento sin efecto FSRS. */
  affectsSchedule: true;
  grade: Grade;
  occurredAt: string;
  /** Snapshot inmutable para reconstrucción/auditoría sin volver a inferir. */
  assessment: AttemptAssessment;
  fsrsLogId: string;
  priorSchedule?: ItemSchedule;
  resultingSchedule: ItemSchedule;
}
```

Todo intento crea **un** `AttemptLog`; crea cero o más `SrsReviewEvent`, uno por cada
`LearningItem` cuyo calendario cambie. Un intento de práctica tiene cero eventos y no
puede tocar FSRS. Uno que acredita dos habilidades tiene dos eventos, cada uno ligado
al mismo `attemptLogId` y a un `learningItemId` distinto. Las actualizaciones de
`LearningItem`, el `AttemptLog`, sus eventos y sus entradas de outbox se escriben en
**una única transacción Dexie**. Así se conservan a la vez la interacción original,
la telemetría de intentos sin SRS y la reconstrucción independiente por ítem.

> **Invariante:** solamente un `SrsReviewEvent` con `affectsSchedule: true` puede
> modificar programación o alimentar FSRS; no puede existir sin su `AttemptLog`.

### 1.11 Persistencia

| Dato | Dónde | Por qué |
|---|---|---|
| `LearningItem` | Dexie ⇄ Supabase vía `lib/sync/` | dato de usuario, debe ir offline |
| `AttemptLog` | Dexie ⇄ Supabase vía `lib/sync/` | telemetría pedagógica inmutable |
| `SrsReviewEvent` | Dexie ⇄ Supabase vía `lib/sync/` | reconstrucción y calendario por ítem |
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

**Seis** tramos, en orden estricto:

1. Ítems en `Learning` / `Relearning`
2. Provisionales vencidos y repasos atrasados, ordenados por **menor recuperabilidad
   primero** (FSRS ya la calcula; hoy se ordena por `entry.rank`, que es frecuencia,
   no urgencia). Los provisionales no tienen recuperabilidad FSRS: se ordenan por
   antigüedad de vencimiento.
3. Repasos que vencen hoy
4. **Activaciones de habilidades base pendientes** (sujetas a §2.5)
5. Activaciones de `usage` pendientes (sujetas a §5.3)
6. Palabras nuevas — **solo con el presupuesto que sobre**

El tramo 4 faltaba: la cola tenía dónde colocar `usage` y palabras nuevas, pero no un
`listening` o `production` que ya existe con `schedule: { kind: "none" }` y espera
activación. Sin ese tramo, la política de §2.5 no tiene ejecutor.

Los tramos 4, 5 y 6 desaparecen bajo presión. Es intencional.

### 2.2 Presupuesto

Helper puro nuevo, `lib/essential-words/daily-budget.ts`. Devuelve **tres unidades
distintas**, porque "palabra nueva" e "ítem nuevo" no son lo mismo.

Cuatro contadores y un promedio global no bastan para calcular tres presupuestos
independientes: no dicen cuánto cuesta lo obligatorio, ni qué candidatos hay de cada
categoría, ni cuánto se lleva consumido en la sesión. La entrada es un objeto
estructurado:

```ts
interface DailyPlanningInput {
  dailyBudgetSeconds: number;

  /** No negociable: se planifica siempre y consume presupuesto antes que nada. */
  mandatory: {
    learning: PlannedItem[];
    overdue: PlannedItem[];
    dueToday: PlannedItem[];
    provisionalDue: PlannedItem[];
  };

  /** Negociable: entra solo con el presupuesto que sobre, por tramos (§2.1). */
  candidates: {
    baseSkillActivations: ActivationCandidate[];
    usageActivations: ActivationCandidate[];
    newWords: NewWordCandidate[];
  };

  estimatedSeconds: {
    byModality: Record<AttemptModality, number>;
    newWordIntroduction: number;
  };

  /** Ya gastado en esta sesión: el helper es idempotente al recalcularse. */
  consumed: {
    baseSkillActivations: number;
    usageActivations: number;
    newWordMeaningActivations: number;
  };
}

interface DailyAllowance {
  newWords: number;                 // palabras a introducir
  /** Solo candidatos base ya existentes; EXCLUYE meaning de una palabra nueva. */
  baseSkillActivations: number;
  usageActivations: number;
  /** Derivado: una por cada palabra nueva; se expone para telemetría, no para cortar candidatos. */
  newWordMeaningActivations: number;
  /** Derivado: base + usage + newWordMeaning. Nunca limita el tramo base. */
  totalSkillActivations: number;
  plannedSeconds: number;            // coste estimado de la cola presentada
  mode: "normal" | "recovery";
}

function planDailyAllowance(input: DailyPlanningInput): DailyAllowance;
```

`plannedSeconds` es lo que §9.5 mide contra el presupuesto: sin devolverlo, el
criterio de aceptación tendría que recalcularlo por fuera con otra fórmula.

`targetNewWords` desaparece como escalar suelto: son `candidates.newWords`, y su coste
incluye las activaciones que previsiblemente disparará (§2.5), no solo la exposición.

**El coste se estima por modalidad, no con un promedio global.** Una dictación con
audio y una elección múltiple no duran lo mismo, y un usuario que practica sobre todo
audio vería su sesión desbordarse sistemáticamente con un promedio único.
`estimatedSeconds` se **mide**: el `AttemptLog` guarda `interactionDurationMs` (§1.8),
que sí incluye audio, lectura y transiciones. Arranca con estimaciones declaradas como
provisionales (§10) y se reemplaza por los promedios del usuario por modalidad en
cuanto haya datos suficientes.

Tres reglas de contabilidad:

- Introducir una palabra consume una `newWordMeaningActivation`; no aumenta
  `baseSkillActivations` ni permite candidatos base adicionales.
- Una verificación que acredita dos habilidades consume dos activaciones en la
  categoría que corresponda,
  aunque provengan de una sola pregunta. Esto importa sobre todo en "Ya conozco esta
  palabra": un `Easy` puede crear dos provisionales y no puede saltarse el
  presupuesto por venir de un único intento.
- El máximo "una activación persistente por habilidad y sesión" se identifica por
  `itemId` (o `${wordId}#${skill}`), **nunca** por `skill`: no convierte todos los
  `listening` de todas las palabras en un cupo global de uno.

**Presupuesto por defecto: 15 minutos**, configurable.

### 2.3 Modo recuperación

El umbral se expresa **en segundos estimados**, no en número de ítems: el presupuesto
es tiempo, y comparar un contador de ítems contra un presupuesto en minutos mezcla
unidades. Y entrar y salir con el mismo umbral haría oscilar el modo entre sesiones
consecutivas, así que los umbrales son distintos:

```ts
interface RecoveryPolicy {
  enterAtBacklogBudgetRatio: number; // p. ej. 2.0
  exitAtBacklogBudgetRatio: number;  // p. ej. 0.75
}
```

- **Entrar:** `backlogEstimatedSeconds > enterAt × dailyBudgetSeconds`
- **Salir:** `backlogEstimatedSeconds < exitAt × dailyBudgetSeconds`

La banda entre ambos ratios es la histéresis: evita el ciclo entrar/salir/entrar en
días consecutivos.

**`backlogEstimatedSeconds` incluye las tres fuentes**, estimadas con
`estimatedSeconds.byModality` (§2.2):

- repasos FSRS atrasados,
- **provisionales vencidos**,
- pasos de aprendizaje vencidos.

Las tres compiten por el mismo tiempo diario; excluir alguna daría un backlog que
subestima la carga real y dejaría al usuario fuera del modo recuperación justo cuando
más lo necesita.

En modo recuperación:

- Cero palabras nuevas
- Cero activaciones de habilidad base (§2.5) y cero de `usage` (§5.3)
- Sesión acotada
- Priorización por recuperabilidad ascendente
- **Se comunica explícitamente en pantalla** — no se adivina
- Se conservan fechas e historial; no se marca nada como estudiado ni se reinician
  tarjetas

"Obligatorio" no significa "presentar sin límite". El planificador devuelve
`mandatorySelected` y `deferredMandatory`: selecciona por tramo, urgencia y un límite
explícito de recuperación; el resto queda en backlog sin reprogramarse. Por tanto,
incluso con varias horas vencidas la cola presentada queda acotada y medible.

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
- **Cada activación consume presupuesto** (`baseSkillActivations`,
  `usageActivations` o `newWordMeaningActivations` en `DailyAllowance`),
  incluidas las que nacen de una verificación (§2.2, invariantes 27–28).
- **Máximo una activación nueva persistente por habilidad y sesión.**
- Las activaciones pendientes ocupan el **tramo 4** de la cola (§2.1): existen como
  ítems con `schedule: { kind: "none" }` y esperan turno como cualquier otro candidato.
- `candidates.newWords` cuenta palabras; el coste estimado de una palabra incluye las
  activaciones que previsiblemente disparará.
- En modo recuperación (§2.3): cero activaciones nuevas.

### 2.6 Contexto de ejecución reproducible

Las políticas puras y simulables no consultan el reloj ni generan UUIDs por su
cuenta. Reciben un contexto explícito:

```ts
interface ExecutionContext {
  now: Date;
  newId(): string;
}
```

`deriveObservations`, `derivePlacements`, `planInferences`, conversión gradual,
intervalos provisionales, el planificador y la simulación reciben `now`/`context`.
`new Date()`, `Date.now()`, `crypto.randomUUID()` y `Math.random()` quedan en
adaptadores de UI/I/O. La simulación inyecta reloj, secuencia de IDs y PRNG semillado,
por lo que la misma semilla produce el mismo resultado.

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

Observación y colocación son funciones separadas. Colapsarlas hace que `learning` se
lea erróneamente como "no hubo evidencia":

```ts
function deriveObservations(
  assessment: AttemptAssessment,
  now: Date,
): SkillObservation[];

function derivePlacements(
  observations: SkillObservation[],
  assessment: AttemptAssessment,
  currentItems: LearningItem[],
  now: Date,
): SkillPlacement[];
```

Ambas reciben el reloj en vez de llamar a `new Date()` por dentro: la simulación
de carga (§9) inyecta su propio reloj, y una función que consulta la hora del
sistema no es simulable ni testeable de forma determinista.

**Paso 1 — qué habilidades evaluó el intento: lo decide la modalidad.
Con qué signo: lo decide el acierto.**

| Modalidad | Habilidades observadas |
|---|---|
| `production` | `meaning` + `production` |
| `listening` | `meaning` + `listening` |
| `recognition` | `meaning` |
| `pronunciation` | `production` — **nunca** `listening` por sí sola |

La tabla no cambia según el resultado: una producción **incorrecta** observa las
mismas dos habilidades que una correcta, con `outcome: "failure"`. Lo que nunca
aparece es una habilidad que la modalidad no evaluó — una producción fallida no
observa `listening` en ningún caso.

Ejemplo, producción:

```
correcta   → { meaning: success }, { production: success }
incorrecta → { meaning: failure }, { production: failure }
en ambos   → ninguna observación de listening
```

**Paso 2 — colocación, determinada por el grade** sobre las habilidades observadas.
Con la lista siempre poblada, `derivePlacements` no necesita mirar
`assessment.modality` para saber a quién colocar en `learning` tras un `Again`:
coloca exactamente lo observado. Es lo que cierra la fuga de responsabilidad.

### 3.3 Prueba de producción (español → inglés, escrita)

Observa `meaning` + `production`. **`listening` nunca**, en ninguna fila.

| Grade | `meaning` | `production` | Siguiente paso |
|---|---|---|---|
| `Easy` sin pistas | provisional largo | provisional largo | programar prueba auditiva |
| `Good` | provisional moderado | `learning` (hubo evidencia; la política lo coloca ahí) | práctica de producción |
| `Hard` / con pista sustantiva | provisional corto | `learning` | reforzar producción |
| `Again` | `learning` | `learning` | flujo completo |

### 3.4 Prueba auditiva (audio inglés → significado o transcripción)

Observa `meaning` + `listening`. **`production` nunca**.

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
- `AttemptLog` guarda latencia cruda para recalibrar por tipo de ejercicio con datos
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
se marcan como **inferidas**, no como provisionales activas. La marca es
`placementInference` (§1.9b), con `schedule` intacto:

```ts
{
  schedule: { kind: "none" },          // sigue sin programar → status derivado: "unseen"
  placementInference: { bandId, confidence, inferredAt, policyVersion },
}
```

`status` no aparece en el registro: es derivado (§1.4) y se calcula al leer.

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
  generatedAt?: string;
  activatedAt?: string;
  retiredAt?: string;

  metadata: GeneratedContentMetadata;
}
```

**No hay `activationStatus`.** Un enum de activación junto a `schedule` crearía
exactamente el problema que §1.4 resolvió para `SkillStatus`: dos fuentes de verdad
que pueden contradecirse (`"inactive"` con `schedule.kind === "fsrs"`, o `"active"`
con `kind: "none"`) sin que nada diga cuál manda. Se deriva, como todo lo demás:

```ts
function deriveUsageLifecycle(
  item: LearningItem,
): "inactive" | "active" | "retired" {
  if (item.payload?.retiredAt) return "retired";
  return item.schedule.kind === "none" ? "inactive" : "active";
}
```

`activatedAt` y `retiredAt` se conservan porque son **hechos con fecha**, no estado
duplicado: dicen *cuándo* ocurrió la transición, algo que `schedule` no registra.

Esto permite generar varios candidatos sin añadirlos todos a la carga futura: un
`usage` inactivo tiene `schedule.kind === "none"` y por tanto no puede entrar en la
cola —ninguna query de vencimientos lo alcanza— sin necesidad de un filtro extra
(invariante 5).

`deriveUsageLifecycle` vive en `skill-item.ts`, junto a las demás funciones derivadas.

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
  daily-budget.ts          §2.2, §2.3, §2.5 — presupuesto, activaciones, recuperación
  skill-item.ts            deriveSkillStatus, getLearningReason, isMature,
                           deriveUsageLifecycle (§1.4, §1.5, §5.2)
  verification/
    policy.ts              deriveObservations + derivePlacements (§3.2)
    types.ts               ItemSchedule, AttemptAssessment, AttemptModality,
                           SkillObservation, SkillPlacement, PlacementInference
    latency.ts             calibración de umbrales por modalidad (§3.5, §10)
  record-attempt.ts        transacción AttemptLog + SrsReviewEvent + LearningItem
  placement/
    bands.ts               muestreo estratificado + estimación por banda (§4.1)
    policy.ts              confianza → colocación, conversión gradual, control (§4.2, §4.3)
  usage/
    lifecycle.ts           elegibilidad, prefetch, activación, límites (§5)
```

Flujo:

```
attempt-grade.ts        → AttemptAssessment
verification/policy.ts  → deriveObservations → SkillObservation[]
                        → derivePlacements   → SkillPlacement[]
record-attempt.ts        → AttemptLog + 0..N SrsReviewEvent + ítems actualizados
daily-budget.ts         → DailyPlanningInput → DailyAllowance
session-plan.ts         → qué ítems entran hoy
```

`skill-item.ts` es aparte porque sus funciones derivadas las consumen el planificador,
las políticas y las vistas por igual; enterrarlas en `verification/` las escondería de
la mitad de sus llamadores.

Si un archivo supera ~250 líneas se parte **entonces**, con la evidencia delante.

---

## 7. Invariantes verificables

Cada una es un test:

1. Una prueba textual **nunca** acredita `listening`.
2. Una prueba auditiva **nunca** acredita `production`.
3. Una respuesta revelada **nunca** produce `Easy` ni `Good`.
4. Una inferencia de colocación **nunca** produce un ítem maduro.
5. Un ítem generado pero inactivo (`deriveUsageLifecycle === "inactive"`) **nunca**
   aparece en la cola SRS.
6. Una palabra **no puede** tener dos ítems activos equivalentes.
7. Los ítems `usage` **cuentan** contra el presupuesto diario.
8. Pulsar "Ya la sé" **no expone** la respuesta antes de verificarla.
9. La app funciona **offline** aunque `usage` no esté generado.
10. Un ítem `provisional` **nunca** usa campos reservados al estado FSRS (§1.3).
11. La colocación **no activa** más de `N` provisionales por día (§4.2).
12. Un `AttemptLog` sin `SrsReviewEvent` **no modifica** FSRS ni alimenta el
    optimizador (§1.10).
13. Una respuesta correcta de producción **siempre** produce una observación de
    `production` con `outcome: "success"`, aunque su colocación resultante sea
    `learning` (§3.2).
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
24. Un intento fallido produce observaciones con `outcome: "failure"` para **las
    mismas habilidades** que produciría acertando, y **ninguna más** (§3.2).
25. `placementInference` **solo** existe en habilidades base, nunca en `usage`
    (§1.9b).
26. Un ítem con `placementInference` y sin activar conserva `schedule.kind === "none"`
    (§1.9b, §4.2).
27. Introducir una palabra consume exactamente una `newWordMeaningActivation`, sin
    aumentar `baseSkillActivations` (§2.2).
28. Una verificación que acredita dos habilidades produce dos eventos/activaciones
    atribuibles a los ítems afectados (§1.10, §2.2).
29. El modo recuperación **no oscila**: con un backlog entre los ratios de salida y
    entrada, el modo de la sesión anterior se mantiene (§2.3).
30. `isMature` **solo** considera eventos con `affectsSchedule: true` dentro de
    `recentReviewWindow` (§1.5).
31. Un intento que modifica N ítems persiste un `AttemptLog`, N `SrsReviewEvent`, N
    actualizaciones de ítem y sus outbox entries de manera local atómica (§1.10).
32. El límite de activación se aplica por `itemId`, no por `skill` global (§2.2).
33. La cola en recuperación mantiene `mandatorySelected` acotado y deja el resto en
    `deferredMandatory` sin marcarlo como realizado (§2.3).
34. Las funciones puras/simulables reciben reloj e IDs inyectados (§2.6).

---

## 8. Testing

Vitest, junto a cada módulo o en `__tests__/`. Los helpers de §6 son puros: se testean
sin I/O.

Además de las 34 invariantes: la migración §1.12 (preservación de estado FSRS +
idempotencia), las transiciones del grafo §1.6 (incluidas las degradaciones), el
registro atómico §1.10, y el gating §2 en sus tres regímenes (normal, presupuesto
ajustado, recuperación).

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

### 9.2b Estado y ciclo que se simulan

La simulación no puede representar campos decorativos siempre vacíos. Mantiene estado
por palabra e ítem: `meaning`, `listening`, `production` y `usage` activos/inactivos;
`ItemSchedule`; `PlacementInference`; backlog; fechas de vencimiento; resultados de
intento; activaciones consumidas; y modo normal/recuperación. Usa las políticas reales
o un adaptador fiel con los mismos contratos, no una cuota paralela simplificada.

En cada día activo ejecuta, en este orden:

1. actualizar vencimientos y backlog;
2. construir obligatorios;
3. construir candidatos de habilidades base;
4. construir candidatos de `usage`;
5. convertir inferencias gradualmente;
6. calcular `DailyAllowance`;
7. construir cola (incluidos `mandatorySelected`/`deferredMandatory`);
8. simular lo que el perfil completa;
9. aplicar resultados, escribir eventos y reprogramar cada ítem; y
10. registrar métricas del día.

La simulación debe producir, en perfiles donde sean elegibles, valores no triviales de
`baseSkillActivations`, conversiones/provisionales vencidos y `usageActivations`.
Una ejecución que mantiene cualquiera de esas series siempre en cero es inválida y
falla antes de evaluar los once criterios.

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

**Definición operativa de pico**, para que la comprobación sea automatizable y no
quede a interpretación:

> Una ventana es un **pico** de una serie si su volumen supera **1.5 ×** la mediana de
> las **cuatro ventanas anteriores** de esa serie.

Las cuatro ventanas previas se toman como mediana, no como media, para que un pico
aislado no eleve la referencia y enmascare al siguiente.

### 9.5 Criterios de aprobación

Para **todos** los perfiles, en el horizonte completo:

1. En al menos el **90 % de las sesiones activas**, la cola planificada no supera
   **1.2 ×** el presupuesto diario.
2. El **percentil 95** de minutos planificados no supera **1.5 ×** el presupuesto.
3. El modo recuperación se activa cuando debe y **sale** de él (no queda atrapado).
4. En el perfil **Constante**, tras un calentamiento de 14 sesiones activas, la
   **pendiente** del backlog (regresión lineal sobre segundos estimados) es **≤ 0**, y
   el backlog final no supera **1 ×** el presupuesto diario.
5. En el perfil **Ráfagas**, tras una ausencia de 14 días el sistema vuelve a régimen
   normal en ≤ 14 **sesiones activas**.
6. Las activaciones nuevas de `usage` no superan el **30 %** de las activaciones
   totales en una **ventana móvil de 7 días activos**, con un denominador mínimo de
   **10 activaciones** antes de aplicar el porcentaje.
7. Las series de (a) provisionales y (b) `usage` de §9.4 **no presentan un pico en la
   misma ventana** cuando además la cola planificada de esa ventana supera **1.5 ×**
   el presupuesto.

Los siete anteriores solo acotan carga: un planificador que devolviera siempre
`{ newWords: 0, baseSkillActivations: 0, usageActivations: 0, newWordMeaningActivations: 0 }`
los cumpliría casi todos.
Los cuatro siguientes son **criterios de progreso y liveness**, e impiden aprobar por
no hacer nada:

8. En el perfil **Constante**, en sesiones sin presión de backlog (`mode: "normal"` y
   `plannedSeconds` < 0.8 × presupuesto), se introduce al menos el **60 %** de las
   palabras nuevas candidatas.
9. Una habilidad base elegible para activación **no permanece sin activar más de 5
   sesiones activas** mientras haya presupuesto disponible en esas sesiones.
10. **No hay starvation permanente**: ningún repaso atrasado con recuperabilidad alta
    queda sin planificar durante más de 7 sesiones activas consecutivas.
11. La retención observada sobre los repasos programados (`affectsSchedule: true`) se
    mantiene dentro del rango objetivo de FSRS (±10 puntos porcentuales del
    `requestRetention` configurado).

Si alguno falla, se ajustan los parámetros (§10) y se vuelve a simular.

Cada criterio tiene una función concreta, tests unitarios de éxito y de motor
defectuoso, y una invocación explícita en `simulation/__tests__/acceptance.test.ts` para
los perfiles que le corresponden. En particular, los criterios 7 (picos), 9
(activaciones base), 10 (starvation) y 11 (retención) nunca son helpers huérfanos.
La prueba adversarial debe fallar si el motor nunca activa `listening`, `production` o
`usage`; siempre devuelve cero palabras nuevas; ignora colocación; cuenta activaciones
dos veces; aplaza atrasados indefinidamente; presenta todo el backlog en recuperación;
sincroniza provisionales; o obtiene retención muy inferior al objetivo.

> Los criterios 1, 2, 4 y 6 sustituyen a formulaciones anteriores que eran inválidas:
> "ningún día supera 2× la media móvil" se rompe en el perfil Ráfagas (la media se
> contamina con ceros de la ausencia, y el primer día de regreso la viola con el
> planificador sano); "`usage` ≤ 30 % diario" da 100 % cuando el día tiene un solo
> repaso; y "el backlog no crece de forma monótona" es demasiado débil, porque una
> serie que baja ocasionalmente puede crecer sin límite a largo plazo — de ahí la
> pendiente y el techo final.

---

## 10. Decisiones abiertas y calibración

Dependen de datos que hoy no existen. Se declaran, no se adivinan:

1. **Umbrales de latencia por modalidad** (§3.5) — valores iniciales provisionales,
   recalibrados con `verification/latency.ts` a partir de intentos autónomos:
   `event.affectsSchedule && event.assessment.correct && !usedHints && !rescued &&`
   `(grade === "Easy" || grade === "Good")`. Se excluyen autocorrecciones,
   variantes aceptadas, intentos cuyo primer intento falló y repeticiones de audio
   gratuitas: son éxito pedagógico válido, pero no muestras limpias de velocidad.
2. **Intervalos provisionales exactos** dentro de los rangos de §3.6.
3. **`estimatedSeconds.byModality` inicial** (§2.2) — estimación por modalidad hasta
   tener medición real de `interactionDurationMs`.
4. **Límite de activaciones base** por sesión y por `itemId` (§2.5).
5. **Límite de activaciones `usage`** por sesión (§5.3).
6. **Límite diario de conversión inferido → provisional** (§4.2).
7. **Umbrales de `MaturityPolicy`** (§1.5) — `minStabilityDays`,
   `minSuccessfulReviews`, `maxRecentLapses`, `recentReviewWindow`. El contrato está
   cerrado; los valores se calibran con la simulación. Al ser derivada, cambiarlos no
   requiere migración.
8. **Ratios de `RecoveryPolicy`** (§2.3) — `enterAtBacklogBudgetRatio` y
   `exitAtBacklogBudgetRatio`. Los valores de partida (2.0 / 0.75) son provisionales;
   la banda entre ambos se ajusta con el criterio 3 de §9.5.

Si se agotan parámetros seguros y un criterio sigue fallando, se detiene el rollout y
se reporta una revisión de diseño; nunca se relaja un criterio para obtener verde.

---

## 11. Integración y rollout bajo feature flag

El flag selecciona una ruta real, no solo habilita migraciones. Apagado, Essential
Words lee y escribe exclusivamente `SRSData`; encendido, lee `LearningItem` y escribe
`AttemptLog` + `SrsReviewEvent` + ítems actualizados en una transacción. La selección
ocurre en el adaptador de sesión/grade antes de construir la cola; nunca se bifurca
dentro de los repositorios, para impedir doble escritura accidental.

El rollout admite `off`, `shadow` y `on`, resueltos por entorno y cohorte estable de
usuario. En `shadow` la ruta vieja decide y persiste; la nueva solo calcula una sombra
sin escribir y registra diferencias agregadas (longitud/coste de cola, ítems debidos,
decisión de activación y errores). En `on` solo la ruta nueva escribe sus tablas; la
vieja permanece intacta y de solo lectura como rollback. Se observa un mínimo de 14
días y 100 sesiones por cohorte, con outbox fallido, discrepancias shadow, errores de
reconstrucción, tamaño de backlog y retención. Se pasa a retirada solo con la
simulación verde, discrepancias explicadas, cero duplicados/doble escritura y métricas
dentro de los límites documentados. Revertir es cambiar a `off`; no borra datos nuevos
ni reprograma ítems.

---

## 12. Fuera de alcance — specs siguientes

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
- `SkillObservation.source: "journal"` — el mismo gancho en la capa de observación: un
  uso correcto en el diario podrá acreditar `production` sin inventar una modalidad
  nueva, y uno incorrecto podrá observarse con `outcome: "failure"`.
- Query de estado de habilidades en `lib/essential-words/queries.ts` — legible por
  Coach y ruta teórica sin tocar el motor.
- Tablas `usage` en Supabase con RLS desde el día uno.
- `AttemptLog` + `SrsReviewEvent` — sustrato para el optimizador FSRS y para el Coach.
