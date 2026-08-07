# Essential Words — Modelo de habilidades: plan de implementación

**Estado:** ejecución detenida en 8.5 — 62 tareas en 11 fases (Fase 0–10)

**Goal:** Sustituir el modelo “una palabra = una tarjeta SRS” por ítems de habilidad (meaning / listening / production / usage), con evidencia por modalidad, programación FSRS por ítem, presupuesto real y rollout reversible.

**Architecture:** LearningItem es la unidad programable; AttemptLog conserva la interacción pedagógica; cada SrsReviewEvent conserva un efecto FSRS independiente por ítem. Las funciones derivadas no duplican estado. SRSData permanece detrás de off/shadow hasta completar el rollout de la Fase 9.

**Tech Stack:** TypeScript estricto, Dexie v31, Supabase + RLS, ts-fsrs, Vitest, Next.js 16 App Router.

**Spec:** docs/superpowers/specs/2026-08-06-essential-words-skill-model-design.md

## Dependencias entre fases

~~~text
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4
                                      ├─→ Fase 5
                                      ├─→ Fase 6
                                      └─→ Fase 7 → Fase 8 → Fase 9 → Fase 10
~~~

Fase 4 es la dependencia crítica: Fases 5–7 no comienzan antes de que presupuesto y
cola estén verdes. Fase 10 no comienza antes del gate de rollout de Fase 9.

## Convenciones para todas las tareas

- Tests: pnpm test <ruta>; type-check: pnpm type-check; lint: pnpm lint.
- Cada tarea termina en un commit focalizado; no usar git add -A en un worktree mixto.
- Ficheros nuevos ≤250 líneas; si una tarea lo supera, incluye el split.
- Ningún acceso a Supabase fuera de lib/*/queries.ts; sin any salvo justificación.
- Las funciones puras/simulables reciben ExecutionContext o dependencias separadas.
  new Date(), Date.now(), crypto.randomUUID() y Math.random() solo viven en bordes
  de UI/I/O o fixtures de test; nunca dentro de políticas puras.


## Fase 0 — Caracterización del sistema actual

**Objetivo:** poder distinguir una regresión involuntaria de un cambio deliberado. Nada de esta fase cambia comportamiento.

**Condición de salida:** existe una suite que describe el comportamiento actual de grading, cola y sincronización, y que seguirá verde durante las fases 1–2 sin modificarse.

### Task 0.1: Fixtures compartidas de `SRSData`

**Files:**
- Create: `lib/essential-words/__tests__/fixtures/srs-fixtures.ts`

- [ ] **Step 1: Crear las fixtures**

Estas fixtures las consumen las fases 0, 2 y 9 (la migración y su verificación). Son la única definición de "cómo son los datos viejos".

```ts
// lib/essential-words/__tests__/fixtures/srs-fixtures.ts
import type { SRSData } from "@/lib/types";

/** Palabra nunca repasada correctamente: repetitions 0, vence ya. */
export const srsNew = (word = "on"): SRSData => ({
  wordId: `c1k:${word}`,
  word,
  ease: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: "2026-08-06T00:00:00.000Z",
});

/** Palabra con historial SM-2 pero sin campos FSRS (pre-Fase C). */
export const srsLegacySm2 = (word = "the"): SRSData => ({
  wordId: `c1k:${word}`,
  word,
  ease: 2.36,
  interval: 12,
  repetitions: 4,
  nextReview: "2026-08-18T00:00:00.000Z",
  lastReview: "2026-08-06T00:00:00.000Z",
});

/** Palabra ya migrada a FSRS: tiene stability/difficulty/state. */
export const srsFsrs = (word = "not"): SRSData => ({
  wordId: `c1k:${word}`,
  word,
  ease: 2.5,
  interval: 21,
  repetitions: 6,
  nextReview: "2026-08-27T00:00:00.000Z",
  lastReview: "2026-08-06T00:00:00.000Z",
  stability: 21.4,
  difficulty: 5.2,
  state: "Review",
  fsrsRealReviews: 3,
});

/** Conjunto que cubre los tres casos de la migración (§1.12 de la spec). */
export const srsMigrationSet = (): SRSData[] => [srsNew(), srsLegacySm2(), srsFsrs()];
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm type-check`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/__tests__/fixtures/srs-fixtures.ts
git commit -m "test(essential-words): fixtures compartidas de SRSData para caracterizacion y migracion"
```

### Task 0.2: Test de caracterización de `attemptGrade`

**Files:**
- Create: `lib/essential-words/__tests__/attempt-grade.characterization.test.ts`

Existe ya `attempt-grade.test.ts`. Este fichero es distinto a propósito: fija la **tabla completa** de entradas→salidas, incluida la constante de latencia, para que la fase 3 (que cambia la firma) demuestre qué preserva y qué cambia deliberadamente.

- [ ] **Step 1: Escribir el test de caracterización**

```ts
// lib/essential-words/__tests__/attempt-grade.characterization.test.ts
import { describe, it, expect } from "vitest";
import { attemptGrade, gradeToLegacyQuality, LOW_LATENCY_MS, type AttemptOutcome } from "../attempt-grade";

const outcome = (over: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  correct: true,
  hintsUsed: 0,
  rescued: false,
  typo: false,
  firstTryFailed: false,
  latencyMs: 1_000,
  ...over,
});

describe("attemptGrade — caracterización del comportamiento actual", () => {
  it("rescatado siempre es Again, incluso si la respuesta fue correcta", () => {
    expect(attemptGrade(outcome({ rescued: true, correct: true }))).toBe("Again");
  });

  it("fallo en el primer intento es Again aunque el retry acierte", () => {
    expect(attemptGrade(outcome({ firstTryFailed: true }))).toBe("Again");
  });

  it("dos o más pistas de pago son Again", () => {
    expect(attemptGrade(outcome({ hintsUsed: 2 }))).toBe("Again");
    expect(attemptGrade(outcome({ hintsUsed: 5 }))).toBe("Again");
  });

  it("una pista de pago es Hard", () => {
    expect(attemptGrade(outcome({ hintsUsed: 1 }))).toBe("Hard");
  });

  it("incorrecta sin pistas es Again", () => {
    expect(attemptGrade(outcome({ correct: false }))).toBe("Again");
  });

  it("correcta y rápida es Easy; el umbral es 25s", () => {
    expect(LOW_LATENCY_MS).toBe(25_000);
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS - 1 }))).toBe("Easy");
    expect(attemptGrade(outcome({ latencyMs: LOW_LATENCY_MS }))).toBe("Good");
  });

  it("typo no es una rama: se trata como correcta por el llamante", () => {
    expect(attemptGrade(outcome({ typo: true, correct: true }))).toBe("Easy");
  });

  it("el puente a quality 0-5 mantiene el corte en 3 = aprobado", () => {
    expect(gradeToLegacyQuality("Again")).toBe(2);
    expect(gradeToLegacyQuality("Hard")).toBe(3);
    expect(gradeToLegacyQuality("Good")).toBe(4);
    expect(gradeToLegacyQuality("Easy")).toBe(5);
  });
});
```

- [ ] **Step 2: Ejecutar — debe pasar sin tocar producción**

Run: `pnpm test lib/essential-words/__tests__/attempt-grade.characterization.test.ts`
Expected: PASS (8 tests). Si algo falla, el comportamiento real difiere de lo documentado: corregir el test, no el código.

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/__tests__/attempt-grade.characterization.test.ts
git commit -m "test(essential-words): caracterizacion de attemptGrade antes del cambio de firma"
```

### Task 0.3: Test de caracterización de la cola y su gating actual

**Files:**
- Create: `lib/essential-words/__tests__/queue.characterization.test.ts`

Fija explícitamente **el bug** que la fase 4 corrige: la cuota solo mira `introducedToday`, nunca los atrasados. Que quede como test hace que la fase 4 tenga que borrarlo conscientemente.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/queue.characterization.test.ts
import { describe, it, expect } from "vitest";
import { buildSessionQueue } from "../queue";
import { essentialWordId, type EssentialWord } from "../types";
import type { SRSData } from "@/lib/types";

const word = (w: string, rank: number): EssentialWord => ({
  word: w,
  rank,
  cefr_level: "A1",
  pos: "noun",
  translation: `${w}-es`,
  meaning: `${w}-meaning`,
  example_sentence: `A sentence with ${w}.`,
} as EssentialWord);

const due = (w: string): SRSData => ({
  wordId: essentialWordId(w),
  word: w,
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-08-01T00:00:00.000Z",
});

const NOW = new Date("2026-08-06T10:00:00.000Z");

describe("buildSessionQueue — caracterización del gating actual", () => {
  it("introduce newPerDay palabras nuevas sin importar cuántos repasos hay atrasados", () => {
    // 40 repasos vencidos. El gating actual los ignora por completo.
    const words = Array.from({ length: 60 }, (_, i) => word(`w${i}`, i));
    const srsEntries = words.slice(0, 40).map((w) => due(w.word));

    const queue = buildSessionQueue({
      words, srsEntries, introducedToday: [], now: NOW, newPerDay: 10,
    });

    expect(queue.filter((i) => i.kind === "review")).toHaveLength(40);
    // BUG documentado (spec §Problema, punto 3): mete 10 nuevas encima de 40 atrasados.
    expect(queue.filter((i) => i.kind === "new")).toHaveLength(10);
  });

  it("la cuota solo descuenta lo ya introducido hoy", () => {
    const words = Array.from({ length: 20 }, (_, i) => word(`w${i}`, i));
    const queue = buildSessionQueue({
      words, srsEntries: [], introducedToday: ["c1k:w0", "c1k:w1", "c1k:w2"],
      now: NOW, newPerDay: 10,
    });
    expect(queue.filter((i) => i.kind === "new")).toHaveLength(7);
  });

  it("ordena los repasos por frecuencia (rank), no por urgencia", () => {
    const words = [word("rare", 900), word("common", 3)];
    const srsEntries = [due("rare"), due("common")];
    const queue = buildSessionQueue({ words, srsEntries, introducedToday: [], now: NOW });
    // BUG documentado: 'common' va primero por rank bajo, no por recuperabilidad.
    expect(queue[0].entry.word).toBe("common");
  });
});
```

- [ ] **Step 2: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/queue.characterization.test.ts`
Expected: PASS (3 tests). Si `EssentialWord` requiere campos adicionales, añadirlos al helper `word()` hasta que type-check pase.

- [ ] **Step 3: Verificar tipos**

Run: `pnpm type-check`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add lib/essential-words/__tests__/queue.characterization.test.ts
git commit -m "test(essential-words): caracterizacion del gating actual, incluido el bug de cuota"
```

### Task 0.4: Snapshot del estado de la suite y de la cadena de sincronización

**Files:**
- Create: `docs/superpowers/plans/notes/2026-08-06-fase0-baseline.md`

- [ ] **Step 1: Ejecutar la suite completa y capturar el resultado**

Run: `pnpm test 2>&1 | tail -30`
Anotar el número de ficheros y tests que pasan, y **cualquier test que ya falle antes de empezar**.

- [ ] **Step 2: Ejecutar type-check y lint**

Run: `pnpm type-check && pnpm lint 2>&1 | tail -20`

- [ ] **Step 3: Escribir la nota de baseline**

```markdown
# Baseline Fase 0 — 2026-08-06

## Suite
- `pnpm test`: <N> ficheros, <M> tests, <K> fallando (listar cuáles y por qué)
- `pnpm type-check`: limpio / <errores>
- `pnpm lint`: <warnings>

## Cadena de escritura actual de Essential Words
1. Card construye `AttemptOutcome` (`attempt-grade.ts`)
2. `attemptGrade` → `Grade` → `gradeToLegacyQuality` → `quality: number`
3. `useEssentialWordsSession.submitGrade(quality)` (`hooks/useEssentialWordsSession.ts:335`)
4. `gradeEssentialWord(word, quality, extras, userId)` (`lib/essential-words/grade.ts:56`)
5. `saveSRSData(...)` → Dexie `srsData` + outbox → Supabase
6. `savePracticeAnswer(...)` → `answer_history` (best-effort, no rompe el flujo)

## Sincronización
- Dexie en versión **30**. Las tablas nuevas entran en la **31**.
- Outbox: `lib/sync/types.ts` — añadir tablas nuevas a `SyncTable`.
- No existe infraestructura de feature flags: la crea la Fase 2.

## Invariantes ya cubiertas por la suite existente
- (listar los ficheros de `lib/essential-words/__tests__/` que ya cubren grading y cola)
```

Rellenar los `<...>` con los valores reales medidos.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/notes/2026-08-06-fase0-baseline.md
git commit -m "docs(essential-words): baseline de fase 0 antes del modelo de habilidades"
```

---

## Fase 1 — Modelo canónico y funciones puras

Objetivo: una sola fuente de verdad para estado, evidencia, eventos SRS e IDs.

Condición de salida: invariantes 10, 19–26, 30–34 verdes; type-check limpio; ningún
módulo puro consulta reloj o ID global.

### Task 1.1: Tipos canónicos

Files: lib/essential-words/verification/types.ts
Test: lib/essential-words/verification/__tests__/types.test.ts

Definir LearningItem, ItemSchedule, Skill, PlacementInference, AttemptAssessment,
SkillObservation, AttemptLog y SrsReviewEvent.

~~~ts
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
  affectsSchedule: true;
  grade: Grade;
  occurredAt: string;
  assessment: AttemptAssessment;
  fsrsLogId: string;
  priorSchedule?: ItemSchedule;
  resultingSchedule: ItemSchedule;
}
~~~

Un intento crea exactamente un AttemptLog y cero o más eventos, uno por cada ítem cuyo
calendario cambie. Un evento no existe sin intento. Probar producción con meaning y
production, intento sin efecto SRS, vínculo de IDs y snapshots de auditoría.

### Task 1.2: Estado derivado e IDs

Files: lib/essential-words/skill-item.ts
Tests: skill-item.test.ts, skill-item-id.test.ts

Implementar deriveSkillStatus, getLearningReason y constructores de IDs base/usage.
mature y status no se persisten. Probar Relearning → learning/lapse y schedules
none/provisional/fsrs.

### Task 1.3: isMature por evento

Files: lib/essential-words/skill-item.ts
Test: skill-item-maturity.test.ts

isMature(item, SrsReviewEvent[], policy) solo usa eventos del ítem con efecto SRS dentro
de recentReviewWindow. Cambiar policy no reescribe historial.

### Task 1.4: Usage derivado

Files: lib/essential-words/skill-item.ts
Test: skill-item-usage-lifecycle.test.ts

Implementar deriveUsageLifecycle, UsagePayload y UsageKind. Usage inactivo nunca entra
en cola; perder madurez bloquea contenido nuevo, no usage activo.

### Task 1.5: ExecutionContext

Files: lib/essential-words/execution-context.ts
Test: execution-context.test.ts

~~~ts
interface ExecutionContext {
  now: Date;
  newId(): string;
}
~~~

Reloj fijo, IDs secuenciales y PRNG semillado para tests/simulación. Las políticas
reciben el contexto; los adaptadores lo crean en el borde.

### Task 1.6: Auditoría de tiempo/IDs

Files: determinism.test.ts y módulos puros de la fase

Clasificar toda aparición nueva de new Date, Date.now, crypto.randomUUID y Math.random.
Probar que observaciones, placement, intervalos, planificador y simulación son idénticos
con el mismo contexto.


## Fase 2 — Persistencia, migración y feature flag

Objetivo: persistir offline-first tres entidades separadas, con flag apagado por defecto.

Condición de salida: invariantes 18, 19 y 31; migración idempotente/conservadora; RLS
y outbox cubren learning_items, attempt_logs y srs_review_events.

### Task 2.1: Flag off/shadow/on

Files: lib/feature-flags.ts, lib/__tests__/feature-flags.test.ts

Resolver modo por entorno y cohorte estable de userId. Ausente/desconocido es off;
shadow no escribe. Probar estabilidad de cohorte y resolución segura.

### Task 2.2: Dexie v31

Files: lib/db/index.ts, lib/db/__tests__/skill-model-schema.test.ts

Crear learningItems, attemptLogs y srsReviewEvents; indexar cuenta, palabra, skill,
dueAt, attemptLogId, learningItemId y occurredAt. Espejos de schedule se derivan y
escriben en la misma transacción. No crear tabla de logs singular.

### Task 2.3: Supabase/RLS

Files: supabase/migrations/20260806120000_create_learning_items.sql

Crear las tres tablas con user_id, checks de schedule, FK del evento al intento, grants
explícitos y RLS por cuenta. Intentos/eventos son insert/select inmutables y conservan
snapshots para reconstrucción.

### Task 2.4: Outbox

Files: lib/sync/types.ts, lib/sync/__tests__/skill-model-tables.test.ts

Registrar las tres tablas; ordenar intento → eventos → ítems; IDs idempotentes. Probar
reintentos sin duplicados y aislamiento por usuario.

### Task 2.5: Queries y mappers

Files: lib/essential-words/queries.ts, lib/essential-words/__tests__/queries.test.ts

Único acceso remoto del dominio. Validar schedules, espejos, snapshots, snake_case,
attemptLogId y learningItemId; rechazar filas incoherentes o IDs bare.

### Task 2.6: Migración SRSData → LearningItem

Files: migrate-to-skill-model.ts, migrate-to-skill-model.test.ts

Cada c1k existente crea meaning con FSRS heredado y listening/production con none. No
crear usage/mature; conservar origen; segunda ejecución no agrega filas.

### Task 2.7: Ejecutor transaccional

Files: run-skill-model-migration.ts, run-skill-model-migration.test.ts

Leer destino y escribir ítems/outbox en transacción Dexie segura ante reintento/fallo.
Con flag off ninguna sesión invoca el motor nuevo.


## Fase 3 — Eventos, observaciones y FSRS por ítem

Objetivo: una interacción conserva telemetría y cada ítem afectado recibe un evento
SRS independiente.

Condición de salida: invariantes 1–3, 12, 13, 16, 24, 31 y 34; ningún escritor FSRS
alternativo ni identidad derivada del primer ítem de una colección.

### Task 3.1: AttemptOutcome → AttemptAssessment

Files: verification/assessment.ts, verification/__tests__/assessment.test.ts

Mantener attemptGrade y añadir modalidad, duración total, hints, rescate, typo,
variante aceptada y primer fallo.

### Task 3.2: Observaciones

Files: verification/policy.ts, verification/__tests__/observations.test.ts

deriveObservations(assessment, context): producción meaning+production; listening
meaning+listening; recognition meaning; pronunciation production. Fallo y acierto
observan las mismas skills con signo distinto.

### Task 3.3: Provisionales deterministas

Files: verification/provisional-intervals.ts y su test

Ventanas desde itemId, seed y context.now. El módulo no crea reloj, UUID ni random.

### Task 3.4: Placement con reloj inyectado

Files: verification/policy.ts, verification/__tests__/placements.test.ts

derivePlacements(observations, assessment, currentItems, context) y
planInferences(bands, now). Inferencia no activa ni madura; el primer intento de
provisional crea FSRS real.

### Task 3.5: Intento multi-ítem

Files: record-attempt.ts, record-attempt.test.ts

planAttemptRecord devuelve un AttemptLog, cero o más SrsReviewEvent y actualizaciones
de ítems. Cada evento contiene attemptLogId, learningItemId, grade, assessment y
schedule antes/después. Probar producción con meaning+production y práctica sin FSRS.

### Task 3.6: Persistencia atómica y FSRS

Files: record-attempt.ts, record-attempt-transaction.test.ts

Una transacción Dexie escribe intento, N eventos, N ítems y outbox. FSRS solo se aplica
por evento. Cualquier fallo hace rollback completo.

### Task 3.7: Reconstrucción por ítem

Files: rebuild-from-events.ts, rebuild-from-events.test.ts

Reconstruir cada ítem desde sus propios eventos. Probar provisional+Again como FSRS
Learning, dos efectos con calendarios independientes e historial inconsistente rechazado.

### Task 3.8: Latencia

Files: verification/latency.ts, verification/__tests__/latency.test.ts

calibrateLatencyThresholds filtra eventos programados, correctos, sin hints/rescate y
Easy/Good; excluye autocorrección, variantes aceptadas, primer fallo y replay gratuito.


## Fase 4 — Planificador, presupuesto y recuperación

Objetivo: contabilidad única, límites por ítem y cola acotada con backlog de horas.

Condición de salida: invariantes 7, 11, 14, 27–29, 32–33. Task 4.6 sustituye
caracterizaciones obsoletas por regresiones.

### Task 4.1: Tipos inequívocos

Files: planning-types.ts, planning-types.test.ts

Usar baseSkillActivations, usageActivations, newWordMeaningActivations,
totalSkillActivations, mandatorySelected y deferredMandatory. Todo candidato lleva
itemId, wordId, skill y modalidad. No existe un contador global ambiguo.

### Task 4.2: Coste por modalidad

Files: cost-estimate.ts, cost-estimate.test.ts

Estimar desde AttemptLog.assessment.interactionDurationMs; no usar promedio global ni
intentos sin evento SRS.

### Task 4.3: Recovery acotado

Files: recovery-mode.ts, recovery-mode.test.ts

Backlog en segundos con learning, overdue y provisionalDue; histéresis; selección por
tramo/urgencia/presupuesto. Deferidos permanecen en backlog sin completarse ni
reprogramarse. Probar varias horas vencidas.

### Task 4.4: Allowance sin doble conteo

Files: daily-budget.ts, daily-budget.test.ts

~~~ts
interface DailyAllowance {
  newWords: number;
  baseSkillActivations: number;
  usageActivations: number;
  newWordMeaningActivations: number;
  totalSkillActivations: number;
  plannedSeconds: number;
  mode: "normal" | "recovery";
}
~~~

Meaning implícito de nueva palabra se cuenta aparte; total es derivado y no corta base.
2 activaciones base + 3 nuevas no permiten 5 activaciones base + 3 nuevas. El límite
persistente es por itemId o wordId#skill; dos listening distintos sí son elegibles.

### Task 4.5: Cola de seis tramos

Files: skill-queue.ts, skill-queue.test.ts

Ordenar learning/relearning, provisionales+overdue, due today, base, usage y nuevas.
Aplicar selected/deferred y cero activaciones nuevas en recovery. Probar no starvation
y límites por ítem.

### Task 4.6: Regresión del gating

Files: queue.characterization.test.ts, gating-regression.test.ts

Eliminar solo aserciones que documentaban gating roto después de crear el test contrario:
presupuesto, urgencia, recovery, límites por itemId y no duplicación. Mantener
caracterizaciones todavía válidas.


## Fase 5 — Verificación "Ya la conozco"

**Objetivo:** la prueba ocurre **inmediatamente**, sin exponer antes definición, ejemplo ni audio, y coloca por evidencia en vez de archivar la palabra entera.

**Depende de:** Fase 4 (las colocaciones consumen presupuesto).
**Condición de salida:** invariantes 8, 28 verdes. Detrás del flag, porque cambia una interacción existente.

### Task 5.1: Política de verificación inmediata

**Files:**
- Create: `lib/essential-words/verification/claim-known.ts`
- Test: `lib/essential-words/verification/__tests__/claim-known.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/verification/__tests__/claim-known.test.ts
import { describe, it, expect } from "vitest";
import { planKnownClaim, verificationCost } from "../claim-known";
import type { LearningItem } from "../types";
import type { EssentialWord } from "../../types";

const word = {
  word: "on", rank: 12, cefr_level: "A1", pos: "preposition",
  translation: "en / sobre", meaning: "in contact with a surface",
  example_sentence: "The book is on the table.",
} as EssentialWord;

const unseen = (skill: LearningItem["skill"]): LearningItem => ({
  id: `c1k:on#${skill}`, wordId: "c1k:on", skill,
  contentOrigin: "authored", schedule: { kind: "none" },
  repetitions: 0, lapses: 0, suspended: false,
});

const items = () => [unseen("meaning"), unseen("production"), unseen("listening")];

describe("planKnownClaim", () => {
  it("devuelve una prueba de producción, no una omisión", () => {
    const plan = planKnownClaim(word, items());
    expect(plan.kind).toBe("verify");
    if (plan.kind === "verify") {
      expect(plan.step.modality).toBe("production");
    }
  });

  it("la prueba NO revela la respuesta (invariante 8)", () => {
    const plan = planKnownClaim(word, items());
    if (plan.kind !== "verify") throw new Error("expected verify");
    const serialized = JSON.stringify(plan.step);
    // El prompt es en español; la palabra inglesa es lo que hay que producir.
    expect(serialized).not.toContain(word.example_sentence);
    expect(plan.step.revealsAnswer).toBe(false);
  });

  it("el prompt es la traducción: español → inglés", () => {
    const plan = planKnownClaim(word, items());
    if (plan.kind !== "verify") throw new Error("expected verify");
    expect(plan.step.prompt).toBe(word.translation);
    expect(plan.step.expected).toBe(word.word);
  });

  it("no verifica una habilidad ya programada: no hay nada que averiguar", () => {
    const scheduled = items().map((item) =>
      item.skill === "meaning"
        ? { ...item, schedule: { kind: "fsrs" as const, dueAt: "2026-09-01T00:00:00.000Z", stability: 30, difficulty: 5, state: "Review" as const } }
        : item);
    const plan = planKnownClaim(word, scheduled);
    // production sigue sin programar, así que aún hay algo que verificar.
    expect(plan.kind).toBe("verify");
  });

  it("si todas las habilidades base están programadas, no hay verificación que hacer", () => {
    const allScheduled = items().map((item) => ({
      ...item,
      schedule: { kind: "fsrs" as const, dueAt: "2026-09-01T00:00:00.000Z", stability: 30, difficulty: 5, state: "Review" as const },
    }));
    expect(planKnownClaim(word, allScheduled).kind).toBe("nothing-to-verify");
  });

  it("sin traducción cae a una prueba basada en el significado", () => {
    const noTranslation = { ...word, translation: undefined } as EssentialWord;
    const plan = planKnownClaim(noTranslation, items());
    if (plan.kind !== "verify") throw new Error("expected verify");
    expect(plan.step.prompt).toBe(noTranslation.meaning);
  });
});

describe("verificationCost", () => {
  it("una verificación que acredita dos habilidades cuesta dos activaciones (invariante 28)", () => {
    // Un Easy en producción crea provisionales de meaning Y production.
    expect(verificationCost("production")).toBe(2);
    expect(verificationCost("listening")).toBe(2);
  });

  it("una de reconocimiento acredita solo meaning: cuesta una", () => {
    expect(verificationCost("recognition")).toBe(1);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/verification/__tests__/claim-known.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/verification/claim-known.ts
// "Ya conozco esta palabra" -> "Compruebalo con una pregunta corta".
//
// La prueba ocurre INMEDIATAMENTE (spec 3.1). El modelo anterior la diferia a
// la ronda final, y entre pulsar el boton y la prueba la palabra podia
// aparecer en otro ejercicio, en una lectura, o seguir fresca en memoria de
// trabajo: el resultado quedaba contaminado.

import { deriveSkillStatus } from "../skill-item";
import type { EssentialWord } from "../types";
import type { AttemptModality, LearningItem, Skill } from "./types";

const BASE_SKILLS: readonly Skill[] = ["meaning", "listening", "production"];

export interface VerificationStep {
  modality: AttemptModality;
  /** Lo que se muestra: espanol, nunca la respuesta inglesa. */
  prompt: string;
  /** Lo que se espera. NO se renderiza antes de responder. */
  expected: string;
  /** Siempre false: si fuera true, la verificacion no mediria nada. */
  revealsAnswer: false;
}

export type KnownClaimPlan =
  | { kind: "verify"; step: VerificationStep }
  | { kind: "nothing-to-verify" };

/**
 * Cuantas activaciones consume una verificacion de esta modalidad. Un Easy en
 * produccion crea DOS provisionales (meaning + production) y no puede
 * saltarse el presupuesto por venir de una sola pregunta (invariante 28).
 */
export function verificationCost(modality: AttemptModality): number {
  return modality === "recognition" || modality === "pronunciation" ? 1 : 2;
}

export function planKnownClaim(
  word: EssentialWord,
  items: LearningItem[],
): KnownClaimPlan {
  const bySkill = new Map(items.map((item) => [item.skill, item]));
  const pending = BASE_SKILLS.filter((skill) => {
    const item = bySkill.get(skill);
    return !item || deriveSkillStatus(item) === "unseen";
  });

  if (pending.length === 0) return { kind: "nothing-to-verify" };

  // Produccion escrita: es la prueba mas informativa por interaccion, porque
  // observa `meaning` y `production` a la vez (spec 3.3).
  return {
    kind: "verify",
    step: {
      modality: "production",
      prompt: word.translation ?? word.meaning ?? word.word,
      expected: word.word,
      revealsAnswer: false,
    },
  };
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/verification/__tests__/claim-known.test.ts`
Expected: PASS (8 tests).

```bash
git add lib/essential-words/verification/claim-known.ts lib/essential-words/verification/__tests__/claim-known.test.ts
git commit -m "feat(essential-words): verificacion inmediata para 'ya conozco esta palabra'"
```

### Task 5.2: Copy de la interfaz

**Files:**
- Modify: `components/practice/study-card/StudyCard.tsx:262`
- Test: `components/practice/study-card/__tests__/StudyCard.test.tsx`

- [ ] **Step 1: Añadir el test al fichero existente**

```tsx
// Añadir dentro del describe principal de StudyCard.test.tsx
it("el copy del claim no promete saltarse la palabra", () => {
  const onOmit = vi.fn();
  render(
    <StudyCard
      {...baseProps}
      onOmit={onOmit}
      omitLabel="Ya conozco esta palabra"
    />,
  );
  const button = screen.getByRole("button", { name: /ya conozco esta palabra/i });
  expect(button).toBeInTheDocument();
  // El copy viejo prometía saltarla, y luego la verificaba igualmente.
  expect(screen.queryByText(/sáltala/i)).not.toBeInTheDocument();
});
```

`baseProps` ya existe en ese fichero; reutilizarlo tal cual.

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test components/practice/study-card/__tests__/StudyCard.test.tsx`
Expected: FAIL — el botón sigue diciendo "Ya la sé, sáltala".

- [ ] **Step 3: Cambiar el valor por defecto**

En `components/practice/study-card/StudyCard.tsx:262`, sustituir:

```tsx
  omitLabel = 'Ya la sé, sáltala',
```

por:

```tsx
  // "Sáltala" prometía omitir y luego se verificaba igualmente. El copy ahora
  // dice lo que de verdad pasa: hay una comprobación corta (spec §3.1).
  omitLabel = 'Ya conozco esta palabra',
```

- [ ] **Step 4: Ejecutar y ajustar otros tests que fijaban el copy viejo**

Run: `pnpm test components/practice`
Expected: PASS. Si algún test busca "Ya la sé, sáltala", actualizarlo al copy nuevo.

- [ ] **Step 5: Commit**

```bash
git add components/practice/study-card/StudyCard.tsx components/practice/study-card/__tests__/StudyCard.test.tsx
git commit -m "feat(essential-words): copy honesto en el claim de palabra conocida"
```

### Task 5.3: Verificación sin exposición previa

**Files:**
- Test: `lib/essential-words/verification/__tests__/no-pre-exposure.test.ts`

Comprobación de composición, sin código nuevo. Si falla, el arreglo va en 5.1.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/verification/__tests__/no-pre-exposure.test.ts
import { describe, it, expect } from "vitest";
import { planKnownClaim } from "../claim-known";
import { buildAssessment } from "../assessment";
import { planAttemptRecord } from "../../record-attempt";
import type { LearningItem } from "../types";
import type { EssentialWord } from "../../types";

const word = {
  word: "on", rank: 12, cefr_level: "A1", pos: "preposition",
  translation: "en / sobre", meaning: "in contact with a surface",
  example_sentence: "The book is on the table.",
  ipa: "/ɒn/",
} as EssentialWord;

const unseen = (skill: LearningItem["skill"]): LearningItem => ({
  id: `c1k:on#${skill}`, wordId: "c1k:on", skill,
  contentOrigin: "authored", schedule: { kind: "none" },
  repetitions: 0, lapses: 0, suspended: false,
});

describe("el flujo de claim no expone la respuesta antes de medir", () => {
  it("el paso de verificación no incluye la palabra inglesa en el prompt", () => {
    const plan = planKnownClaim(word, [unseen("meaning"), unseen("production")]);
    if (plan.kind !== "verify") throw new Error("expected verify");
    expect(plan.step.prompt.toLowerCase()).not.toContain(word.word.toLowerCase());
  });

  it("no incluye ipa ni frase de ejemplo: ambas darían la respuesta", () => {
    const plan = planKnownClaim(word, [unseen("meaning"), unseen("production")]);
    if (plan.kind !== "verify") throw new Error("expected verify");
    const serialized = JSON.stringify(plan.step);
    expect(serialized).not.toContain("/ɒn/");
    expect(serialized).not.toContain(word.example_sentence);
  });

  it("un Easy verificado coloca provisionales, no archiva la palabra", () => {
    const assessment = buildAssessment(
      { correct: true, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false, latencyMs: 4_000 },
      "production", 11_000,
    );
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment,
      eventType: "verification",
      currentItems: [unseen("meaning"), unseen("production")],
      now: new Date("2026-08-06T10:00:00.000Z"),
    });
    expect(plan.updatedItems.every((i) => i.schedule.kind === "provisional")).toBe(true);
    // Nada quedó suspendido: la palabra sigue en el sistema.
    expect(plan.updatedItems.every((i) => i.suspended === false)).toBe(true);
  });

  it("un Again verificado NO castiga: coloca en aprendizaje normal", () => {
    const assessment = buildAssessment(
      { correct: false, hintsUsed: 0, rescued: false, typo: false, firstTryFailed: false, latencyMs: 8_000 },
      "production", 15_000,
    );
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment,
      eventType: "verification",
      currentItems: [unseen("meaning"), unseen("production")],
      now: new Date("2026-08-06T10:00:00.000Z"),
    });
    expect(plan.updatedItems).toHaveLength(2);
    expect(plan.updatedItems.every((i) => i.schedule.kind === "fsrs")).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar y commit**

Run: `pnpm test lib/essential-words/verification/__tests__/no-pre-exposure.test.ts`
Expected: PASS (4 tests).

```bash
git add lib/essential-words/verification/__tests__/no-pre-exposure.test.ts
git commit -m "test(essential-words): la verificacion no expone la respuesta antes de medir"
```

---

## Fase 6 — Colocación inicial

**Objetivo:** muestreo estratificado por bandas, inferencias persistidas y activación **gradual**.

**Depende de:** Fase 4. **No debe bloquear** el funcionamiento normal: la sesión de colocación es opcional.
**Condición de salida:** invariantes 4, 11, 25, 26 verdes.

### Task 6.1: Muestreo estratificado por bandas

**Files:**
- Create: `lib/essential-words/placement/bands.ts`
- Test: `lib/essential-words/placement/__tests__/bands.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/placement/__tests__/bands.test.ts
import { describe, it, expect } from "vitest";
import { buildBands, sampleForPlacement, BAND_COUNT, SAMPLES_PER_BAND } from "../bands";
import type { EssentialWord } from "../../types";

const corpus = (n: number): EssentialWord[] =>
  Array.from({ length: n }, (_, i) => ({
    word: `word${i}`, rank: i + 1, cefr_level: "A1",
    pos: i % 3 === 0 ? "noun" : i % 3 === 1 ? "verb" : "adjective",
    translation: `t${i}`, meaning: `m${i}`, example_sentence: `s${i}`,
  } as EssentialWord));

describe("buildBands", () => {
  it("parte el corpus en bandas de frecuencia", () => {
    expect(buildBands(corpus(1000))).toHaveLength(BAND_COUNT);
  });

  it("las bandas están ordenadas de más a menos frecuente", () => {
    const bands = buildBands(corpus(1000));
    const firstRanks = bands.map((b) => b.words[0].rank);
    expect([...firstRanks].sort((a, b) => a - b)).toEqual(firstRanks);
  });

  it("un corpus pequeño no revienta: produce bandas más pequeñas", () => {
    expect(() => buildBands(corpus(10))).not.toThrow();
  });
});

describe("sampleForPlacement", () => {
  it("toma unas 5 palabras por banda", () => {
    const sample = sampleForPlacement(corpus(1000), 42);
    expect(sample.length).toBeLessThanOrEqual(BAND_COUNT * SAMPLES_PER_BAND);
    expect(sample.length).toBeGreaterThan(0);
  });

  it("evita varias palabras de la misma familia", () => {
    const family = [
      { word: "develop", rank: 100 }, { word: "developer", rank: 101 },
      { word: "development", rank: 102 }, { word: "unrelated", rank: 103 },
    ].map((w) => ({ ...w, cefr_level: "B1", pos: "verb", translation: "t", meaning: "m", example_sentence: "s" } as EssentialWord));

    const sample = sampleForPlacement(family, 7);
    const stems = sample.map((w) => w.word.slice(0, 6));
    expect(new Set(stems).size).toBe(stems.length);
  });

  it("estratifica por parte de la oración", () => {
    const sample = sampleForPlacement(corpus(1000), 42);
    const posSet = new Set(sample.map((w) => w.pos));
    expect(posSet.size).toBeGreaterThan(1);
  });

  it("es determinista con la misma semilla", () => {
    const a = sampleForPlacement(corpus(500), 99).map((w) => w.word);
    const b = sampleForPlacement(corpus(500), 99).map((w) => w.word);
    expect(a).toEqual(b);
  });

  it("semillas distintas dan muestras distintas", () => {
    const a = sampleForPlacement(corpus(500), 1).map((w) => w.word);
    const b = sampleForPlacement(corpus(500), 2).map((w) => w.word);
    expect(a).not.toEqual(b);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/placement/__tests__/bands.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/placement/bands.ts
// El conocimiento de vocabulario NO es monotonico (spec 4.1): alguien puede
// conocer terminos tecnicos poco frecuentes y fallar palabras mas frecuentes
// de otro contexto. Una frontera unica seria falsa; por eso, bandas.

import type { EssentialWord } from "../types";

export const BAND_COUNT = 6;
export const SAMPLES_PER_BAND = 5;

export interface FrequencyBand {
  id: string;
  words: EssentialWord[];
}

export function buildBands(words: EssentialWord[]): FrequencyBand[] {
  const sorted = [...words].sort((a, b) => a.rank - b.rank);
  const size = Math.ceil(sorted.length / BAND_COUNT);

  return Array.from({ length: BAND_COUNT }, (_, i) => ({
    id: `band-${i + 1}`,
    words: sorted.slice(i * size, (i + 1) * size),
  })).filter((band) => band.words.length > 0);
}

/** Semilla deterministica: nada de Math.random, para poder reproducir. */
function seeded(seed: number): () => number {
  let state = seed | 0 || 1;
  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/** Raiz aproximada, para no muestrear develop / developer / development. */
function stem(word: string): string {
  return word.toLowerCase().slice(0, 6);
}

/**
 * Muestreo estratificado por banda y por parte de la oracion, evitando
 * familias lexicas: acertar `develop` no dice casi nada sobre `development`,
 * asi que gastar dos de las ~30 muestras en la misma raiz es desperdiciarlas.
 */
export function sampleForPlacement(words: EssentialWord[], seed: number): EssentialWord[] {
  const random = seeded(seed);
  const usedStems = new Set<string>();
  const sample: EssentialWord[] = [];

  for (const band of buildBands(words)) {
    const byPos = new Map<string, EssentialWord[]>();
    for (const word of band.words) {
      const bucket = byPos.get(word.pos) ?? [];
      bucket.push(word);
      byPos.set(word.pos, bucket);
    }

    const buckets = [...byPos.values()];
    let taken = 0;
    let guard = 0;

    while (taken < SAMPLES_PER_BAND && guard < band.words.length * 2) {
      guard += 1;
      const bucket = buckets[Math.floor(random() * buckets.length)];
      if (!bucket || bucket.length === 0) continue;

      const candidate = bucket[Math.floor(random() * bucket.length)];
      const key = stem(candidate.word);
      if (usedStems.has(key)) continue;

      usedStems.add(key);
      sample.push(candidate);
      taken += 1;
    }
  }

  return sample;
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/placement/__tests__/bands.test.ts`
Expected: PASS (9 tests).

```bash
git add lib/essential-words/placement/bands.ts lib/essential-words/placement/__tests__/bands.test.ts
git commit -m "feat(essential-words): muestreo estratificado por bandas de frecuencia"
```

### Task 6.2: Confianza por banda y persistencia de la inferencia

**Files:**
- Create: `lib/essential-words/placement/policy.ts`
- Test: `lib/essential-words/placement/__tests__/policy.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/placement/__tests__/policy.test.ts
import { describe, it, expect } from "vitest";
import {
  bandConfidence, planInferences, PLACEMENT_POLICY_VERSION,
} from "../policy";
import type { EssentialWord } from "../../types";

const words = (n: number, from = 1): EssentialWord[] =>
  Array.from({ length: n }, (_, i) => ({
    word: `w${from + i}`, rank: from + i, cefr_level: "A1", pos: "noun",
    translation: "t", meaning: "m", example_sentence: "s",
  } as EssentialWord));

describe("bandConfidence", () => {
  it("5/5 y 4/5 dan confianza alta", () => {
    expect(bandConfidence(5, 5).tier).toBe("high");
    expect(bandConfidence(4, 5).tier).toBe("high");
  });

  it("3/5 es fronteriza: verificación individual, no fast-track", () => {
    expect(bandConfidence(3, 5).tier).toBe("borderline");
  });

  it("0-2/5 da confianza baja: aprendizaje normal", () => {
    expect(bandConfidence(2, 5).tier).toBe("low");
    expect(bandConfidence(0, 5).tier).toBe("low");
  });

  it("la confianza numérica crece con los aciertos", () => {
    expect(bandConfidence(5, 5).value).toBeGreaterThan(bandConfidence(3, 5).value);
  });
});

describe("planInferences", () => {
  const bandWords = words(50);

  it("solo infiere en bandas de confianza alta", () => {
    const low = planInferences([{ bandId: "band-1", words: bandWords, cleanHits: 1, sampled: 5 }]);
    expect(low).toHaveLength(0);
  });

  it("marca placementInference sin programar (invariante 26)", () => {
    const inferred = planInferences([{ bandId: "band-1", words: bandWords, cleanHits: 5, sampled: 5 }]);
    expect(inferred.length).toBeGreaterThan(0);
    for (const item of inferred) {
      expect(item.schedule).toEqual({ kind: "none" });
      expect(item.placementInference?.bandId).toBe("band-1");
    }
  });

  it("registra la versión de la política, para poder recalibrar después", () => {
    const inferred = planInferences([{ bandId: "band-1", words: bandWords, cleanHits: 5, sampled: 5 }]);
    expect(inferred[0].placementInference?.policyVersion).toBe(PLACEMENT_POLICY_VERSION);
  });

  it("nunca infiere sobre usage (invariante 25)", () => {
    const inferred = planInferences([{ bandId: "band-1", words: bandWords, cleanHits: 5, sampled: 5 }]);
    expect(inferred.every((i) => i.skill !== "usage")).toBe(true);
  });

  it("una inferencia nunca produce un ítem maduro (invariante 4)", () => {
    const inferred = planInferences([{ bandId: "band-1", words: bandWords, cleanHits: 5, sampled: 5 }]);
    // Sin programación FSRS, isMature() devuelve false por construcción.
    expect(inferred.every((i) => i.schedule.kind === "none")).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/placement/__tests__/policy.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/placement/policy.ts
// Confianza por banda y persistencia de la inferencia (spec 4.1, 4.2).
//
// La inferencia NO activa: marca. La conversion a provisional activo es
// gradual (6.3), porque sembrar cientos de vencimientos sincronizados es
// exactamente el pico que la simulacion busca detectar.

import { learningItemId } from "../skill-item";
import type { EssentialWord } from "../types";
import type { LearningItem, Skill } from "../verification/types";

export const PLACEMENT_POLICY_VERSION = "v1";

const BASE_SKILLS: readonly Skill[] = ["meaning", "listening", "production"];

export type ConfidenceTier = "high" | "borderline" | "low";

export interface BandConfidence {
  tier: ConfidenceTier;
  value: number;
}

export interface BandResult {
  bandId: string;
  words: EssentialWord[];
  cleanHits: number;
  sampled: number;
}

/**
 * Explicable y testeable, sin modelo estadistico complejo (spec 4.1). Los
 * fronterizos NO se infieren: se verifican individualmente.
 */
export function bandConfidence(cleanHits: number, sampled: number): BandConfidence {
  const value = sampled > 0 ? cleanHits / sampled : 0;
  if (value >= 0.8) return { tier: "high", value };
  if (value >= 0.6) return { tier: "borderline", value };
  return { tier: "low", value };
}

/**
 * Items inferidos: existen, llevan su procedencia, y siguen SIN programar.
 * `meaning` es la unica habilidad que se infiere — acertar una palabra en un
 * muestreo escrito no dice nada sobre reconocerla de oido.
 */
export function planInferences(bands: BandResult[], now: Date): LearningItem[] {
  const inferredAt = now.toISOString();
  const items: LearningItem[] = [];

  for (const band of bands) {
    const confidence = bandConfidence(band.cleanHits, band.sampled);
    if (confidence.tier !== "high") continue;

    for (const word of band.words) {
      const wordId = `c1k:${word.word.toLowerCase()}`;
      for (const skill of BASE_SKILLS) {
        items.push({
          id: learningItemId(wordId, skill),
          wordId,
          skill,
          contentOrigin: "authored",
          schedule: { kind: "none" },
          // Solo `meaning` recibe la inferencia: es lo unico que el muestreo
          // escrito observo.
          placementInference: skill === "meaning"
            ? {
                bandId: band.bandId,
                confidence: confidence.value,
                inferredAt,
                policyVersion: PLACEMENT_POLICY_VERSION,
              }
            : undefined,
          repetitions: 0,
          lapses: 0,
          suspended: false,
        });
      }
    }
  }

  return items;
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/placement/__tests__/policy.test.ts`
Expected: PASS (10 tests).

```bash
git add lib/essential-words/placement/policy.ts lib/essential-words/placement/__tests__/policy.test.ts
git commit -m "feat(essential-words): confianza por banda e inferencias sin activar"
```

### Task 6.3: Conversión gradual inferido → provisional

**Files:**
- Modify: `lib/essential-words/placement/policy.ts`
- Test: `lib/essential-words/placement/__tests__/gradual-activation.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/placement/__tests__/gradual-activation.test.ts
import { describe, it, expect } from "vitest";
import { convertInferences, DEFAULT_CONVERSIONS_PER_DAY } from "../policy";
import type { LearningItem } from "../../verification/types";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const inferred = (n: number): LearningItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c1k:w${i}#meaning`, wordId: `c1k:w${i}`, skill: "meaning" as const,
    contentOrigin: "authored" as const,
    schedule: { kind: "none" as const },
    placementInference: {
      bandId: "band-1", confidence: 0.9,
      inferredAt: "2026-08-01T00:00:00.000Z", policyVersion: "v1",
    },
    repetitions: 0, lapses: 0, suspended: false,
  }));

describe("convertInferences", () => {
  it("respeta el límite diario de conversiones (invariante 11)", () => {
    const converted = convertInferences(inferred(500), DEFAULT_CONVERSIONS_PER_DAY, NOW);
    expect(converted).toHaveLength(DEFAULT_CONVERSIONS_PER_DAY);
  });

  it("los convertidos pasan a provisional con source placement-inference", () => {
    const converted = convertInferences(inferred(10), 5, NOW);
    for (const item of converted) {
      expect(item.schedule.kind).toBe("provisional");
      if (item.schedule.kind === "provisional") {
        expect(item.schedule.source).toBe("placement-inference");
      }
    }
  });

  it("hereda la confianza de la banda como evidenceConfidence", () => {
    const [first] = convertInferences(inferred(1), 1, NOW);
    if (first.schedule.kind !== "provisional") throw new Error("expected provisional");
    expect(first.schedule.evidenceConfidence).toBe(0.9);
  });

  it("DISTRIBUYE los vencimientos: no caen todos el mismo día", () => {
    const converted = convertInferences(inferred(30), 30, NOW);
    const days = new Set(converted.map((i) =>
      i.schedule.kind === "provisional" ? i.schedule.dueAt.slice(0, 10) : ""));
    // Sin esto, la colocación siembra un pico sincronizado a 7-21 días.
    expect(days.size).toBeGreaterThanOrEqual(7);
  });

  it("conserva placementInference como telemetría tras convertir", () => {
    const [first] = convertInferences(inferred(1), 1, NOW);
    expect(first.placementInference?.bandId).toBe("band-1");
  });

  it("ignora ítems ya programados: no reconvierte", () => {
    const already = inferred(3).map((item) => ({
      ...item,
      schedule: {
        kind: "provisional" as const, dueAt: "2026-08-20T00:00:00.000Z",
        source: "placement-inference" as const, evidenceConfidence: 0.9,
      },
    }));
    expect(convertInferences(already, 10, NOW)).toHaveLength(0);
  });

  it("ignora ítems sin inferencia", () => {
    const plain = inferred(3).map((item) => ({ ...item, placementInference: undefined }));
    expect(convertInferences(plain, 10, NOW)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/placement/__tests__/gradual-activation.test.ts`
Expected: FAIL — `convertInferences` no exportado.

- [ ] **Step 3: Implementar en `placement/policy.ts`**

```ts
import { provisionalDueAt } from "../verification/provisional-intervals";

/** PROVISIONAL: se calibra en la Fase 8 (spec 10, decision 4). */
export const DEFAULT_CONVERSIONS_PER_DAY = 8;

/**
 * Convierte inferidos en provisionales activos, con limite diario y
 * vencimientos DISTRIBUIDOS. Sin esto, la colocacion siembra cientos de
 * vencimientos sincronizados a 7-21 dias: exactamente el pico que el
 * criterio 7 de la simulacion busca detectar.
 *
 * `placementInference` se conserva tras convertir: deja de determinar la
 * programacion, pero sigue sirviendo para recalibrar la banda (spec 4.3).
 */
export function convertInferences(
  items: LearningItem[],
  limit: number,
  now: Date,
): LearningItem[] {
  return items
    .filter((item) => item.placementInference && item.schedule.kind === "none")
    .slice(0, limit)
    .map((item) => ({
      ...item,
      schedule: {
        kind: "provisional" as const,
        dueAt: provisionalDueAt("inference", item.id, now).toISOString(),
        source: "placement-inference" as const,
        evidenceConfidence: item.placementInference!.confidence,
      },
    }));
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/placement/__tests__/gradual-activation.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Verificar tamaño y commit**

Run: `wc -l lib/essential-words/placement/policy.ts`
Expected: <250.

```bash
git add lib/essential-words/placement/policy.ts lib/essential-words/placement/__tests__/gradual-activation.test.ts
git commit -m "feat(essential-words): conversion gradual de inferencias con vencimientos distribuidos"
```

### Task 6.4: Muestreo de control

**Files:**
- Create: `lib/essential-words/placement/control-sampling.ts`
- Test: `lib/essential-words/placement/__tests__/control-sampling.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/placement/__tests__/control-sampling.test.ts
import { describe, it, expect } from "vitest";
import { pickControlSamples, recalibrateConfidence, CONTROL_RATE } from "../control-sampling";
import type { LearningItem } from "../../verification/types";

const fastTracked = (n: number, bandId = "band-1"): LearningItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c1k:w${i}#meaning`, wordId: `c1k:w${i}`, skill: "meaning" as const,
    contentOrigin: "authored" as const,
    schedule: {
      kind: "provisional" as const, dueAt: "2026-08-20T00:00:00.000Z",
      source: "placement-inference" as const, evidenceConfidence: 0.9,
    },
    placementInference: {
      bandId, confidence: 0.9, inferredAt: "2026-08-01T00:00:00.000Z", policyVersion: "v1",
    },
    repetitions: 0, lapses: 0, suspended: false,
  }));

describe("pickControlSamples", () => {
  it("verifica 1-2 de cada 20 fast-tracked", () => {
    const picked = pickControlSamples(fastTracked(20), 42);
    expect(picked.length).toBeGreaterThanOrEqual(1);
    expect(picked.length).toBeLessThanOrEqual(2);
  });

  it("escala con el volumen", () => {
    const picked = pickControlSamples(fastTracked(100), 42);
    expect(picked.length).toBeGreaterThanOrEqual(Math.floor(100 * CONTROL_RATE));
  });

  it("es determinista con la misma semilla", () => {
    const a = pickControlSamples(fastTracked(60), 7).map((i) => i.id);
    const b = pickControlSamples(fastTracked(60), 7).map((i) => i.id);
    expect(a).toEqual(b);
  });

  it("solo elige ítems con inferencia de banda", () => {
    const mixed = [
      ...fastTracked(10),
      ...fastTracked(10).map((i) => ({ ...i, placementInference: undefined })),
    ];
    expect(pickControlSamples(mixed, 3).every((i) => i.placementInference)).toBe(true);
  });
});

describe("recalibrateConfidence", () => {
  it("baja la confianza de una banda con muchos fallos", () => {
    const next = recalibrateConfidence(0.9, { checked: 10, failed: 6 });
    expect(next).toBeLessThan(0.9);
  });

  it("mantiene la confianza si el control confirma la inferencia", () => {
    const next = recalibrateConfidence(0.9, { checked: 10, failed: 0 });
    expect(next).toBeGreaterThanOrEqual(0.9);
  });

  it("nunca sale del rango 0-1", () => {
    expect(recalibrateConfidence(0.9, { checked: 10, failed: 10 })).toBeGreaterThanOrEqual(0);
    expect(recalibrateConfidence(0.99, { checked: 10, failed: 0 })).toBeLessThanOrEqual(1);
  });

  it("sin muestras no cambia nada: no recalibra a ciegas", () => {
    expect(recalibrateConfidence(0.9, { checked: 0, failed: 0 })).toBe(0.9);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/placement/__tests__/control-sampling.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/placement/control-sampling.ts
// La colocacion es inferencia sobre ~30 muestras: se VA a equivocar en
// algunas palabras. Es aceptable *porque* existe este mecanismo de
// correccion, no porque la estimacion sea precisa (spec 4.4).

import type { LearningItem } from "../verification/types";

/** 1-2 de cada 20 fast-tracked se verifican en sesiones proximas. */
export const CONTROL_RATE = 0.075;

function seeded(seed: number): () => number {
  let state = seed | 0 || 1;
  return () => {
    state = (state * 1_103_515_245 + 12_345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function pickControlSamples(items: LearningItem[], seed: number): LearningItem[] {
  const eligible = items.filter((item) => item.placementInference);
  if (eligible.length === 0) return [];

  const random = seeded(seed);
  const target = Math.max(1, Math.round(eligible.length * CONTROL_RATE));
  const shuffled = [...eligible].sort(() => random() - 0.5);
  return shuffled.slice(0, target);
}

/**
 * Si la tasa de fallo de una banda es alta, se REDUCE su confianza. La
 * recalibracion es suave a proposito: cambiar la confianza de golpe
 * adelantaria una avalancha de verificaciones, que es justo lo que la
 * colocacion gradual evita.
 */
export function recalibrateConfidence(
  current: number,
  control: { checked: number; failed: number },
): number {
  if (control.checked === 0) return current;
  const observed = 1 - control.failed / control.checked;
  const blended = current * 0.5 + observed * 0.5;
  return Math.min(1, Math.max(0, blended));
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/placement/__tests__/control-sampling.test.ts`
Expected: PASS (8 tests).

```bash
git add lib/essential-words/placement/control-sampling.ts lib/essential-words/placement/__tests__/control-sampling.test.ts
git commit -m "feat(essential-words): muestreo de control y recalibracion de bandas"
```

---

## Fase 7 — Ciclo de vida de usage

Objetivo: elegibilidad, activación presupuestada, validación y offline sin generación
remota. Depende de Fase 4.

### Task 7.1: Elegibilidad por tipo

Files: usage/lifecycle.ts, usage/__tests__/eligibility.test.ts

context_usage exige meaning review; advanced_usage exige meaning y production maduras.
La madurez usa SrsReviewEvent[].

### Task 7.2: Activación y pérdida de madurez

Files: usage/lifecycle.ts, usage/__tests__/maturity-loss.test.ts

Conectar límites de Fase 4 por itemId. Un lapse bloquea contenido nuevo, no retira usage
activo; recovery consume cero activaciones nuevas.

### Task 7.3: Validación y telemetría

Files: usage/validation.ts, usage/__tests__/validation.test.ts

Validar schema, frase, expresión, duplicados, variantes y motivos de no aparición. No
generar contenido ni llamar proveedores.

### Task 7.4: Fixtures authored/offline

Files: usage/__tests__/fixtures/authored-usage.ts, usage/__tests__/offline.test.ts

Sin caché/generación usage no aparece, pero la sesión sigue funcionando; authored no
requiere proveedor.


## Fase 8 — Simulación fiel y calibración

**Estado:** detenida en 8.5 por bloqueo de diseño. No iniciar Fase 9.

Objetivo: simular el diseño real durante 180 días, corregir primero los
contratos estructurales y fijar parámetros solo con aceptación verde y datos
empíricos suficientes.

Condición de salida: 11 criterios pasan en perfiles aplicables; señales base,
provisional y usage no son triviales; diez adversariales pasan; los ocho grupos
tienen versión; costes y latencia tienen al menos 200 muestras empíricas por
modalidad. `insufficient-sample`, `insufficient-forecast` o
`insufficient-data` bloquean la salida.

Regla transversal: después de cada cambio de Tasks 8.5–8.11 ejecutar los cinco
perfiles y los diez adversariales y registrar el delta completo de C1–C11.

### Task 8.1: Perfiles y contexto

Files: simulation/profiles.ts, simulation/__tests__/profiles.test.ts

Definir cinco perfiles. Inyectar reloj, IDs y PRNG; misma semilla produce calendario,
precisión y ausencias idénticos.

### Task 8.2: Motor diario fiel

Files: simulation/state.ts, simulation/candidates.ts,
simulation/apply-session.ts, simulation/run-simulation.ts y sus tests

Ejecutar estado por palabra, due, obligatorios, candidatos, allowance, cola,
completado, eventos y métricas mediante políticas reales. Candidatos elegibles
deben producir activaciones/provisionales; campos permanentemente vacíos
invalidan la simulación.

### Task 8.3: Once criterios unitarios

Files: simulation/criteria/*, simulation/__tests__/criteria-*.test.ts

Mantener C1–C11 con sus límites existentes y casos pass/fail. Falta de muestra
no equivale a pass.

### Task 8.4: Aceptación y adversariales

Files: simulation/__tests__/acceptance.test.ts, simulation/adversarial.ts,
simulation/__tests__/adversarial.test.ts

Invocar explícitamente C1–C11 y probar los diez motores defectuosos. Baseline
detenida: 33/43 tests formales verdes; C4 constante, C8 constante, C9 en cinco
perfiles y C11 en intermitente/ráfagas/principiante continúan rojos.

### Task 8.5: Modelo C11 desde retrievability

Files: simulation/scheduled-review-outcome.ts, simulation/apply-session.ts,
simulation/criteria/retention.ts, verification/types.ts, record-attempt.ts y tests

Para `priorSchedule.kind=fsrs`, `state=Review` y eventType scheduled-review:
`correct = seededRandom.next() < fsrsRetrievability(currentItem, now)`; el
evento audita la retrievability previa.
La modalidad modifica latencia/duración/dificultad, no la probabilidad binaria.
C11 sigue siendo `correctas / n`, muestra mínima 50 y rango 0,85–0,95. Excluir
verification, practice, New, Learning y Relearning.

### Task 8.6: Ledger de ocho sesiones activas

Files: capacity-ledger.ts, planning-types.ts, daily-budget.ts y tests

Crear ocho slots que avanzan solo con sesiones activas y comparten presupuesto
en segundos. Reservar en orden: reservas futuras, Review obligatorio, learning,
diferido, base pendiente, placement, usage y nuevas. Cada palabra nueva reserva
atómicamente meaning actual, listening y production dentro del horizonte; si
falla una reserva, no se admite.

### Task 8.7: Reservas de placement

Files: placement/policy.ts, verification/provisional-intervals.ts,
simulation/candidates.ts y tests

Cada conversión reserva listening, production y provisional contra el mismo
ledger. Probar offsets deterministas dentro de la ventana y rechazar la cohorte
si rompe C9 o no existe forecast hasta dueAt. El límite diario queda como
protección secundaria, nunca como control suficiente.

### Task 8.8: Telemetría y dataset empírico

Files: calibration/dataset.ts, calibration/robust-estimate.ts,
cost-estimate.ts, verification/latency.ts y tests

Separar `interactionDurationMs` y `latencyMs` por modalidad, deduplicar intentos
y filtrar revisiones Review autónomas. Exigir 200 muestras por modalidad. Usar
mediana tras filtro MAD; con menos datos devolver `insufficient-data` y mantener
fallback versionado sin declarar calibración final. Datos sintéticos no abren el
gate.

### Task 8.9: Recalibración estructural

Cerrar primero C1–C5 y C8–C11. Ejecutar cinco perfiles y diez adversariales
después de cada ajuste. No tocar madurez ni latencia.

### Task 8.10: Madurez

Solo con la estructura verde, calibrar MaturityPolicy y comprobar C6, C7 y C9
tras cada cambio, además de perfiles y adversariales.

### Task 8.11: Costes y latencia

Solo con dataset empírico ready en cuatro modalidades. Costes proceden de
duration; Easy/Good de latency. Versionar valores y fallbacks por separado y
repetir aceptación completa después de cada ajuste.

### Task 8.12: Cierre y versionado

Fijar ocho grupos y retirar comentarios provisionales solo con C1–C11 y diez
adversariales verdes, forecast suficiente y dataset empírico ready. Hasta
entonces Fase 8 y Fase 9 permanecen abiertas/bloqueadas respectivamente.


## Fase 9 — Integración y rollout real bajo feature flag

Objetivo: probar rutas reales antes de retirar SRSData.

Condición de salida: off, shadow y on probados; cohorte, métricas, rollback y ausencia
de doble escritura documentados.

### Task 9.1: Router único

Files: skill-model-router.ts, skill-model-router.test.ts

off usa solo SRSData; on usa solo LearningItem + AttemptLog + SrsReviewEvent. El router
de sesión/grade/cola es el único selector. Probar que ningún repositorio escribe ambos.

### Task 9.2: Shadow sin mutación

Files: router/telemetry, skill-model-shadow.test.ts

La ruta vieja decide/persiste; la nueva calcula con el mismo contexto sin mutar. Registrar
diferencias de cola, due, coste y activaciones; probar cero writes nuevos.

### Task 9.3: Cohorte, métricas y rollback

Files: docs/superpowers/plans/notes/2026-08-06-fase9-rollout.md,
skill-model-rollout.test.ts

Observar mínimo 14 días y 100 sesiones por cohorte: outbox failed, discrepancias,
duplicados, reconstrucción, backlog y retención. off no borra datos ni reprograma.

### Task 9.4: Gate de promoción

No iniciar Fase 10 hasta simulación verde, discrepancias explicadas, cero double-write
y métricas dentro de límites. Si falla, mantener shadow/off y documentar.

## Fase 10 — Retirada del modelo anterior

### Task 10.1: Reconstrucción y precondiciones reales

Files: rebuild-from-events.ts, fase10-precondiciones.md,
rebuild-from-events.integration.test.ts

Verificar cohortes, eventos por ítem, outbox limpio, migración conservadora y
reconstrucción. No usar logs singulares.

### Task 10.2: Retirar ruta vieja

Files: lib/essential-words/grade.ts, hooks/useEssentialWordsSession.ts,
lib/essential-words/__tests__/grade.test.ts

Después del gate, retirar ruta c1k y flag; conservar answer_history. Probar que la
ruta nueva es única y no escribe SRSData.

### Task 10.3: Limpieza conservadora

Eliminar queue.ts solo sin llamantes de producción, comprobado con git grep. No borrar
datos de usuario ni migraciones históricas.

### Task 10.4: Cierre

Ejecutar suite, type-check, lint y build; comparar baseline/final y documentar rollback,
migración, reconstrucción y riesgos.


## Criterio de aprobación de cada fase

Ninguna fase termina sin type-check/lint limpios, tests unitarios y de integración,
migraciones idempotentes, transacciones atómicas y sin activar dependencias posteriores.
Si parámetros seguros no satisfacen simulación, se reporta revisión de diseño y no se
relaja un criterio.

## Mapa de invariantes por fase

| Invariantes | Fase |
|---|---|
| 10, 19–26, 30, 34 | 1 |
| 18, 19, 31 | 2 |
| 1–3, 12, 13, 16, 24, 31, 34 | 3 |
| 7, 11, 14, 27–29, 32–33 | 4 |
| 8, 28 | 5 |
| 4, 11, 25–26 | 6 |
| 5, 7, 9, 23 | 7 |
| 1–7, 8–11, 15, 17, 22, 27–34 | 8 |
| router, shadow, métricas, rollback | 9 |
| reconstrucción, retiro condicionado, limpieza | 10 |

## Trazabilidad granular spec → función → prueba

| Requisito | Función/módulo | Unitario | Integración/aceptación |
|---|---|---|---|
| §1.2–1.6 modelo/estado/madurez | verification/types.ts, skill-item.ts | 1.1–1.4 | 2.6, 3.7 |
| §1.7–1.9 evidence/assessment/placement | verification/policy.ts, assessment.ts | 3.1–3.4 | 5.3, 8.3 |
| §1.10 intento y N efectos | record-attempt.ts | 3.5–3.7 | 10.1 |
| §1.11 persistencia/RLS/sync | DB, queries, outbox | 2.2–2.5 | 2.7, 9.3 |
| §1.12 migración | migrate-to-skill-model.ts | 2.6–2.7 | 10.1 |
| §2.1–2.5 cola/allowance/recovery | daily-budget.ts, skill-queue.ts, capacity-ledger.ts | 4.1–4.6, 8.6 | 8.4, 8.9 |
| §2.6 ExecutionContext | execution-context.ts | 1.5–1.6 | 8.1 |
| §3.1–3.6 evidencia/latencia/provisionales | verification/*, calibration/* | 3.1–3.4, 3.8, 8.8 | 5.1–5.3, 8.11 |
| §4 placement | placement/*, capacity-ledger.ts | 6.1–6.4, 8.7 | 8.4, 8.9 |
| §5 usage/offline | usage/* | 7.1–7.4 | 8.4, 8.9–8.10 |
| §6 arquitectura | rutas de fases | tests locales | type-check/build |
| §7 invariantes | módulos correspondientes | invariant tests | acceptance/adversarial |
| §8 testing | Vitest y gates | todas | cada fase |
| §9 criterio 1 | budgetRespected | 8.3 | 8.4, 8.9 |
| §9 criterio 2 | percentile95 | 8.3 | 8.4, 8.9 |
| §9 criterio 3 | recoveryExits | 8.3 | 8.4, 8.9 |
| §9 criterio 4 | backlogSlope | 8.3 | 8.4 Constante, 8.9 |
| §9 criterio 5 | recoveryReturnSessions | 8.3 | 8.4 Ráfagas, 8.9 |
| §9 criterio 6 | usageActivationShare | 8.3 | 8.4, 8.10 |
| §9 criterio 7 | synchronizedPeaks | 8.3 | 8.4, 8.10 |
| §9 criterio 8 | newWordLiveness | 8.3 | 8.4 Constante, 8.9 |
| §9 criterio 9 | baseSkillActivationLiveness | 8.3, 8.6–8.7 | 8.4, 8.9–8.10 |
| §9 criterio 10 | overdueStarvation | 8.3 | 8.4, 8.9 |
| §9 criterio 11 | observedRetention | 8.3, 8.5 | 8.4, 8.9 |
| §10 calibración | calibration/*, nota | 8.8 | 8.9–8.12 |
| §11 rollout | router/flags/telemetry | 9.1–9.3 | 9.4 |
| §12 fuera de alcance | documentación, sin implementación | — | — |
| Pistas tipificadas existentes | hint-ladder.ts, HintRungKind, priced, hintsUsed | tests existentes | 3.1, 3.8 |

## Autorrevisión antes de cerrar

- Spec → plan: cada requisito tiene función, prueba unitaria, integración y salida.
- Plan → spec: AttemptLog, SrsReviewEvent, ExecutionContext, allowance, cola acotada y
  rollout existen en §§1, 2 y 9–11 de la spec.
- Ejecución acumulativa: tipos antes de persistencia; persistencia antes de eventos;
  eventos antes de simulación; rollout antes de retirada; sin logs singulares, contador
  global ambiguo ni reloj global en funciones puras.
- Adversarial: los motores defectuosos de Task 8.4 deben fallar; si uno pasa, el plan
  permanece abierto.

El plan queda abierto hasta demostrar esa condición.
