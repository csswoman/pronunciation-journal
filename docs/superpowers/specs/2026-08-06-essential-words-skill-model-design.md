# Essential Words — Modelo de habilidades: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir el modelo "una palabra = una tarjeta SRS" por un modelo de ítems de habilidad (`meaning` / `listening` / `production` / `usage`) con evidencia por modalidad, programación FSRS por ítem y un planificador con presupuesto real.

**Architecture:** Cuatro piezas canónicas — `LearningItem` (unidad programable) → `AttemptLog` (una interacción pedagógica) → `SrsReviewEvent` (un efecto SRS por ítem afectado) → funciones puras derivadas (`deriveSkillStatus`, `isMature`, `deriveUsageLifecycle`). El motor viejo (`SRSData` con prefijo `c1k:`) sigue vivo detrás de un router `off | shadow | on` hasta la retirada segura de la fase 10.

**Tech Stack:** TypeScript estricto, Dexie (v31), Supabase + RLS, `ts-fsrs`, Vitest, Next.js 16 App Router.

**Spec:** [`docs/superpowers/specs/2026-08-06-essential-words-skill-model-design.md`](../specs/2026-08-06-essential-words-skill-model-design.md)

---

## Dependencias entre fases

```
Fase 0 (caracterización)
   └─► Fase 1 (modelo puro + contexto determinista)
          └─► Fase 2 (persistencia + migración + flag)
                 └─► Fase 3 (intentos + eventos SRS + escritura atómica)
                        └─► Fase 4 (planificador + presupuesto)   ◄── riesgo principal
                               ├─► Fase 5 (verificación "Ya la conozco")
                               ├─► Fase 6 (colocación inicial)
                               └─► Fase 7 (ciclo de vida usage)
                                      └─► Fase 8 (simulación fiel + calibración)
                                             └─► Fase 9 (integración y rollout off/shadow/on)
                                                    └─► Fase 10 (retirada segura de SRSData)
```

Las fases 5, 6 y 7 son paralelizables entre sí, pero **ninguna** empieza antes de que la 4 esté verde: el presupuesto es donde vive el riesgo de acumulación, y colocación y `usage` son precisamente los dos que más carga generan. La fase 9 es un rollout real y obligatorio; la retirada de la fase 10 no puede empezar solo porque la simulación esté verde.

## Convenciones para todas las tareas

- Tests con **Vitest**: `pnpm test <ruta>`. Type-check: `pnpm type-check`. Lint: `pnpm lint`.
- Ficheros nuevos ≤250 líneas (regla del repo). Si una tarea empuja un fichero por encima, la tarea incluye el split.
- **Sin `any`** sin comentario que lo justifique.
- Cada tarea termina en commit. Mensajes en el estilo del repo: `feat(essential-words): …`, `test(essential-words): …`, `refactor(...)`.
- Ningún acceso a Supabase fuera de `lib/*/queries.ts`.

---

## Fase 0 — Caracterización del sistema actual

**Objetivo:** poder distinguir una regresión involuntaria de un cambio deliberado. Nada de esta fase cambia comportamiento.

**Condición de salida:** existe una suite que describe el comportamiento actual de grading, cola y sincronización, y que seguirá verde durante las fases 1–2 sin modificarse.

### Task 0.1: Fixtures compartidas de `SRSData`

**Files:**
- Create: `lib/essential-words/__tests__/fixtures/srs-fixtures.ts`

- [ ] **Step 1: Crear las fixtures**

Estas fixtures las consumen las fases 0, 2 y 10 (caracterización, migración y verificación de retirada). Son la única definición de "cómo son los datos viejos".

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

**Objetivo:** los tipos y las funciones derivadas, sin tocar UI, Dexie ni Supabase. Todo puro y testeable sin I/O.

**Condición de salida:** invariantes estructurales (10, 19, 20, 21, 24, 25, 26, 30) verdes; `pnpm type-check` limpio; nada de la app importa todavía estos módulos.

### Task 1.1: Tipos canónicos del modelo, intento y efectos SRS

**Files:**
- Create: `lib/essential-words/verification/types.ts`
- Test: `lib/essential-words/verification/__tests__/types.test.ts`

Esta tarea elimina el contrato singular `ReviewLog`. Una interacción pedagógica se registra una vez en `AttemptLog`; cada `LearningItem` cuyo calendario cambie recibe un `SrsReviewEvent` propio. Así una producción puede producir un intento y dos efectos reconstruibles (`meaning` y `production`).

- [ ] **Step 1: Escribir tests de tipos**

Los tests deben demostrar:

1. `ItemSchedule` es una unión discriminada y un provisional no admite campos FSRS.
2. `PlacementInference` solo se usa en habilidades base.
3. Una inferencia de banda no finge una modalidad.
4. `AttemptLog` no contiene `learningItemId` singular ni `affectsSchedule`.
5. `SrsReviewEvent` siempre referencia exactamente un `learningItemId`, un `attemptLogId`, `priorSchedule` y `resultingSchedule`.
6. Una práctica puede existir como `AttemptLog` sin ningún `SrsReviewEvent`.

Ejemplo de contratos que deben compilar:

```ts
import type { Grade } from "../attempt-grade";

export type FsrsCardState = "New" | "Learning" | "Review" | "Relearning";
export type Skill = "meaning" | "listening" | "production" | "usage";
export type AttemptModality = "recognition" | "production" | "listening" | "pronunciation";
export type AttemptEventType = "practice" | "verification" | "scheduled-review" | "learning-step";

export type ItemSchedule =
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

export interface PlacementInference {
  bandId: string;
  confidence: number;
  inferredAt: string;
  policyVersion: string;
}

export type UsageKind = "context_usage" | "advanced_usage";

export interface GeneratedContentMetadata {
  generatorVersion?: string;
  promptVersion?: string;
  modelVersion?: string;
  schemaVersion: number;
  reviewed?: boolean;
}

export interface UsagePayload {
  usageKind: UsageKind;
  expression: string;
  sentence: string;
  sentenceIpa?: string;
  acceptedVariants: string[];
  generationStatus: "pending" | "ready" | "failed";
  generatedAt?: string;
  activatedAt?: string;
  retiredAt?: string;
  metadata: GeneratedContentMetadata;
}

export interface LearningItem {
  id: string;
  wordId: string;
  skill: Skill;
  contentOrigin: "authored" | "generated" | "journal";
  generatorProvider?: "gemini";
  payload?: UsagePayload;
  placementInference?: PlacementInference;
  schedule: ItemSchedule;
  lastReview?: string;
  repetitions: number;
  lapses: number;
  suspended: boolean;
}

export type SkillStatus = "unseen" | "learning" | "provisional" | "review";

export interface SkillObservation {
  skill: Skill;
  outcome: "success" | "failure";
  source: "direct" | "placement-inference" | "journal";
  basis:
    | { kind: "attempt"; modality: AttemptModality }
    | { kind: "band-inference"; bandId: string; policyVersion: string };
  evidenceConfidence: number;
  observedAt: string;
}

export interface AttemptAssessment {
  grade: Grade;
  modality: AttemptModality;
  correct: boolean;
  latencyMs: number;
  interactionDurationMs: number;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
  firstTryFailed: boolean;
  freeAudioReplays: number;
}

export interface SkillPlacement {
  skill: Skill;
  schedule: ItemSchedule;
  verificationSource: "direct" | "placement-inference";
}

/** Una interacción pedagógica, inmutable. No pertenece a una sola tarjeta. */
export interface AttemptLog {
  id: string;
  sessionId: string;
  wordId: string;
  assessment: AttemptAssessment;
  observations: SkillObservation[];
  eventType: AttemptEventType;
  occurredAt: string;
}

/** Un efecto SRS sobre exactamente un LearningItem. */
export interface SrsReviewEvent {
  id: string;
  attemptLogId: string;
  learningItemId: string;
  grade: Grade;
  assessment: AttemptAssessment;
  priorSchedule: ItemSchedule;
  resultingSchedule: ItemSchedule;
  occurredAt: string;
  affectsSchedule: true;
  fsrsAudit: {
    schedulerVersion: string;
    desiredRetention: number;
  };
}

export interface MaturityPolicy {
  version: string;
  minStabilityDays: number;
  minSuccessfulReviews: number;
  maxRecentLapses: number;
  recentReviewWindow: number;
}
```

- [ ] **Step 1b: Escribir el fichero de test completo**

El test no se limita a comprobar que los nombres existen. Debe fijar las
relaciones cardinales que motivaron la separación entre intento y evento SRS.

```ts
// lib/essential-words/verification/__tests__/types.test.ts
import { describe, expect, it } from "vitest";
import type {
  AttemptAssessment,
  AttemptLog,
  AttemptModality,
  ItemSchedule,
  LearningItem,
  PlacementInference,
  SkillObservation,
  SrsReviewEvent,
} from "../types";

const assessment: AttemptAssessment = {
  grade: "Good",
  modality: "production",
  correct: true,
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: false,
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
};

const attempt: AttemptLog = {
  id: "attempt-1",
  sessionId: "session-1",
  wordId: "c1k:on",
  assessment,
  observations: [],
  eventType: "verification",
  occurredAt: "2026-08-06T10:00:00.000Z",
};

const none: ItemSchedule = { kind: "none" };
const provisional: ItemSchedule = {
  kind: "provisional",
  dueAt: "2026-08-20T10:00:00.000Z",
  source: "direct",
  evidenceConfidence: 1,
};
const fsrs: ItemSchedule = {
  kind: "fsrs",
  dueAt: "2026-08-20T10:00:00.000Z",
  stability: 12,
  difficulty: 5,
  state: "Review",
};

describe("contratos canónicos del modelo de habilidades", () => {
  it("ItemSchedule discrimina las tres ramas", () => {
    expect([none.kind, provisional.kind, fsrs.kind]).toEqual([
      "none",
      "provisional",
      "fsrs",
    ]);
  });

  it("un provisional no admite campos FSRS", () => {
    const invalid: ItemSchedule = {
      kind: "provisional",
      dueAt: "2026-08-20T10:00:00.000Z",
      source: "direct",
      evidenceConfidence: 1,
      // @ts-expect-error stability pertenece exclusivamente a la rama fsrs.
      stability: 12,
    };
    expect(invalid.kind).toBe("provisional");
  });

  it("una inferencia de banda no finge modalidad", () => {
    const observation: SkillObservation = {
      skill: "meaning",
      outcome: "success",
      source: "placement-inference",
      basis: {
        kind: "band-inference",
        bandId: "band-3",
        policyVersion: "v1",
      },
      evidenceConfidence: 0.85,
      observedAt: "2026-08-06T10:00:00.000Z",
    };
    expect(observation.basis.kind).toBe("band-inference");
    expect(observation.basis).not.toHaveProperty("modality");
  });

  it("AttemptLog describe la interacción y no pertenece a una tarjeta", () => {
    expect(attempt.wordId).toBe("c1k:on");
    expect(attempt).not.toHaveProperty("learningItemId");
    expect(attempt).not.toHaveProperty("affectsSchedule");
    expect(attempt).not.toHaveProperty("fsrsLogId");
  });

  it("un evento SRS pertenece a exactamente un ítem", () => {
    const event: SrsReviewEvent = {
      id: "event-1",
      attemptLogId: attempt.id,
      learningItemId: "c1k:on#meaning",
      grade: "Good",
      assessment,
      priorSchedule: none,
      resultingSchedule: fsrs,
      occurredAt: attempt.occurredAt,
      affectsSchedule: true,
      fsrsAudit: {
        schedulerVersion: "ts-fsrs-current",
        desiredRetention: 0.9,
      },
    };
    expect(event.attemptLogId).toBe(attempt.id);
    expect(event.learningItemId).toBe("c1k:on#meaning");
    expect(event.priorSchedule.kind).toBe("none");
    expect(event.resultingSchedule.kind).toBe("fsrs");
  });

  it("una misma interacción puede producir dos efectos independientes", () => {
    const events: SrsReviewEvent[] = ["meaning", "production"].map(
      (skill, index) => ({
        id: `event-${index}`,
        attemptLogId: attempt.id,
        learningItemId: `c1k:on#${skill}`,
        grade: "Good",
        assessment,
        priorSchedule: none,
        resultingSchedule: fsrs,
        occurredAt: attempt.occurredAt,
        affectsSchedule: true,
        fsrsAudit: {
          schedulerVersion: "ts-fsrs-current",
          desiredRetention: 0.9,
        },
      }),
    );
    expect(new Set(events.map((event) => event.learningItemId)).size).toBe(2);
    expect(new Set(events.map((event) => event.attemptLogId))).toEqual(
      new Set([attempt.id]),
    );
  });

  it("una práctica puede existir sin eventos SRS", () => {
    const practice: AttemptLog = { ...attempt, eventType: "practice" };
    const events: SrsReviewEvent[] = [];
    expect(practice.eventType).toBe("practice");
    expect(events).toHaveLength(0);
  });

  it("PlacementInference permanece separada de ItemSchedule", () => {
    const inference: PlacementInference = {
      bandId: "band-3",
      confidence: 0.85,
      inferredAt: "2026-08-06T10:00:00.000Z",
      policyVersion: "v1",
    };
    const item: LearningItem = {
      id: "c1k:on#meaning",
      wordId: "c1k:on",
      skill: "meaning",
      contentOrigin: "authored",
      placementInference: inference,
      schedule: { kind: "none" },
      repetitions: 0,
      lapses: 0,
      suspended: false,
    };
    expect(item.schedule.kind).toBe("none");
    expect(item.placementInference?.confidence).toBe(0.85);
  });

  it("AttemptModality conserva las cuatro modalidades", () => {
    const modalities: AttemptModality[] = [
      "recognition",
      "production",
      "listening",
      "pronunciation",
    ];
    expect(modalities).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Ejecutar primero en rojo**

Run: `pnpm test lib/essential-words/verification/__tests__/types.test.ts`

Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar los tipos sin I/O**

No añadir `ReviewLog`, `reviewLogs`, `affectsSchedule` opcional ni un `learningItemId` al intento. El único registro autorizado a representar un cambio SRS es `SrsReviewEvent`.

- [ ] **Step 4: Ejecutar y verificar tipos**

Run: `pnpm test lib/essential-words/verification/__tests__/types.test.ts && pnpm type-check`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/verification/types.ts lib/essential-words/verification/__tests__/types.test.ts
git commit -m "feat(essential-words): separar AttemptLog y SrsReviewEvent por item"
```

### Task 1.2: `deriveSkillStatus` y `getLearningReason`

**Files:**
- Create: `lib/essential-words/skill-item.ts`
- Test: `lib/essential-words/__tests__/skill-item.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/skill-item.test.ts
import { describe, it, expect } from "vitest";
import { deriveSkillStatus, getLearningReason } from "../skill-item";
import type { ItemSchedule, LearningItem } from "../verification/types";

const item = (schedule: ItemSchedule): LearningItem => ({
  id: "c1k:on#meaning", wordId: "c1k:on", skill: "meaning",
  contentOrigin: "authored", schedule,
  repetitions: 0, lapses: 0, suspended: false,
});

const fsrs = (state: "New" | "Learning" | "Review" | "Relearning"): ItemSchedule => ({
  kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z",
  stability: 10, difficulty: 5, state,
});

describe("deriveSkillStatus", () => {
  it("sin programación es unseen", () => {
    expect(deriveSkillStatus(item({ kind: "none" }))).toBe("unseen");
  });

  it("provisional es provisional", () => {
    expect(deriveSkillStatus(item({
      kind: "provisional", dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct", evidenceConfidence: 1,
    }))).toBe("provisional");
  });

  it("FSRS en Review es review", () => {
    expect(deriveSkillStatus(item(fsrs("Review")))).toBe("review");
  });

  it("FSRS en Learning y Relearning es learning (invariante 21)", () => {
    expect(deriveSkillStatus(item(fsrs("Learning")))).toBe("learning");
    expect(deriveSkillStatus(item(fsrs("Relearning")))).toBe("learning");
  });

  it("FSRS en New es learning, no unseen", () => {
    expect(deriveSkillStatus(item(fsrs("New")))).toBe("learning");
  });
});

describe("getLearningReason", () => {
  it("es undefined si el ítem no está en learning", () => {
    expect(getLearningReason(item({ kind: "none" }))).toBeUndefined();
    expect(getLearningReason(item(fsrs("Review")))).toBeUndefined();
  });

  it("Relearning da lapse (invariante 21)", () => {
    expect(getLearningReason(item(fsrs("Relearning")))).toBe("lapse");
  });

  it("Learning da new", () => {
    expect(getLearningReason(item(fsrs("Learning")))).toBe("new");
  });

  it("la razón se deriva solo de FsrsCardState (invariante 20)", () => {
    // Mismo ítem, distinto state → distinta razón, sin campo persistido.
    const relearning = item(fsrs("Relearning"));
    const learning = item(fsrs("Learning"));
    expect(getLearningReason(relearning)).not.toBe(getLearningReason(learning));
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/skill-item.test.ts`
Expected: FAIL — "Cannot find module '../skill-item'".

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/skill-item.ts
// Funciones derivadas del modelo de habilidades (spec §1.4, §1.5, §5.2).
// Nada de esto se persiste: derivar en lectura elimina la posibilidad de que
// el estado almacenado y la programación diverjan.

// `Skill` y `MaturityPolicy` los usan las tareas 1.3 y 1.5 de este mismo
// fichero; se importan ya aquí para no acabar con dos import del mismo módulo.
import type {
  LearningItem, MaturityPolicy, SrsReviewEvent, Skill, SkillStatus,
} from "./verification/types";

/** Estado de dominio de un ítem, derivado exclusivamente de `schedule`. */
export function deriveSkillStatus(item: LearningItem): SkillStatus {
  if (item.schedule.kind === "none") return "unseen";
  if (item.schedule.kind === "provisional") return "provisional";
  return item.schedule.state === "Review" ? "review" : "learning";
}

/**
 * Por qué un ítem está en aprendizaje. `relearning` no es un estado de
 * dominio propio: FSRS ya lo distingue y duplicarlo crearía dos fuentes de
 * verdad, así que la razón se deriva de `FsrsCardState`.
 */
export function getLearningReason(item: LearningItem): "new" | "lapse" | undefined {
  if (deriveSkillStatus(item) !== "learning") return undefined;
  if (item.schedule.kind !== "fsrs") return "new";
  return item.schedule.state === "Relearning" ? "lapse" : "new";
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/skill-item.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/skill-item.ts lib/essential-words/__tests__/skill-item.test.ts
git commit -m "feat(essential-words): deriveSkillStatus y getLearningReason"
```

### Task 1.3: `isMature` sobre eventos SRS por ítem

**Files:**
- Modify: `lib/essential-words/skill-item.ts`
- Test: `lib/essential-words/__tests__/skill-item-maturity.test.ts`

`mature` sigue siendo un predicado derivado. La diferencia es que su historial ya no es una lista ambigua de intentos: recibe únicamente los `SrsReviewEvent` del ítem evaluado.

- [ ] **Step 1: Escribir tests**

Cubrir:

- `schedule.kind !== "fsrs"` nunca es maduro.
- FSRS fuera de `Review` nunca es maduro.
- exige estabilidad mínima y revisiones exitosas.
- solo cuenta eventos cuyo `learningItemId === item.id`.
- un intento que produjo dos eventos no mezcla los historiales de las dos tarjetas.
- `recentReviewWindow` se aplica sobre eventos cronológicos del ítem.
- demasiados `Again` recientes bloquean madurez.

- [ ] **Step 2: Implementar**

```ts
import type {
  LearningItem, MaturityPolicy, SrsReviewEvent, Skill, SkillStatus,
} from "./verification/types";

export const DEFAULT_MATURITY_POLICY: MaturityPolicy = {
  version: "provisional-1",
  minStabilityDays: 21,
  minSuccessfulReviews: 3,
  maxRecentLapses: 1,
  recentReviewWindow: 5,
};

export function isMature(
  item: LearningItem,
  events: SrsReviewEvent[],
  policy: MaturityPolicy,
): boolean {
  if (item.schedule.kind !== "fsrs" || item.schedule.state !== "Review") return false;
  if (item.schedule.stability < policy.minStabilityDays) return false;

  const own = events
    .filter((event) => event.learningItemId === item.id)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const successes = own.filter((event) => event.grade !== "Again");
  if (successes.length < policy.minSuccessfulReviews) return false;

  const recent = own.slice(-policy.recentReviewWindow);
  const lapses = recent.filter((event) => event.grade === "Again").length;
  return lapses <= policy.maxRecentLapses;
}
```

Los valores son provisionales hasta la Fase 8. Cambiarlos exige subir `policy.version`, no migrar filas.

- [ ] **Step 3: Ejecutar y commit**

```bash
pnpm test lib/essential-words/__tests__/skill-item-maturity.test.ts
pnpm type-check
git add lib/essential-words/skill-item.ts lib/essential-words/__tests__/skill-item-maturity.test.ts
git commit -m "feat(essential-words): derivar madurez desde eventos SRS por item"
```

### Task 1.4: `deriveUsageLifecycle`

**Files:**
- Modify: `lib/essential-words/skill-item.ts`
- Test: `lib/essential-words/__tests__/skill-item-usage-lifecycle.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/skill-item-usage-lifecycle.test.ts
import { describe, it, expect } from "vitest";
import { deriveUsageLifecycle } from "../skill-item";
import type { ItemSchedule, LearningItem, UsagePayload } from "../verification/types";

const payload = (over: Partial<UsagePayload> = {}): UsagePayload => ({
  usageKind: "advanced_usage",
  expression: "depend on",
  sentence: "It depends on the weather.",
  acceptedVariants: [],
  generationStatus: "ready",
  metadata: { schemaVersion: 1 },
  ...over,
});

const usage = (schedule: ItemSchedule, over: Partial<UsagePayload> = {}): LearningItem => ({
  id: "c1k:on#usage:depend-on", wordId: "c1k:on", skill: "usage",
  contentOrigin: "generated", generatorProvider: "gemini",
  payload: payload(over), schedule,
  repetitions: 0, lapses: 0, suspended: false,
});

describe("deriveUsageLifecycle", () => {
  it("sin programación es inactive", () => {
    expect(deriveUsageLifecycle(usage({ kind: "none" }))).toBe("inactive");
  });

  it("con programación FSRS es active", () => {
    expect(deriveUsageLifecycle(usage({
      kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z",
      stability: 5, difficulty: 5, state: "Learning",
    }))).toBe("active");
  });

  it("con programación provisional es active", () => {
    expect(deriveUsageLifecycle(usage({
      kind: "provisional", dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct", evidenceConfidence: 1,
    }))).toBe("active");
  });

  it("retiredAt gana sobre cualquier programación", () => {
    const retired = usage(
      { kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z", stability: 5, difficulty: 5, state: "Review" },
      { retiredAt: "2026-08-05T00:00:00.000Z" },
    );
    expect(deriveUsageLifecycle(retired)).toBe("retired");
  });

  it("no puede haber estado contradictorio: el ciclo sale de schedule, no de un enum", () => {
    // El mismo payload con dos schedules da dos ciclos distintos. No hay
    // campo `activationStatus` que pueda desincronizarse.
    const inactive = usage({ kind: "none" });
    const active = usage({
      kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z",
      stability: 5, difficulty: 5, state: "Learning",
    });
    expect(deriveUsageLifecycle(inactive)).not.toBe(deriveUsageLifecycle(active));
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/skill-item-usage-lifecycle.test.ts`
Expected: FAIL — `deriveUsageLifecycle` no exportado.

- [ ] **Step 3: Implementar en `skill-item.ts`**

```ts
/**
 * Ciclo de vida de un ítem `usage`, derivado (spec §5.2). No existe un campo
 * `activationStatus`: un enum junto a `schedule` podría contradecirlo
 * ("inactive" con programación FSRS) sin que nada dijera cuál manda.
 *
 * Efecto secundario deseado: "inactivo" equivale a `schedule.kind === "none"`,
 * así que ninguna query de vencimientos lo alcanza — la invariante 5 deja de
 * depender de un filtro explícito.
 */
export function deriveUsageLifecycle(
  item: LearningItem,
): "inactive" | "active" | "retired" {
  if (item.payload?.retiredAt) return "retired";
  return item.schedule.kind === "none" ? "inactive" : "active";
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/skill-item-usage-lifecycle.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Verificar el tamaño del fichero**

Run: `wc -l lib/essential-words/skill-item.ts`
Expected: bien por debajo de 250. Si no, partir en `skill-item.ts` + `skill-item-maturity.ts`.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/skill-item.ts lib/essential-words/__tests__/skill-item-usage-lifecycle.test.ts
git commit -m "feat(essential-words): deriveUsageLifecycle sin activationStatus persistido"
```

### Task 1.5: Construcción de identificadores de ítem

**Files:**
- Modify: `lib/essential-words/skill-item.ts`
- Test: `lib/essential-words/__tests__/skill-item-id.test.ts`

El formato `"c1k:on#usage:depend-on"` aparece en toda la spec. Sin un constructor único, cada fase lo reconstruiría a mano y divergirían.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/skill-item-id.test.ts
import { describe, it, expect } from "vitest";
import { learningItemId, parseLearningItemId } from "../skill-item";

describe("learningItemId", () => {
  it("compone habilidades base", () => {
    expect(learningItemId("c1k:on", "meaning")).toBe("c1k:on#meaning");
    expect(learningItemId("c1k:on", "listening")).toBe("c1k:on#listening");
  });

  it("compone usage con su expresión en kebab-case", () => {
    expect(learningItemId("c1k:on", "usage", "depend on")).toBe("c1k:on#usage:depend-on");
  });

  it("normaliza mayúsculas y espacios de la expresión", () => {
    expect(learningItemId("c1k:on", "usage", "On The Verge Of")).toBe("c1k:on#usage:on-the-verge-of");
  });

  it("rechaza usage sin expresión", () => {
    expect(() => learningItemId("c1k:on", "usage")).toThrow(/expression/i);
  });

  it("es estable: la misma entrada da el mismo id (invariante 6)", () => {
    expect(learningItemId("c1k:on", "usage", "depend on"))
      .toBe(learningItemId("c1k:on", "usage", "depend  on"));
  });
});

describe("parseLearningItemId", () => {
  it("recupera wordId y skill de una habilidad base", () => {
    expect(parseLearningItemId("c1k:on#meaning")).toEqual({
      wordId: "c1k:on", skill: "meaning",
    });
  });

  it("recupera la expresión de un usage", () => {
    expect(parseLearningItemId("c1k:on#usage:depend-on")).toEqual({
      wordId: "c1k:on", skill: "usage", expressionSlug: "depend-on",
    });
  });

  it("devuelve null ante un id malformado", () => {
    expect(parseLearningItemId("c1k:on")).toBeNull();
    expect(parseLearningItemId("c1k:on#bogus")).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/skill-item-id.test.ts`
Expected: FAIL — funciones no exportadas.

- [ ] **Step 3: Implementar en `skill-item.ts`**

`Skill` ya está en el import de la tarea 1.2: no añadas un segundo `import` del
mismo módulo. Añade solo lo que sigue al final del fichero.

```ts
const BASE_SKILLS: readonly Skill[] = ["meaning", "listening", "production"];

function slugify(expression: string): string {
  return expression.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Único constructor de ids de ítem. El formato es
 * `<wordId>#<skill>` para habilidades base y `<wordId>#usage:<slug>` para
 * usos, de modo que un id es siempre reversible a (palabra, habilidad).
 */
export function learningItemId(wordId: string, skill: Skill, expression?: string): string {
  if (skill === "usage") {
    if (!expression) throw new Error("learningItemId: usage requires an expression");
    return `${wordId}#usage:${slugify(expression)}`;
  }
  return `${wordId}#${skill}`;
}

export interface ParsedLearningItemId {
  wordId: string;
  skill: Skill;
  expressionSlug?: string;
}

export function parseLearningItemId(id: string): ParsedLearningItemId | null {
  const hash = id.indexOf("#");
  if (hash < 0) return null;
  const wordId = id.slice(0, hash);
  const rest = id.slice(hash + 1);
  if (!wordId || !rest) return null;

  if (rest.startsWith("usage:")) {
    const expressionSlug = rest.slice("usage:".length);
    return expressionSlug ? { wordId, skill: "usage", expressionSlug } : null;
  }
  return BASE_SKILLS.includes(rest as Skill)
    ? { wordId, skill: rest as Skill }
    : null;
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/skill-item-id.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Ejecutar toda la fase 1 y verificar tipos**

Run: `pnpm test lib/essential-words && pnpm type-check`
Expected: PASS, sin errores de tipos.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/skill-item.ts lib/essential-words/__tests__/skill-item-id.test.ts
git commit -m "feat(essential-words): constructor y parser unico de ids de LearningItem"
```


### Task 1.6: Contexto de ejecución determinista

**Files:**
- Create: `lib/essential-words/execution-context.ts`
- Test: `lib/essential-words/__tests__/execution-context.test.ts`

Las funciones puras y simulables no consultan reloj, UUID ni aleatoriedad global. Los bordes UI/I-O crean el contexto; el dominio lo recibe.

- [ ] **Step 1: Definir el contrato**

```ts
export interface ExecutionContext {
  now: Date;
  newId(): string;
}

export interface RandomSource {
  next(): number; // [0, 1)
}
```

- [ ] **Step 2: Añadir factories de borde y de test**

```ts
export function systemExecutionContext(): ExecutionContext {
  return { now: new Date(), newId: () => crypto.randomUUID() };
}

export function fixedExecutionContext(now: Date, ids: string[]): ExecutionContext {
  let index = 0;
  return {
    now,
    newId: () => ids[index++] ?? `test-id-${index}`,
  };
}
```

La factory de sistema es el único lugar de este módulo que puede consultar el entorno. Los módulos de dominio reciben `ExecutionContext` o parámetros equivalentes.

- [ ] **Step 3: Test estático de dependencias ocultas**

Añadir un test que inspeccione los módulos puros nuevos y falle si aparecen sin clasificación:

- `new Date()`
- `Date.now()`
- `crypto.randomUUID()`
- `Math.random()`

Se permiten solo en archivos de borde documentados o en fixtures de test.

- [ ] **Step 4: Commit**

```bash
git add lib/essential-words/execution-context.ts lib/essential-words/__tests__/execution-context.test.ts
git commit -m "feat(essential-words): contexto inyectado para reloj e ids"
```
---

## Fase 2 — Persistencia, migración y feature flag

**Objetivo:** el modelo existe en Dexie y Supabase, la migración lo puebla sin perder progreso, y todo queda **apagado** detrás de un flag.

**Condición de salida:** invariantes 18 (idempotencia) y 19 (`mature` no persistido) verdes; con el flag apagado la app se comporta exactamente como en la Fase 0; los `SRSData` originales siguen intactos.

### Task 2.1: Infraestructura de feature flags

**Files:**
- Create: `lib/feature-flags.ts`
- Test: `lib/__tests__/feature-flags.test.ts`

No existe infraestructura de flags en el repo. La creamos mínima: una función pura sobre `process.env`, sin estado global.

- [ ] **Step 1: Escribir el test**

```ts
// lib/__tests__/feature-flags.test.ts
import { describe, it, expect } from "vitest";
import { isSkillModelEnabled } from "../feature-flags";

describe("isSkillModelEnabled", () => {
  it("está apagado por defecto", () => {
    expect(isSkillModelEnabled({})).toBe(false);
  });

  it("se enciende solo con el string exacto 'true'", () => {
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "true" })).toBe(true);
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "1" })).toBe(false);
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "yes" })).toBe(false);
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "TRUE" })).toBe(false);
  });

  it("un valor vacío no lo enciende", () => {
    expect(isSkillModelEnabled({ NEXT_PUBLIC_SKILL_MODEL: "" })).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/__tests__/feature-flags.test.ts`
Expected: FAIL — "Cannot find module '../feature-flags'".

- [ ] **Step 3: Implementar**

```ts
// lib/feature-flags.ts
// Flags de despliegue. Funciones puras sobre un env inyectable: sin estado
// global, testeables sin tocar process.env real.

type Env = Record<string, string | undefined>;

/**
 * Motor de habilidades (spec 2026-08-06). Mientras está apagado, Essential
 * Words usa la ruta `SRSData` de siempre. Se compara contra el literal
 * "true" para que un valor accidental ("0", "false", "off") nunca encienda
 * un motor a medio migrar.
 */
export function isSkillModelEnabled(env: Env = process.env): boolean {
  return env.NEXT_PUBLIC_SKILL_MODEL === "true";
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/__tests__/feature-flags.test.ts`
Expected: PASS (3 tests).

```bash
git add lib/feature-flags.ts lib/__tests__/feature-flags.test.ts
git commit -m "feat(flags): flag NEXT_PUBLIC_SKILL_MODEL para el motor de habilidades"
```

### Task 2.2: Tablas Dexie v31 para ítems, intentos y eventos

**Files:**
- Modify: `lib/db/index.ts`
- Test: `lib/db/__tests__/skill-model-schema.test.ts`

- [ ] **Step 1: Escribir el test de esquema**

Debe exigir las tablas:

- `learningItems`
- `attemptLogs`
- `srsReviewEvents`

Índices mínimos:

```text
learningItems: id, userId, [userId+wordId], [userId+skill],
               [userId+dueAt], [userId+scheduleKind], updatedAt
attemptLogs: id, userId, [userId+sessionId], [userId+wordId],
             [userId+occurredAt], synced
srsReviewEvents: id, userId, [userId+attemptLogId],
                 [userId+learningItemId], [userId+occurredAt], synced
```

- [ ] **Step 1b: Fijar el esquema completo en el test**

```ts
// lib/db/__tests__/skill-model-schema.test.ts
import { describe, expect, it } from "vitest";
import { db } from "../index";

describe("Dexie v31 — modelo de habilidades", () => {
  it("declara las tres tablas del motor nuevo", () => {
    const names = db.tables.map((table) => table.name);
    expect(names).toContain("learningItems");
    expect(names).toContain("attemptLogs");
    expect(names).toContain("srsReviewEvents");
  });

  it("learningItems permite consultar palabra, habilidad y vencimiento", () => {
    const schema = db.table("learningItems").schema;
    const indexes = schema.indexes.map((index) => index.name);
    expect(schema.primKey.name).toBe("id");
    expect(indexes).toContain("userId");
    expect(indexes).toContain("[userId+wordId]");
    expect(indexes).toContain("[userId+skill]");
    expect(indexes).toContain("[userId+dueAt]");
    expect(indexes).toContain("[userId+scheduleKind]");
  });

  it("attemptLogs permite consultar sesión, palabra y momento", () => {
    const indexes = db
      .table("attemptLogs")
      .schema.indexes.map((index) => index.name);
    expect(indexes).toContain("[userId+sessionId]");
    expect(indexes).toContain("[userId+wordId]");
    expect(indexes).toContain("[userId+occurredAt]");
  });

  it("srsReviewEvents permite reconstruir cada tarjeta", () => {
    const indexes = db
      .table("srsReviewEvents")
      .schema.indexes.map((index) => index.name);
    expect(indexes).toContain("[userId+learningItemId]");
    expect(indexes).toContain("[userId+attemptLogId]");
    expect(indexes).toContain("[userId+occurredAt]");
  });

  it("la versión es al menos 31", () => {
    expect(db.verno).toBeGreaterThanOrEqual(31);
  });
});
```

Los registros locales deben ser explícitos. No guardar `status`, `learningReason`
ni `mature`: se derivan en lectura.

```ts
import type {
  AttemptLog,
  LearningItem,
  SrsReviewEvent,
} from "@/lib/essential-words/verification/types";

export interface LearningItemRecord extends LearningItem {
  userId: string;
  dueAt?: string;
  scheduleKind: LearningItem["schedule"]["kind"];
  updatedAt: string;
}

export interface AttemptLogRecord extends AttemptLog {
  userId: string;
  synced: boolean;
}

export interface SrsReviewEventRecord extends SrsReviewEvent {
  userId: string;
  synced: boolean;
}
```

La versión 31 debe declarar las tres tablas en el mismo bloque:

```ts
this.version(31).stores({
  learningItems:
    "id, userId, [userId+wordId], [userId+skill], " +
    "[userId+dueAt], [userId+scheduleKind], updatedAt",
  attemptLogs:
    "id, userId, [userId+sessionId], [userId+wordId], " +
    "[userId+occurredAt], synced",
  srsReviewEvents:
    "id, userId, [userId+learningItemId], [userId+attemptLogId], " +
    "[userId+occurredAt], synced",
});
```

- [ ] **Step 2: Declarar records**

```ts
import type {
  AttemptLog, LearningItem, SrsReviewEvent,
} from "@/lib/essential-words/verification/types";

export interface LearningItemRecord extends LearningItem {
  userId: string;
  dueAt?: string;
  scheduleKind: LearningItem["schedule"]["kind"];
  updatedAt: string;
}

export interface AttemptLogRecord extends AttemptLog {
  userId: string;
  synced: boolean;
}

export interface SrsReviewEventRecord extends SrsReviewEvent {
  userId: string;
  synced: boolean;
}
```

`dueAt` y `scheduleKind` son espejos indexables y se escriben atómicamente con `schedule`.

- [ ] **Step 3: Declarar tablas y v31**

```ts
learningItems!: Table<LearningItemRecord, string>;
attemptLogs!: Table<AttemptLogRecord, string>;
srsReviewEvents!: Table<SrsReviewEventRecord, string>;

this.version(31).stores({
  learningItems: "id, userId, [userId+wordId], [userId+skill], [userId+dueAt], [userId+scheduleKind], updatedAt",
  attemptLogs: "id, userId, [userId+sessionId], [userId+wordId], [userId+occurredAt], synced",
  srsReviewEvents: "id, userId, [userId+attemptLogId], [userId+learningItemId], [userId+occurredAt], synced",
});
```

- [ ] **Step 4: Ejecutar y commit**

```bash
pnpm test lib/db/__tests__/skill-model-schema.test.ts
pnpm test lib/db
pnpm type-check
git add lib/db/index.ts lib/db/__tests__/skill-model-schema.test.ts
git commit -m "feat(db): tablas Dexie para items intentos y eventos SRS"
```

### Task 2.3: Migración Supabase con RLS para las tres entidades

**Files:**
- Create: `supabase/migrations/20260806120000_create_essential_word_skill_model.sql`

- [ ] **Step 1: Crear `learning_items`**

Una fila por habilidad. `schedule` es canónico; `due_at` y `schedule_kind` son espejos indexables. Mantener checks para `skill`, `content_origin` y proveedor.

- [ ] **Step 1b: Escribir la migración completa**

La migración crea las tres entidades. `attempt_logs` y `srs_review_events` son
inmutables: no conceden `update` ni `delete` al rol autenticado.

```sql
-- Essential Words skill model. One programmable item, one pedagogical
-- attempt, and zero or more SRS effects per attempt.

create table if not exists public.learning_items (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  skill text not null
    check (skill in ('meaning', 'listening', 'production', 'usage')),
  content_origin text not null
    check (content_origin in ('authored', 'generated', 'journal')),
  generator_provider text check (generator_provider in ('gemini')),
  payload jsonb,
  placement_inference jsonb,
  schedule jsonb not null,
  schedule_kind text not null
    check (schedule_kind in ('none', 'provisional', 'fsrs')),
  due_at timestamptz,
  last_review timestamptz,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  suspended boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint learning_items_inference_base_only
    check (placement_inference is null or skill <> 'usage'),
  constraint learning_items_payload_usage_only
    check (payload is null or skill = 'usage'),
  constraint learning_items_due_matches_schedule
    check (
      (schedule_kind = 'none' and due_at is null)
      or (schedule_kind <> 'none' and due_at is not null)
    )
);

create index if not exists learning_items_user_due_idx
  on public.learning_items (user_id, due_at)
  where schedule_kind <> 'none';

create index if not exists learning_items_user_word_idx
  on public.learning_items (user_id, word_id);

create table if not exists public.attempt_logs (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  word_id text not null,
  assessment jsonb not null,
  observations jsonb not null default '[]'::jsonb,
  event_type text not null check (
    event_type in ('practice', 'verification', 'scheduled-review', 'learning-step')
  ),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists attempt_logs_user_session_idx
  on public.attempt_logs (user_id, session_id, occurred_at);

create index if not exists attempt_logs_user_word_idx
  on public.attempt_logs (user_id, word_id, occurred_at desc);

create table if not exists public.srs_review_events (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_log_id text not null,
  learning_item_id text not null,
  grade text not null check (grade in ('Again', 'Hard', 'Good', 'Easy')),
  assessment jsonb not null,
  prior_schedule jsonb not null,
  resulting_schedule jsonb not null,
  fsrs_audit jsonb not null,
  affects_schedule boolean not null default true
    check (affects_schedule = true),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint srs_review_events_attempt_fk
    foreign key (user_id, attempt_log_id)
    references public.attempt_logs (user_id, id)
    on delete restrict,
  constraint srs_review_events_item_fk
    foreign key (user_id, learning_item_id)
    references public.learning_items (user_id, id)
    on delete restrict
);

create index if not exists srs_review_events_user_item_idx
  on public.srs_review_events (user_id, learning_item_id, occurred_at);

create index if not exists srs_review_events_user_attempt_idx
  on public.srs_review_events (user_id, attempt_log_id);

alter table public.learning_items enable row level security;
alter table public.attempt_logs enable row level security;
alter table public.srs_review_events enable row level security;

grant select, insert, update, delete on public.learning_items to authenticated;
grant select, insert on public.attempt_logs to authenticated;
grant select, insert on public.srs_review_events to authenticated;

create policy "learning_items_select_own"
  on public.learning_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "learning_items_insert_own"
  on public.learning_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "learning_items_update_own"
  on public.learning_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "learning_items_delete_own"
  on public.learning_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "attempt_logs_select_own"
  on public.attempt_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "attempt_logs_insert_own"
  on public.attempt_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "srs_review_events_select_own"
  on public.srs_review_events for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "srs_review_events_insert_own"
  on public.srs_review_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
```

Añadir tests o comprobaciones de migración para estas propiedades:

- un evento no puede referenciar un intento de otra cuenta;
- un evento no puede referenciar un ítem inexistente;
- los logs y eventos no se actualizan ni se eliminan por API cliente;
- repetir la migración no recrea índices ni policies con otro nombre;
- `due_at` y `schedule_kind` son espejos, no sustituyen `schedule`.

- [ ] **Step 2: Verificar `attempt_logs` contra el SQL canónico**

El bloque anterior es la implementación. Esta lista fija los campos que el test de migración debe encontrar:

```sql
id text not null,
user_id uuid not null references auth.users(id) on delete cascade,
session_id text not null,
word_id text not null,
assessment jsonb not null,
observations jsonb not null,
event_type text not null,
occurred_at timestamptz not null,
primary key (user_id, id)
```

Los intentos son append-only: RLS permite `select` e `insert`, no `update` ni `delete` desde cliente.

- [ ] **Step 3: Verificar `srs_review_events` contra el SQL canónico**

El test de migración debe comprobar al menos:

```sql
id text not null,
user_id uuid not null references auth.users(id) on delete cascade,
attempt_log_id text not null,
learning_item_id text not null,
grade text not null,
assessment jsonb not null,
prior_schedule jsonb not null,
resulting_schedule jsonb not null,
fsrs_audit jsonb not null,
occurred_at timestamptz not null,
primary key (user_id, id),
foreign key (user_id, attempt_log_id)
  references public.attempt_logs(user_id, id),
foreign key (user_id, learning_item_id)
  references public.learning_items(user_id, id)
```

Añadir índice por `(user_id, learning_item_id, occurred_at)` y unicidad por `(user_id, id)`. Un evento también es append-only.

- [ ] **Step 4: RLS y grants**

Seguir el patrón del repositorio con `(select auth.uid())`. Probar que:

- un usuario no lee ni inserta filas de otra cuenta;
- un evento no puede enlazar un intento ajeno;
- no existen policies de update para intentos/eventos.

- [ ] **Step 5: Validar migración y commit**

```bash
supabase db reset
pnpm type-check
git add supabase/migrations/20260806120000_create_essential_word_skill_model.sql
git commit -m "feat(db): persistir intentos y eventos SRS inmutables con RLS"
```

### Task 2.4: Registrar las tres tablas en el outbox de sincronización

**Files:**
- Modify: `lib/sync/types.ts`
- Modify: `lib/sync/handlers.ts` o el router equivalente
- Test: `lib/sync/__tests__/essential-word-skill-sync.test.ts`

- [ ] **Step 1: Añadir tablas**

```ts
type SyncTable =
  | ExistingTables
  | "learning_items"
  | "attempt_logs"
  | "srs_review_events";
```

- [ ] **Step 2: Orden causal**

Al sincronizar un bundle:

1. `learning_items` puede hacer upsert.
2. `attempt_logs` se inserta de forma idempotente por ID.
3. `srs_review_events` se inserta después de que exista su intento.

Un reintento nunca crea duplicados. Un fallo del evento mantiene la entrada en outbox sin volver a aplicar FSRS localmente.

- [ ] **Step 3: Tests**

- intento antes que evento;
- reintento idempotente;
- evento huérfano queda fallido y observable;
- no se mezclan cuentas;
- el outbox conserva el bundle completo tras error parcial remoto.

- [ ] **Step 4: Commit**

```bash
git add lib/sync/types.ts lib/sync/handlers.ts lib/sync/__tests__/essential-word-skill-sync.test.ts
git commit -m "feat(sync): sincronizar items intentos y eventos SRS en orden causal"
```

### Task 2.5: Capa de queries para ítems, intentos y eventos

**Files:**
- Create: `lib/essential-words/queries.ts`
- Test: `lib/essential-words/__tests__/queries.test.ts`

Ningún acceso a Supabase fuera de `lib/*/queries.ts`. Esta capa no decide pedagogía ni aplica FSRS.

- [ ] **Step 1: Lecturas**

```ts
getLearningItems(userId, wordIds?)
getDueLearningItems(userId, now)
getAttemptLogs(userId, filters)
getSrsReviewEvents(userId, learningItemId)
```

- [ ] **Step 1b: Fijar mapeadores y bundle de persistencia**

Los mapeadores son puros y no reciben los espejos desnormalizados como
parámetros. Los derivan siempre desde la fuente canónica.

```ts
export function toLearningItemRecord(
  item: LearningItem,
  userId: string,
  updatedAt: string,
): LearningItemRecord {
  return {
    ...item,
    userId,
    updatedAt,
    scheduleKind: item.schedule.kind,
    dueAt: item.schedule.kind === "none" ? undefined : item.schedule.dueAt,
  };
}

export function toAttemptLogRecord(
  attempt: AttemptLog,
  userId: string,
): AttemptLogRecord {
  return { ...attempt, userId, synced: false };
}

export function toSrsReviewEventRecord(
  event: SrsReviewEvent,
  userId: string,
): SrsReviewEventRecord {
  return { ...event, userId, synced: false };
}
```

El contrato de escritura usado por la Fase 3 debe agrupar las entidades; no
exponer tres funciones públicas que permitan persistir una parte del intento.

```ts
export interface AttemptPersistenceBundle {
  attempt: AttemptLog;
  events: SrsReviewEvent[];
  updatedItems: LearningItem[];
}

export async function saveAttemptBundle(
  userId: string,
  bundle: AttemptPersistenceBundle,
): Promise<void>;
```

Tests adicionales:

```ts
it("deriva dueAt y scheduleKind de schedule", () => { /* ... */ });
it("un schedule none no conserva un dueAt viejo", () => { /* ... */ });
it("mapea un intento sin asignarlo a un learningItem", () => { /* ... */ });
it("mapea dos eventos de un intento a dos learningItemId distintos", () => { /* ... */ });
it("rechaza un bundle con evento para otro attemptLogId", () => { /* ... */ });
it("rechaza un bundle con updatedItem sin evento correspondiente", () => { /* ... */ });
```

`fromLearningItemRow` debe considerar `schedule` como fuente de verdad. Si
`due_at` o `schedule_kind` no coinciden, debe devolver el objeto canónico y
emitir telemetría de inconsistencia; no debe reconstruir el calendario desde
los espejos.

- [ ] **Step 2: Escrituras primitivas**

Exponer helpers internos para la transacción local de la Fase 3:

```ts
putLearningItemsTx(tx, records)
putAttemptLogTx(tx, record)
putSrsReviewEventsTx(tx, records)
putOutboxEntriesTx(tx, entries)
```

No exponer una función que escriba un evento sin su intento.

- [ ] **Step 3: Mappers**

Mapear camelCase ↔ snake_case para las tres entidades. Validar que `schedule`, `dueAt` y `scheduleKind` coinciden antes de guardar.

- [ ] **Step 4: Tests**

- round-trip de cada entidad;
- `AttemptLog` sin evento es válido;
- N eventos de un intento conservan el mismo `attemptLogId`;
- escritura de otra cuenta se rechaza;
- un espejo `dueAt` inconsistente falla antes de persistir.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/queries.ts lib/essential-words/__tests__/queries.test.ts
git commit -m "feat(essential-words): queries para items intentos y eventos SRS"
```

### Task 2.6: Migración `SRSData` → `LearningItem`, idempotente y conservadora

**Files:**
- Create: `lib/essential-words/migrate-to-skill-model.ts`
- Test: `lib/essential-words/__tests__/migrate-to-skill-model.test.ts`

- [ ] **Step 1: Verificar la firma real de `deriveFsrsState` antes de escribir nada**

Run: `grep -n "export function deriveFsrsState" -A 8 lib/srs/fsrs-migrate.ts`
Anotar los nombres exactos de los campos devueltos: el paso 4 los usa.

- [ ] **Step 2: Escribir el test**

```ts
// lib/essential-words/__tests__/migrate-to-skill-model.test.ts
import { describe, it, expect } from "vitest";
import { planSkillModelMigration } from "../migrate-to-skill-model";
import { srsMigrationSet, srsFsrs, srsLegacySm2 } from "./fixtures/srs-fixtures";

const NOW = new Date("2026-08-06T10:00:00.000Z");

describe("planSkillModelMigration", () => {
  it("crea tres habilidades base por palabra", () => {
    const items = planSkillModelMigration([srsFsrs("not")], [], NOW);
    const skills = items.filter((i) => i.wordId === "c1k:not").map((i) => i.skill).sort();
    expect(skills).toEqual(["listening", "meaning", "production"]);
  });

  it("meaning hereda el estado FSRS tal cual: no se reinician intervalos", () => {
    const source = srsFsrs("not");
    const items = planSkillModelMigration([source], [], NOW);
    const meaning = items.find((i) => i.skill === "meaning")!;
    expect(meaning.schedule).toEqual({
      kind: "fsrs",
      dueAt: source.nextReview,
      stability: source.stability,
      difficulty: source.difficulty,
      state: source.state,
    });
    expect(meaning.repetitions).toBe(source.repetitions);
  });

  it("listening y production nacen sin programar (spec 1.12)", () => {
    const items = planSkillModelMigration([srsFsrs("not")], [], NOW);
    for (const skill of ["listening", "production"] as const) {
      expect(items.find((i) => i.skill === skill)!.schedule).toEqual({ kind: "none" });
    }
  });

  it("deriva estado FSRS para filas SM-2 sin stability", () => {
    const items = planSkillModelMigration([srsLegacySm2("the")], [], NOW);
    const meaning = items.find((i) => i.skill === "meaning")!;
    expect(meaning.schedule.kind).toBe("fsrs");
    if (meaning.schedule.kind === "fsrs") {
      expect(meaning.schedule.stability).toBeGreaterThan(0);
      expect(meaning.schedule.state).toBe("Review");
    }
  });

  it("una fila sin repasos queda en state New", () => {
    const items = planSkillModelMigration([{ ...srsLegacySm2("x"), repetitions: 0 }], [], NOW);
    const meaning = items.find((i) => i.skill === "meaning")!;
    expect(meaning.schedule.kind === "fsrs" && meaning.schedule.state).toBe("New");
  });

  it("es idempotente: no duplica lo ya migrado (invariante 18)", () => {
    const source = srsMigrationSet();
    const first = planSkillModelMigration(source, [], NOW);
    const second = planSkillModelMigration(source, first, NOW);
    expect(second).toHaveLength(0);
  });

  it("es idempotente parcialmente: solo crea lo que falta", () => {
    const source = srsMigrationSet();
    const first = planSkillModelMigration(source, [], NOW);
    const partial = first.filter((i) => i.skill !== "listening");
    const second = planSkillModelMigration(source, partial, NOW);
    expect(second.every((i) => i.skill === "listening")).toBe(true);
    expect(second).toHaveLength(source.length);
  });

  it("ignora SRSData que no sean de essential-words", () => {
    const foreign = { ...srsFsrs("not"), wordId: "frag:123" };
    expect(planSkillModelMigration([foreign], [], NOW)).toHaveLength(0);
  });

  it("nunca persiste mature ni status (invariante 19)", () => {
    const items = planSkillModelMigration(srsMigrationSet(), [], NOW);
    for (const item of items) {
      expect(item).not.toHaveProperty("mature");
      expect(item).not.toHaveProperty("status");
    }
  });
});
```

- [ ] **Step 3: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/migrate-to-skill-model.test.ts`
Expected: FAIL — "Cannot find module '../migrate-to-skill-model'".

- [ ] **Step 4: Implementar**

`planSkillModelMigration` es **pura**: recibe origen y destino actual, devuelve lo que falta. Eso hace la idempotencia testeable sin Dexie y deja el I/O en un llamante trivial.

```ts
// lib/essential-words/migrate-to-skill-model.ts
// Migracion SRSData -> LearningItem (spec 1.12). Pura e idempotente: devuelve
// SOLO los items que faltan, de modo que ejecutarla dos veces no crea
// duplicados (invariante 18).
//
// Conservadora: no borra ni modifica ningun SRSData. La retirada del modelo
// viejo es la Fase 10, y solo tras rollout y sincronizacion verificados.

import { deriveFsrsState } from "@/lib/srs/fsrs-migrate";
import { learningItemId } from "./skill-item";
import type { LearningItem, ItemSchedule, Skill } from "./verification/types";
import type { SRSData } from "@/lib/types";

const BASE_SKILLS: readonly Skill[] = ["meaning", "listening", "production"];
const ESSENTIAL_PREFIX = "c1k:";

/** Estado FSRS del SRSData, derivandolo si la fila es SM-2 pura. */
function scheduleFromSrsData(source: SRSData, now: Date): ItemSchedule {
  if (
    source.stability !== undefined
    && source.difficulty !== undefined
    && source.state !== undefined
  ) {
    return {
      kind: "fsrs",
      dueAt: source.nextReview,
      stability: source.stability,
      difficulty: source.difficulty,
      state: source.state,
    };
  }

  const derived = deriveFsrsState(source, now);
  return {
    kind: "fsrs",
    dueAt: source.nextReview,
    stability: derived.stability,
    difficulty: derived.difficulty,
    state: source.repetitions > 0 ? "Review" : "New",
  };
}

/**
 * Devuelve los LearningItem que hay que crear. `existing` son los ya
 * presentes; todo lo que ya existe se omite sin tocarlo.
 */
export function planSkillModelMigration(
  srsEntries: SRSData[],
  existing: LearningItem[],
  now: Date,
): LearningItem[] {
  const present = new Set(existing.map((item) => item.id));
  const created: LearningItem[] = [];

  for (const source of srsEntries) {
    if (!source.wordId.startsWith(ESSENTIAL_PREFIX)) continue;

    for (const skill of BASE_SKILLS) {
      const id = learningItemId(source.wordId, skill);
      if (present.has(id)) continue;

      const isMeaning = skill === "meaning";
      created.push({
        id,
        wordId: source.wordId,
        skill,
        contentOrigin: "authored",
        // Solo `meaning` hereda el progreso: es la habilidad que el modelo
        // viejo estaba midiendo de facto. Inventar programacion para
        // listening/production seria fabricar evidencia inexistente.
        schedule: isMeaning ? scheduleFromSrsData(source, now) : { kind: "none" },
        lastReview: isMeaning ? source.lastReview : undefined,
        repetitions: isMeaning ? source.repetitions : 0,
        lapses: 0,
        suspended: false,
      });
      present.add(id);
    }
  }

  return created;
}
```

- [ ] **Step 5: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/migrate-to-skill-model.test.ts`
Expected: PASS (9 tests). Si `deriveFsrsState` devuelve otros nombres de campo, ajustar `scheduleFromSrsData` según lo anotado en el paso 1.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/migrate-to-skill-model.ts lib/essential-words/__tests__/migrate-to-skill-model.test.ts
git commit -m "feat(essential-words): migracion idempotente de SRSData a LearningItem"
```

### Task 2.7: Ejecutor de la migración con escritura transaccional

**Files:**
- Create: `lib/essential-words/run-skill-model-migration.ts`
- Test: `lib/essential-words/__tests__/run-skill-model-migration.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/run-skill-model-migration.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runSkillModelMigration } from "../run-skill-model-migration";
import { srsMigrationSet } from "./fixtures/srs-fixtures";

const store = { items: [] as unknown[], srs: srsMigrationSet() };

vi.mock("@/lib/db", () => ({
  db: {
    learningItems: {
      where: () => ({ equals: () => ({ toArray: async () => store.items }) }),
      bulkPut: async (rows: unknown[]) => { store.items.push(...rows); },
    },
    srsData: {
      where: () => ({ equals: () => ({ toArray: async () => store.srs }) }),
    },
    transaction: async (_mode: string, _table: unknown, fn: () => Promise<void>) => fn(),
  },
}));

describe("runSkillModelMigration", () => {
  beforeEach(() => { store.items = []; });

  it("no migra a ciegas sin userId", async () => {
    const result = await runSkillModelMigration(undefined, new Date());
    expect(result).toEqual({ created: 0, skipped: true });
    expect(store.items).toHaveLength(0);
  });

  it("crea tres ítems por palabra", async () => {
    const result = await runSkillModelMigration("user-1", new Date("2026-08-06T10:00:00.000Z"));
    expect(result.created).toBe(9); // 3 palabras × 3 habilidades
    expect(store.items).toHaveLength(9);
  });

  it("es idempotente end-to-end: la segunda pasada no crea nada", async () => {
    await runSkillModelMigration("user-1", new Date("2026-08-06T10:00:00.000Z"));
    const second = await runSkillModelMigration("user-1", new Date("2026-08-06T10:00:00.000Z"));
    expect(second.created).toBe(0);
    expect(store.items).toHaveLength(9);
  });

  it("no borra ningún SRSData (migración conservadora)", async () => {
    await runSkillModelMigration("user-1", new Date("2026-08-06T10:00:00.000Z"));
    expect(store.srs).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/run-skill-model-migration.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/run-skill-model-migration.ts
// Ejecutor de la migracion. Toda la logica de decision vive en la funcion
// pura `planSkillModelMigration`; aqui solo hay I/O.

import { db } from "@/lib/db";
import { planSkillModelMigration } from "./migrate-to-skill-model";
import { toLearningItemRecord } from "./queries";
import type { LearningItem } from "./verification/types";
import type { SRSData } from "@/lib/types";

export interface SkillModelMigrationResult {
  created: number;
  skipped: boolean;
}

/**
 * Idempotente y conservadora: lee lo que ya existe, crea solo lo que falta y
 * NO toca los SRSData de origen. La escritura va en una transaccion para que
 * una interrupcion no deje una palabra con una habilidad de tres.
 */
export async function runSkillModelMigration(
  userId: string | undefined,
  now: Date,
): Promise<SkillModelMigrationResult> {
  if (!userId) return { created: 0, skipped: true };

  const [srsEntries, existing] = await Promise.all([
    db.srsData.where("userId").equals(userId).toArray() as Promise<SRSData[]>,
    db.learningItems.where("userId").equals(userId).toArray() as Promise<LearningItem[]>,
  ]);

  const toCreate = planSkillModelMigration(srsEntries, existing, now);
  if (toCreate.length === 0) return { created: 0, skipped: false };

  const updatedAt = now.toISOString();
  const records = toCreate.map((item) => toLearningItemRecord(item, userId, updatedAt));

  await db.transaction("rw", db.learningItems, async () => {
    await db.learningItems.bulkPut(records);
  });

  return { created: toCreate.length, skipped: false };
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/run-skill-model-migration.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Verificar la fase completa**

Run: `pnpm test lib/essential-words lib/db lib/sync && pnpm type-check && pnpm lint`
Expected: PASS. Con el flag apagado, ninguna ruta de la app llama todavía a este código, así que los tests de caracterización de la Fase 0 siguen verdes sin modificarse.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/run-skill-model-migration.ts lib/essential-words/__tests__/run-skill-model-migration.test.ts
git commit -m "feat(essential-words): ejecutor transaccional de la migracion al modelo de habilidades"
```

---

## Fase 3 — Eventos, observaciones y FSRS

**Objetivo:** que un intento produzca `AttemptAssessment` → observaciones → colocaciones → un `AttemptLog` y cero o más `SrsReviewEvent`, y que la escritura local de intento, eventos, ítems y outbox sea atómica.

**Condición de salida:** invariantes 1, 2, 3, 12, 13, 16, 24 verdes. Un test demuestra que un evento de práctica no mueve el calendario ni alimenta el optimizador, y el umbral global de 25 s ha dejado de decidir el escalón `Easy`/`Good` en la ruta nueva (3.7).

### Task 3.1: `AttemptOutcome` → `AttemptAssessment`

**Files:**
- Create: `lib/essential-words/verification/assessment.ts`
- Test: `lib/essential-words/verification/__tests__/assessment.test.ts`

`attemptGrade` permanece intacto para la ruta vieja. El modelo nuevo añade modalidad, duración total y señales necesarias para filtrar muestras asistidas.

- [ ] **Step 1: Definir la firma**

```ts
export interface AssessmentContext {
  interactionDurationMs: number;
  freeAudioReplays?: number;
}

export function buildAssessment(
  outcome: AttemptOutcome,
  modality: AttemptModality,
  context: AssessmentContext,
): AttemptAssessment;
```

- [ ] **Step 2: Implementar**

```ts
export function buildAssessment(
  outcome: AttemptOutcome,
  modality: AttemptModality,
  context: AssessmentContext,
): AttemptAssessment {
  return {
    grade: attemptGrade(outcome),
    modality,
    correct: outcome.correct || outcome.typo,
    latencyMs: outcome.latencyMs,
    interactionDurationMs: Math.max(
      context.interactionDurationMs,
      outcome.latencyMs,
    ),
    usedHints: outcome.hintsUsed > 0,
    rescued: outcome.rescued,
    acceptedVariant: outcome.typo,
    firstTryFailed: outcome.firstTryFailed,
    freeAudioReplays: context.freeAudioReplays ?? 0,
  };
}
```

- [ ] **Step 3: Tests**

- conserva grade base;
- modalidad viaja con el intento;
- duración total nunca es menor que latencia;
- typo marca correcto y variante aceptada;
- respuesta revelada o primer fallo no puede ser Easy/Good;
- replay gratuito se conserva para calibración, pero no cuenta como pista de pago;
- `firstTryFailed` se conserva explícitamente.

- [ ] **Step 4: Commit**

```bash
pnpm test lib/essential-words/verification/__tests__/assessment.test.ts
pnpm type-check
git add lib/essential-words/verification/assessment.ts lib/essential-words/verification/__tests__/assessment.test.ts
git commit -m "feat(essential-words): assessment conserva modalidad duracion y asistencia"
```

### Task 3.2: `deriveObservations`

**Files:**
- Create: `lib/essential-words/verification/policy.ts`
- Test: `lib/essential-words/verification/__tests__/observations.test.ts`

- [ ] **Step 1: Escribir el test**

Este es el test que cierra el agujero de la revisión: un fallo debe observar **las mismas habilidades** que un acierto, con signo opuesto.

```ts
// lib/essential-words/verification/__tests__/observations.test.ts
import { describe, it, expect } from "vitest";
import { deriveObservations } from "../policy";
import type { AttemptAssessment, AttemptModality } from "../types";

const assess = (
  modality: AttemptModality,
  correct: boolean,
): AttemptAssessment => ({
  grade: correct ? "Good" : "Again",
  modality, correct,
  latencyMs: 3_000, interactionDurationMs: 9_000,
  usedHints: false, rescued: false, acceptedVariant: false,
  firstTryFailed: false, freeAudioReplays: 0,
});

const NOW = new Date("2026-08-06T10:00:00.000Z");

const skillsOf = (a: AttemptAssessment) =>
  deriveObservations(a, NOW).map((o) => o.skill).sort();

describe("deriveObservations — qué habilidades evaluó el intento", () => {
  it("producción observa meaning y production", () => {
    expect(skillsOf(assess("production", true))).toEqual(["meaning", "production"]);
  });

  it("escucha observa meaning y listening", () => {
    expect(skillsOf(assess("listening", true))).toEqual(["listening", "meaning"]);
  });

  it("reconocimiento observa solo meaning", () => {
    expect(skillsOf(assess("recognition", true))).toEqual(["meaning"]);
  });

  it("pronunciación observa production, nunca listening (invariante 16)", () => {
    const skills = skillsOf(assess("pronunciation", true));
    expect(skills).toEqual(["production"]);
    expect(skills).not.toContain("listening");
  });

  it("una prueba textual nunca acredita listening (invariante 1)", () => {
    for (const modality of ["production", "recognition"] as const) {
      expect(skillsOf(assess(modality, true))).not.toContain("listening");
    }
  });

  it("una prueba auditiva nunca acredita production (invariante 2)", () => {
    expect(skillsOf(assess("listening", true))).not.toContain("production");
  });
});

describe("deriveObservations — signo", () => {
  it("una respuesta correcta da outcome success", () => {
    const obs = deriveObservations(assess("production", true), NOW);
    expect(obs.every((o) => o.outcome === "success")).toBe(true);
  });

  it("un fallo observa LAS MISMAS habilidades, con failure (invariante 24)", () => {
    const ok = skillsOf(assess("production", true));
    const ko = skillsOf(assess("production", false));
    expect(ko).toEqual(ok);
    expect(deriveObservations(assess("production", false), NOW)
      .every((o) => o.outcome === "failure")).toBe(true);
  });

  it("un fallo de producción sigue sin observar listening", () => {
    expect(skillsOf(assess("production", false))).not.toContain("listening");
  });

  it("un Again nunca deja la lista vacía: derivePlacements tiene contrato", () => {
    expect(deriveObservations(assess("listening", false), NOW)).toHaveLength(2);
  });
});

describe("deriveObservations — procedencia", () => {
  it("marca source direct y basis attempt con su modalidad", () => {
    const [first] = deriveObservations(assess("listening", true), NOW);
    expect(first.source).toBe("direct");
    expect(first.basis).toEqual({ kind: "attempt", modality: "listening" });
  });

  it("la evidencia directa tiene confianza 1", () => {
    expect(deriveObservations(assess("production", true), NOW)[0].evidenceConfidence).toBe(1);
  });

  it("observedAt viene del reloj inyectado, no de la hora del sistema", () => {
    const [first] = deriveObservations(assess("production", true), NOW);
    expect(first.observedAt).toBe(NOW.toISOString());
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/verification/__tests__/observations.test.ts`
Expected: FAIL — "Cannot find module '../policy'".

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/verification/policy.ts
// Dos pasos, nunca uno (spec 3.2):
//   1. deriveObservations — QUE evaluo el intento. Lo decide la MODALIDAD.
//      Con que signo, lo decide el acierto.
//   2. derivePlacements   — DONDE queda cada habilidad. Lo decide el GRADE.
//
// Colapsarlos fue el error del modelo anterior, y hace que `learning` se lea
// como "no hubo evidencia" cuando en realidad si la hubo.

import type {
  AttemptAssessment, AttemptModality, Skill, SkillObservation,
} from "./types";

/**
 * Que habilidades evalua cada modalidad. La tabla NO depende del resultado:
 * una produccion fallida evalua exactamente lo mismo que una correcta.
 */
const OBSERVED_SKILLS: Record<AttemptModality, readonly Skill[]> = {
  production: ["meaning", "production"],
  listening: ["meaning", "listening"],
  recognition: ["meaning"],
  // `pronunciation` acredita produccion, nunca escucha por si sola: repetir
  // un audio no demuestra haberlo comprendido (invariante 16).
  pronunciation: ["production"],
};

/**
 * Recibe el reloj en vez de llamar a `new Date()`: la simulacion de carga
 * (Fase 8) inyecta el suyo, y una funcion que consulta la hora del sistema no
 * es simulable ni testeable de forma determinista.
 */
export function deriveObservations(
  assessment: AttemptAssessment,
  now: Date,
): SkillObservation[] {
  const outcome = assessment.correct ? "success" : "failure";
  const observedAt = now.toISOString();

  return OBSERVED_SKILLS[assessment.modality].map((skill) => ({
    skill,
    outcome,
    source: "direct",
    basis: { kind: "attempt", modality: assessment.modality },
    evidenceConfidence: 1,
    observedAt,
  }));
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/verification/__tests__/observations.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/verification/policy.ts lib/essential-words/verification/__tests__/observations.test.ts
git commit -m "feat(essential-words): deriveObservations con signo, determinado por modalidad"
```

### Task 3.3: Intervalos provisionales deterministas

**Files:**
- Create: `lib/essential-words/verification/provisional-intervals.ts`
- Test: `lib/essential-words/verification/__tests__/provisional-intervals.test.ts`

Lo necesita `derivePlacements` (3.4) y también la colocación por bandas (Fase 6), así que va en su propio módulo.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/verification/__tests__/provisional-intervals.test.ts
import { describe, it, expect } from "vitest";
import {
  provisionalDueAt, PROVISIONAL_WINDOWS,
} from "../provisional-intervals";

const NOW = new Date("2026-08-06T10:00:00.000Z");
const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 86_400_000);

describe("provisionalDueAt", () => {
  it("verificación directa Easy cae en la ventana 14-30 días", () => {
    const due = provisionalDueAt("direct-easy", "c1k:on#meaning", NOW);
    const days = daysBetween(NOW, due);
    expect(days).toBeGreaterThanOrEqual(PROVISIONAL_WINDOWS["direct-easy"].minDays);
    expect(days).toBeLessThanOrEqual(PROVISIONAL_WINDOWS["direct-easy"].maxDays);
  });

  it("la inferencia de banda usa una ventana más corta que la evidencia directa", () => {
    // La evidencia directa es más fuerte que "conoce el 85% de esta banda".
    expect(PROVISIONAL_WINDOWS["inference"].maxDays)
      .toBeLessThan(PROVISIONAL_WINDOWS["direct-easy"].maxDays);
  });

  it("Good cae en el extremo bajo de la ventana de Easy", () => {
    expect(PROVISIONAL_WINDOWS["direct-good"].maxDays)
      .toBeLessThanOrEqual(PROVISIONAL_WINDOWS["direct-easy"].maxDays);
  });

  it("es determinista: mismo ítem y mismo origen dan la misma fecha (invariante 17)", () => {
    const a = provisionalDueAt("direct-easy", "c1k:on#meaning", NOW);
    const b = provisionalDueAt("direct-easy", "c1k:on#meaning", NOW);
    expect(a.toISOString()).toBe(b.toISOString());
  });

  it("distribuye: distintos ítems no caen todos el mismo día", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `c1k:w${i}#meaning`);
    const days = new Set(ids.map((id) => daysBetween(NOW, provisionalDueAt("inference", id, NOW))));
    // Con 40 ítems sobre una ventana de 15 días, esperamos buena dispersión.
    expect(days.size).toBeGreaterThanOrEqual(8);
  });

  it("no usa Math.random: dos procesos distintos coinciden", () => {
    const first = provisionalDueAt("inference", "c1k:the#listening", NOW).toISOString();
    // Simula otra ejecución: mismo input, sin estado compartido.
    const second = provisionalDueAt("inference", "c1k:the#listening", NOW).toISOString();
    expect(first).toBe(second);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/verification/__tests__/provisional-intervals.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/verification/provisional-intervals.ts
// Fechas provisionales deterministas (spec 3.6). Nada de Math.random: la
// fecha es funcion del itemId, para que sea testeable y para repartir
// vencimientos en lugar de amontonarlos (invariante 17).

export type ProvisionalOrigin = "direct-easy" | "direct-good" | "inference";

export interface ProvisionalWindow {
  minDays: number;
  maxDays: number;
}

/**
 * Ventanas PROVISIONALES en el doble sentido: programan un provisional, y sus
 * valores se calibran en la Fase 8 (spec 10, decision 2).
 *
 * La evidencia directa es mas fuerte que una inferencia estadistica, asi que
 * no reciben la misma colocacion.
 */
export const PROVISIONAL_WINDOWS: Record<ProvisionalOrigin, ProvisionalWindow> = {
  "direct-easy": { minDays: 14, maxDays: 30 },
  "direct-good": { minDays: 14, maxDays: 21 },
  inference: { minDays: 7, maxDays: 21 },
};

const DAY_MS = 86_400_000;

/** Hash estable de string a entero no negativo. */
function hash(value: string): number {
  let h = 0;
  for (const char of value) h = (h * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Fecha de vencimiento dentro de la ventana del origen, distribuida de forma
 * determinista por `itemId`.
 */
export function provisionalDueAt(
  origin: ProvisionalOrigin,
  itemId: string,
  now: Date,
): Date {
  const { minDays, maxDays } = PROVISIONAL_WINDOWS[origin];
  const span = maxDays - minDays + 1;
  const days = minDays + (hash(itemId) % span);
  return new Date(now.getTime() + days * DAY_MS);
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/verification/__tests__/provisional-intervals.test.ts`
Expected: PASS (6 tests).

```bash
git add lib/essential-words/verification/provisional-intervals.ts lib/essential-words/verification/__tests__/provisional-intervals.test.ts
git commit -m "feat(essential-words): fechas provisionales deterministas y distribuidas"
```

### Task 3.4: `derivePlacements`

**Files:**
- Modify: `lib/essential-words/verification/policy.ts`
- Test: `lib/essential-words/verification/__tests__/placements.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/verification/__tests__/placements.test.ts
import { describe, it, expect } from "vitest";
import { deriveObservations, derivePlacements } from "../policy";
import type { AttemptAssessment, AttemptModality, LearningItem } from "../types";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const assess = (
  modality: AttemptModality,
  grade: AttemptAssessment["grade"],
): AttemptAssessment => ({
  grade, modality, correct: grade !== "Again",
  latencyMs: 3_000, interactionDurationMs: 9_000,
  usedHints: grade === "Hard", rescued: false, acceptedVariant: false,
  firstTryFailed: grade === "Again", freeAudioReplays: 0,
});

const unseen = (skill: LearningItem["skill"]): LearningItem => ({
  id: `c1k:on#${skill}`, wordId: "c1k:on", skill,
  contentOrigin: "authored", schedule: { kind: "none" },
  repetitions: 0, lapses: 0, suspended: false,
});

const place = (a: AttemptAssessment, items = [unseen("meaning"), unseen("production")]) =>
  derivePlacements(deriveObservations(a, NOW), a, items, NOW);

describe("derivePlacements — verificación directa de producción", () => {
  it("Easy coloca ambas habilidades como provisionales", () => {
    const placements = place(assess("production", "Easy"));
    expect(placements).toHaveLength(2);
    expect(placements.every((p) => p.schedule.kind === "provisional")).toBe(true);
    expect(placements.every((p) => p.verificationSource === "direct")).toBe(true);
  });

  it("Good deja meaning provisional y production en learning", () => {
    const placements = place(assess("production", "Good"));
    const meaning = placements.find((p) => p.skill === "meaning")!;
    const production = placements.find((p) => p.skill === "production")!;
    expect(meaning.schedule.kind).toBe("provisional");
    expect(production.schedule.kind).toBe("fsrs");
  });

  it("Hard coloca production en learning", () => {
    const production = place(assess("production", "Hard")).find((p) => p.skill === "production")!;
    expect(production.schedule.kind).toBe("fsrs");
  });

  it("Again coloca AMBAS en learning, sin reinterpretar la modalidad", () => {
    const placements = place(assess("production", "Again"));
    expect(placements).toHaveLength(2);
    expect(placements.every((p) => p.schedule.kind === "fsrs")).toBe(true);
    expect(placements.map((p) => p.skill).sort()).toEqual(["meaning", "production"]);
  });

  it("nunca coloca listening desde una prueba escrita (invariante 1)", () => {
    for (const grade of ["Easy", "Good", "Hard", "Again"] as const) {
      expect(place(assess("production", grade)).map((p) => p.skill)).not.toContain("listening");
    }
  });
});

describe("derivePlacements — prueba auditiva", () => {
  const items = [unseen("meaning"), unseen("listening")];

  it("Easy coloca meaning y listening como provisionales", () => {
    const placements = place(assess("listening", "Easy"), items);
    expect(placements.every((p) => p.schedule.kind === "provisional")).toBe(true);
  });

  it("Hard deja listening en learning", () => {
    const listening = place(assess("listening", "Hard"), items)
      .find((p) => p.skill === "listening")!;
    expect(listening.schedule.kind).toBe("fsrs");
  });

  it("nunca coloca production (invariante 2)", () => {
    for (const grade of ["Easy", "Good", "Hard", "Again"] as const) {
      expect(place(assess("listening", grade), items).map((p) => p.skill))
        .not.toContain("production");
    }
  });
});

describe("derivePlacements — reglas transversales", () => {
  it("no coloca una habilidad que no fue observada", () => {
    const placements = place(assess("recognition", "Easy"), [unseen("meaning"), unseen("listening")]);
    expect(placements.map((p) => p.skill)).toEqual(["meaning"]);
  });

  it("un ítem ya en FSRS no se degrada a provisional (spec 1.6)", () => {
    const mature: LearningItem = {
      ...unseen("meaning"),
      schedule: { kind: "fsrs", dueAt: "2026-09-01T00:00:00.000Z", stability: 30, difficulty: 5, state: "Review" },
    };
    const placements = place(assess("production", "Easy"), [mature, unseen("production")]);
    const meaning = placements.find((p) => p.skill === "meaning")!;
    // Un provisional es más débil que un FSRS real: no puede sobrescribirlo.
    expect(meaning.schedule.kind).toBe("fsrs");
  });

  it("una colocación provisional nunca produce un ítem maduro (invariante 4)", () => {
    // Sobre ítems SIN historial: un Easy los deja provisionales, que por
    // construcción no pueden ser maduros (isMature exige schedule.kind fsrs).
    const placements = place(assess("production", "Easy"));
    expect(placements.every((p) => p.schedule.kind === "provisional")).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/verification/__tests__/placements.test.ts`
Expected: FAIL — `derivePlacements` no exportado.

- [ ] **Step 3: Implementar en `policy.ts`**

Los dos primeros `import` son nuevos. El tercero **amplía** el `import type`
que la tarea 3.2 ya creó: añade `ItemSchedule`, `LearningItem` y
`SkillPlacement` a esa línea en vez de escribir un segundo `import` del mismo
módulo.

```ts
import { scheduleFsrsReview } from "@/lib/srs/fsrs-schedule";
import { provisionalDueAt, type ProvisionalOrigin } from "./provisional-intervals";
// Línea existente de la tarea 3.2, ampliada:
import type {
  AttemptAssessment, AttemptModality, ItemSchedule, LearningItem,
  Skill, SkillObservation, SkillPlacement,
} from "./types";

/** Estado FSRS inicial de una habilidad que arranca en aprendizaje. */
const INITIAL_FSRS = { stability: 0, difficulty: 0, state: "New" as const };

/**
 * Paso 2: donde queda cada habilidad OBSERVADA. Lo decide el grade.
 *
 * No mira `assessment.modality` para elegir a quien colocar: eso ya lo
 * resolvio `deriveObservations`. Colocar exactamente lo observado es lo que
 * mantiene separadas las dos responsabilidades.
 */
export function derivePlacements(
  observations: SkillObservation[],
  assessment: AttemptAssessment,
  currentItems: LearningItem[],
  now: Date,
): SkillPlacement[] {
  const bySkill = new Map(currentItems.map((item) => [item.skill, item]));

  return observations.map((observation) => {
    const current = bySkill.get(observation.skill);
    const itemId = current?.id ?? `${observation.skill}`;

    return {
      skill: observation.skill,
      schedule: scheduleForObservation(observation, assessment, current, itemId, now),
      verificationSource: observation.source === "placement-inference"
        ? "placement-inference"
        : "direct",
    };
  });
}

function scheduleForObservation(
  observation: SkillObservation,
  assessment: AttemptAssessment,
  current: LearningItem | undefined,
  itemId: string,
  now: Date,
): ItemSchedule {
  const alreadyScheduled = current && current.schedule.kind === "fsrs";

  // Un provisional es evidencia mas debil que una tarjeta FSRS real: nunca
  // puede sobrescribirla. Si el item ya tiene historial, se le aplica el
  // grade normalmente.
  if (alreadyScheduled || observation.outcome === "failure") {
    const base = current?.schedule.kind === "fsrs" ? current.schedule : INITIAL_FSRS;
    const next = scheduleFsrsReview({
      stability: base.stability,
      difficulty: base.difficulty,
      state: base.state,
      grade: assessment.grade,
      now,
    });
    return {
      kind: "fsrs",
      dueAt: next.dueAt.toISOString(),
      stability: next.stability,
      difficulty: next.difficulty,
      state: next.state,
    };
  }

  const origin = provisionalOrigin(observation, assessment);
  if (!origin) {
    // Observacion positiva pero con grade que no merece provisional (Hard,
    // o Good en la habilidad principal): entra en aprendizaje normal.
    const next = scheduleFsrsReview({ ...INITIAL_FSRS, grade: assessment.grade, now });
    return {
      kind: "fsrs",
      dueAt: next.dueAt.toISOString(),
      stability: next.stability,
      difficulty: next.difficulty,
      state: next.state,
    };
  }

  return {
    kind: "provisional",
    dueAt: provisionalDueAt(origin, itemId, now).toISOString(),
    source: observation.source === "placement-inference" ? "placement-inference" : "direct",
    evidenceConfidence: observation.evidenceConfidence,
  };
}

/**
 * Que ventana provisional corresponde, o null si la habilidad debe entrar en
 * aprendizaje normal (spec 3.3 y 3.4).
 *
 * `meaning` es mas permisiva que la habilidad principal del ejercicio: un
 * Good en produccion demuestra que el significado esta solido aunque la
 * produccion no lo este.
 */
function provisionalOrigin(
  observation: SkillObservation,
  assessment: AttemptAssessment,
): ProvisionalOrigin | null {
  if (observation.source === "placement-inference") return "inference";
  if (assessment.grade === "Easy") return "direct-easy";

  const isSupportSkill = observation.skill === "meaning" && assessment.modality !== "recognition";
  if (assessment.grade === "Good") {
    return isSupportSkill ? "direct-good" : null;
  }
  // Hard: solo `meaning` conserva un provisional corto.
  if (assessment.grade === "Hard" && isSupportSkill) return "direct-good";
  return null;
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/verification/__tests__/placements.test.ts`
Expected: PASS (11 tests). Si alguna expectativa de ventana no encaja, ajustar `provisionalOrigin` — la tabla de la spec §3.3/§3.4 es la referencia, no el código.

- [ ] **Step 5: Verificar el tamaño de `policy.ts`**

Run: `wc -l lib/essential-words/verification/policy.ts`
Expected: <250. Si lo supera, mover `scheduleForObservation` y `provisionalOrigin` a `verification/placement-rules.ts` y reejecutar los tests.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/verification/policy.ts lib/essential-words/verification/__tests__/placements.test.ts
git commit -m "feat(essential-words): derivePlacements sobre observaciones, decidido por grade"
```

### Task 3.5: Plan y escritura atómica de intento + N eventos SRS

**Files:**
- Create: `lib/essential-words/record-attempt.ts`
- Test: `lib/essential-words/__tests__/record-attempt.test.ts`
- Integration test: `lib/essential-words/__tests__/persist-attempt-record.test.ts`

Esta es la única ruta autorizada a aplicar FSRS en el modelo nuevo.

- [ ] **Step 1: Definir el plan puro**

```ts
export interface AttemptRecordInput {
  wordId: string;
  sessionId: string;
  assessment: AttemptAssessment;
  eventType: AttemptEventType;
  currentItems: LearningItem[];
}

export interface AttemptRecordPlan {
  attemptLog: AttemptLog;
  srsEvents: SrsReviewEvent[];
  updatedItems: LearningItem[];
}

export function planAttemptRecord(
  input: AttemptRecordInput,
  context: ExecutionContext,
): AttemptRecordPlan;
```

Reglas:

- siempre crea exactamente un `AttemptLog`;
- `practice` y `learning-step` crean cero eventos y cero cambios de schedule;
- `verification` y `scheduled-review` crean un evento por cada `LearningItem` actualizado;
- cada evento conserva `priorSchedule` y `resultingSchedule`;
- los IDs vienen de `context.newId()`;
- `occurredAt` viene de `context.now`;
- nunca usa `currentItems[0]` para atribuir un efecto.

- [ ] **Step 1b: Escribir primero el test del plan puro**

```ts
// lib/essential-words/__tests__/record-attempt.test.ts
import { describe, expect, it } from "vitest";
import { planAttemptRecord } from "../record-attempt";
import type {
  AttemptAssessment,
  LearningItem,
} from "../verification/types";

const NOW = new Date("2026-08-06T10:00:00.000Z");
const ids = ["attempt-1", "event-1", "event-2"];
const context = {
  now: NOW,
  newId: () => {
    const id = ids.shift();
    if (!id) throw new Error("test exhausted ids");
    return id;
  },
};

const assessment = (
  grade: AttemptAssessment["grade"] = "Easy",
): AttemptAssessment => ({
  grade,
  modality: "production",
  correct: grade !== "Again",
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: grade === "Hard",
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
});

const item = (skill: "meaning" | "production"): LearningItem => ({
  id: `c1k:on#${skill}`,
  wordId: "c1k:on",
  skill,
  contentOrigin: "authored",
  schedule: { kind: "none" },
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

describe("planAttemptRecord", () => {
  it("producción Easy produce un intento y dos efectos", () => {
    const plan = planAttemptRecord(
      {
        wordId: "c1k:on",
        sessionId: "session-1",
        assessment: assessment("Easy"),
        eventType: "verification",
        currentItems: [item("meaning"), item("production")],
      },
      context,
    );

    expect(plan.attemptLog.id).toBe("attempt-1");
    expect(plan.attemptLog.occurredAt).toBe(NOW.toISOString());
    expect(plan.srsEvents).toHaveLength(2);
    expect(plan.updatedItems).toHaveLength(2);
    expect(plan.srsEvents.map((event) => event.learningItemId).sort()).toEqual([
      "c1k:on#meaning",
      "c1k:on#production",
    ]);
    expect(plan.srsEvents.every((event) =>
      event.attemptLogId === plan.attemptLog.id)).toBe(true);
  });

  it("practice registra telemetría sin efectos SRS", () => {
    const localIds = ["attempt-practice"];
    const plan = planAttemptRecord(
      {
        wordId: "c1k:on",
        sessionId: "session-1",
        assessment: assessment("Good"),
        eventType: "practice",
        currentItems: [item("meaning"), item("production")],
      },
      {
        now: NOW,
        newId: () => localIds.shift()!,
      },
    );
    expect(plan.attemptLog.eventType).toBe("practice");
    expect(plan.attemptLog.observations).toHaveLength(2);
    expect(plan.srsEvents).toHaveLength(0);
    expect(plan.updatedItems).toHaveLength(0);
  });

  it("cada evento conserva schedule anterior y resultante", () => {
    const localIds = ["attempt", "meaning-event", "production-event"];
    const plan = planAttemptRecord(
      {
        wordId: "c1k:on",
        sessionId: "session-1",
        assessment: assessment("Again"),
        eventType: "scheduled-review",
        currentItems: [item("meaning"), item("production")],
      },
      { now: NOW, newId: () => localIds.shift()! },
    );
    for (const event of plan.srsEvents) {
      expect(event.priorSchedule.kind).toBe("none");
      expect(event.resultingSchedule.kind).toBe("fsrs");
      expect(event.grade).toBe("Again");
    }
  });

  it("no atribuye todos los efectos al primer item", () => {
    const localIds = ["attempt", "event-1", "event-2"];
    const plan = planAttemptRecord(
      {
        wordId: "c1k:on",
        sessionId: "session-1",
        assessment: assessment("Good"),
        eventType: "scheduled-review",
        currentItems: [item("meaning"), item("production")],
      },
      { now: NOW, newId: () => localIds.shift()! },
    );
    expect(new Set(plan.srsEvents.map((event) => event.learningItemId)).size)
      .toBe(2);
  });

  it("no persiste estado derivado", () => {
    const localIds = ["attempt", "event-1", "event-2"];
    const plan = planAttemptRecord(
      {
        wordId: "c1k:on",
        sessionId: "session-1",
        assessment: assessment("Good"),
        eventType: "scheduled-review",
        currentItems: [item("meaning"), item("production")],
      },
      { now: NOW, newId: () => localIds.shift()! },
    );
    for (const updated of plan.updatedItems) {
      expect(updated).not.toHaveProperty("status");
      expect(updated).not.toHaveProperty("mature");
      expect(updated).not.toHaveProperty("learningReason");
    }
  });
});
```

- [ ] **Step 2: Tests del plan**

- producción Easy sobre `meaning` y `production` → 1 intento, 2 eventos, 2 ítems;
- práctica → 1 intento, 0 eventos, 0 ítems;
- Again incrementa `lapses` solo en los ítems observados;
- un evento referencia el ítem correcto;
- mismo contexto produce IDs y fechas reproducibles;
- ninguna actualización escribe `mature` ni `status`.

- [ ] **Step 3: Persistencia local atómica**

```ts
export async function persistAttemptRecord(
  userId: string,
  plan: AttemptRecordPlan,
): Promise<void>;
```

Una única transacción Dexie escribe:

1. `AttemptLog`;
2. N `SrsReviewEvent`;
3. N `LearningItem` actualizados con espejos `dueAt/scheduleKind`;
4. N+1 entradas de outbox para intento y eventos, más las de ítems modificados.

Cualquier fallo hace rollback completo. No puede quedar schedule sin evento, evento huérfano ni outbox parcial.

La transacción debe incluir los espejos indexables y el outbox. Un esquema
de implementación válido es:

```ts
export async function persistAttemptRecord(
  userId: string,
  plan: AttemptRecordPlan,
): Promise<void> {
  await db.transaction(
    "rw",
    db.learningItems,
    db.attemptLogs,
    db.srsReviewEvents,
    db.syncOutbox,
    async () => {
      const attempt = toAttemptLogRecord(plan.attemptLog, userId);
      const events = plan.srsEvents.map((event) =>
        toSrsReviewEventRecord(event, userId));
      const items = plan.updatedItems.map((item) =>
        toLearningItemRecord(item, userId, plan.attemptLog.occurredAt));

      validateAttemptBundle({
        attempt: plan.attemptLog,
        events: plan.srsEvents,
        updatedItems: plan.updatedItems,
      });

      await db.attemptLogs.put(attempt);
      if (events.length > 0) await db.srsReviewEvents.bulkPut(events);
      if (items.length > 0) await db.learningItems.bulkPut(items);

      await enqueueAttemptBundle({ attempt, events, items });
    },
  );
}
```

La idempotencia se basa en los IDs del bundle. Reintentar el mismo plan hace
`put` de los mismos registros; no crea nuevos eventos ni aumenta contadores de
nuevo. No regenerar IDs dentro de `persistAttemptRecord`.

- [ ] **Step 4: Tests de integración**

Forzar fallo en cada write y comprobar que las tres tablas y el outbox quedan como antes. Probar reintento idempotente del mismo bundle.

Casos mínimos:

1. falla `attemptLogs.put` → cero filas nuevas;
2. falla `srsReviewEvents.bulkPut` → rollback del intento;
3. falla `learningItems.bulkPut` → rollback de intento y eventos;
4. falla el outbox → rollback de todo el bundle;
5. el segundo intento con los mismos IDs deja los mismos conteos;
6. un bundle con evento huérfano se rechaza antes de abrir la transacción;
7. dos eventos de la misma interacción reconstruyen dos tarjetas distintas.

- [ ] **Step 5: Commit**

```bash
pnpm test lib/essential-words/__tests__/record-attempt.test.ts
pnpm test lib/essential-words/__tests__/persist-attempt-record.test.ts
pnpm type-check
git add lib/essential-words/record-attempt.ts lib/essential-words/__tests__/
git commit -m "feat(essential-words): persistir intento y eventos SRS atomicos por item"
```

### Task 3.6: Un provisional vencido crea eventos FSRS reales por ítem

**Files:**
- Test: `lib/essential-words/__tests__/provisional-graduation.test.ts`

- [ ] **Step 1: Escribir tests**

- un provisional + `Good` crea un `SrsReviewEvent` cuyo `priorSchedule.kind` es `provisional` y cuyo `resultingSchedule.kind` es `fsrs`;
- un provisional + `Again` arranca FSRS desde `New` y adopta el estado real devuelto, sin imponer `Review`;
- una interacción de producción con dos provisionales crea dos eventos distintos vinculados al mismo `AttemptLog`;
- reconstruir cada ítem desde sus eventos produce calendarios independientes;
- no se generan reviews sintéticas anteriores a la verificación real.

- [ ] **Step 2: Ejecutar y corregir la implementación, no el contrato**

Run: `pnpm test lib/essential-words/__tests__/provisional-graduation.test.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/__tests__/provisional-graduation.test.ts lib/essential-words/record-attempt.ts
git commit -m "test(essential-words): graduar provisionales con eventos FSRS reales por item"
```

### Task 3.7: Umbral de latencia por modalidad y muestras autónomas

**Files:**
- Create: `lib/essential-words/verification/latency.ts`
- Modify: `lib/essential-words/verification/assessment.ts`
- Test: `lib/essential-words/verification/__tests__/latency.test.ts`

El `LOW_LATENCY_MS` global sigue intacto para la ruta vieja. El modelo nuevo usa umbrales por modalidad.

- [ ] **Step 1: Definir valores iniciales explícitos**

```ts
export const LATENCY_THRESHOLDS_MS: Record<AttemptModality, number> = {
  recognition: 8_000,
  production: 25_000,
  listening: 30_000,
  pronunciation: 20_000,
};
```

Son provisionales hasta la Fase 8.

- [ ] **Step 2: Calibración solo con muestras autónomas**

```ts
export function calibrateLatencyThresholds(
  events: SrsReviewEvent[],
  fallback: Record<AttemptModality, number>,
  minSamples: number,
): Record<AttemptModality, number>;
```

Una muestra entra únicamente si:

```text
event.affectsSchedule
assessment.correct
!assessment.usedHints
!assessment.rescued
!assessment.acceptedVariant
!assessment.firstTryFailed
assessment.freeAudioReplays === 0
grade === Easy || grade === Good
```

No usar `Hard`, autocorrecciones, variantes aceptadas ni replay gratuito como velocidad autónoma.

- [ ] **Step 3: Integrar en `buildAssessment`**

Solo reevaluar el escalón `Easy`/`Good`; `Again` y `Hard` conservan su causa pedagógica.

- [ ] **Step 4: Tests**

- umbral por cada modalidad;
- misma latencia puede ser rápida en producción y lenta en reconocimiento;
- muestras asistidas no afectan calibración;
- menos de `minSamples` conserva fallback;
- mediana determinista por modalidad.

- [ ] **Step 5: Commit**

```bash
pnpm test lib/essential-words/verification
pnpm type-check
git add lib/essential-words/verification/
git commit -m "feat(essential-words): calibrar latencia por modalidad con intentos autonomos"
```

---

## Fase 4 — Planificador y presupuesto

**Objetivo:** la cola de seis tramos con presupuesto real, activaciones contabilizadas y modo recuperación con histéresis. **Aquí se resuelve el riesgo principal de acumulación.**

**Condición de salida:** invariantes 7, 11, 14, 27, 28, 29 verdes; los tests de caracterización de la Fase 0 sobre el gating viejo se borran **conscientemente** en la tarea 4.6, sustituidos por los nuevos.

### Task 4.1: Tipos de planificación sin unidades ambiguas

**Files:**
- Create: `lib/essential-words/planning-types.ts`
- Test: `lib/essential-words/__tests__/planning-types.test.ts`

- [ ] **Step 1: Definir contratos**

```ts
export interface PlannedItem {
  itemId: string;
  wordId: string;
  skill: Skill;
  modality: AttemptModality;
  dueAt: string;
  retrievability?: number;
}

export interface ActivationCandidate {
  itemId: string;
  wordId: string;
  skill: Skill;
  modality: AttemptModality;
}

export interface NewWordCandidate {
  wordId: string;
  rank: number;
}

export interface ForecastSessionCapacity {
  sessionOffset: number; // 1..8, solo sesiones activas
  availableSeconds: number;
  listeningSeconds: number;
  productionSeconds: number;
}

export interface CapacityReservation {
  itemId: string;
  source: "pending-base" | "placement" | "usage" | "new-word";
  skill: Skill;
  deadlineSession: number;
  estimatedSeconds: number;
}

export interface ForecastCapacityDemand {
  itemId: string;
  skill: Skill;
  deadlineSession: number;
  estimatedSeconds: number;
}

export interface DailyPlanningInput {
  dailyBudgetSeconds: number;
  configuredNewWordLimit: number;
  mandatory: {
    learning: PlannedItem[];
    overdue: PlannedItem[];
    dueToday: PlannedItem[];
    provisionalDue: PlannedItem[];
  };
  candidates: {
    baseSkillActivations: ActivationCandidate[];
    usageActivations: ActivationCandidate[];
    newWords: NewWordCandidate[];
  };
  estimatedSeconds: {
    byModality: Record<AttemptModality, number>;
    newWordIntroduction: number;
  };
  consumed: {
    baseSkillActivations: number;
    usageActivations: number;
    newWords: number;
  };
  previousMode: "normal" | "recovery";
  capacityForecast: {
    sessions: ForecastSessionCapacity[];
    mandatory: ForecastCapacityDemand[];
    dueReservations: CapacityReservation[];
    futureReservations: CapacityReservation[];
  };
}

export interface DailyAllowance {
  newWords: number;
  capacitySafeNewWords: number;
  baseSkillActivations: number;
  usageActivations: number;
  newWordMeaningActivations: number;
  /** Telemetría derivada; nunca corta candidatos base. */
  totalSkillActivations: number;
  plannedSeconds: number;
  mode: "normal" | "recovery";
}

export interface ActivationLimits {
  maxBaseSkillActivationsPerSession: number;
  maxUsageActivationsPerSession: number;
  maxPerItemPerSession: number;
}

export interface DailyPlan {
  allowance: DailyAllowance;
  mandatorySelected: PlannedItem[];
  deferredMandatory: PlannedItem[];
  baseSkillSelected: ActivationCandidate[];
  usageSelected: ActivationCandidate[];
  newWordsSelected: NewWordCandidate[];
  futureReservations: CapacityReservation[];
}
```

- [ ] **Step 1b: Fijar las unidades en tests de tipos**

```ts
// lib/essential-words/__tests__/planning-types.test.ts
import { describe, expect, it } from "vitest";
import type {
  DailyAllowance,
  DailyPlan,
  DailyPlanningInput,
} from "../planning-types";

describe("unidades del plan diario", () => {
  it("separa base, meaning implícito y usage", () => {
    const allowance: DailyAllowance = {
      newWords: 3,
      capacitySafeNewWords: 3,
      baseSkillActivations: 2,
      newWordMeaningActivations: 3,
      usageActivations: 1,
      totalSkillActivations: 5,
      plannedSeconds: 780,
      mode: "normal",
    };
    expect(allowance.totalSkillActivations).toBe(
      allowance.baseSkillActivations
        + allowance.newWordMeaningActivations,
    );
  });

  it("DailyPlan conserva obligatorios diferidos", () => {
    const plan: DailyPlan = {
      mandatorySelected: [],
      deferredMandatory: [],
      baseSkillSelected: [],
      usageSelected: [],
      newWordsSelected: [],
      allowance: {
        newWords: 0,
        baseSkillActivations: 0,
        newWordMeaningActivations: 0,
        usageActivations: 0,
        totalSkillActivations: 0,
        plannedSeconds: 0,
        mode: "recovery",
      },
    };
    expect(plan).toHaveProperty("mandatorySelected");
    expect(plan).toHaveProperty("deferredMandatory");
  });

  it("el input transporta consumo de la sesión", () => {
    const consumed: DailyPlanningInput["consumed"] = {
      baseSkillActivations: 1,
      usageActivations: 0,
      newWords: 2,
    };
    expect(consumed.newWords).toBe(2);
  });
});
```

- [ ] **Step 2: Tests de significado de unidades**

- `baseSkillActivations` no incluye `meaning` de palabras nuevas;
- `totalSkillActivations === baseSkillActivations + newWordMeaningActivations`;
- un backlog puede dividirse en seleccionado y diferido sin perder IDs;
- no existen los campos ambiguos `skillActivations` ni `newItemsAllowed`.

- [ ] **Step 3: Commit**

```bash
pnpm test lib/essential-words/__tests__/planning-types.test.ts
pnpm type-check
git add lib/essential-words/planning-types.ts lib/essential-words/__tests__/planning-types.test.ts
git commit -m "feat(essential-words): separar unidades del presupuesto diario"
```

### Task 4.2: Estimación de coste por modalidad desde intentos, sin duplicar interacciones

**Files:**
- Create: `lib/essential-words/cost-estimate.ts`
- Test: `lib/essential-words/__tests__/cost-estimate.test.ts`

Una interacción de producción puede crear dos `SrsReviewEvent`; por eso el coste se calibra desde `AttemptLog`, no desde eventos por ítem. Usar eventos duplicaría el tiempo de una misma respuesta.

- [ ] **Step 1: Definir valores iniciales**

```ts
export const DEFAULT_SECONDS_BY_MODALITY: Record<AttemptModality, number> = {
  recognition: 12,
  production: 25,
  listening: 20,
  pronunciation: 30,
};
```

- [ ] **Step 2: Implementar**

```ts
export function estimateItemsSeconds(
  items: PlannedItem[],
  byModality: Record<AttemptModality, number>,
): number;

export function estimateFromAttempts(
  attempts: AttemptLog[],
  fallback: Record<AttemptModality, number>,
  minSamples: number,
): Record<AttemptModality, number>;
```

`estimateFromAttempts` usa `interactionDurationMs`, agrupa por modalidad y cuenta cada `AttemptLog` una sola vez. Para estimar sesiones SRS, aceptar únicamente `eventType === "scheduled-review" || eventType === "verification"`; las prácticas intra-sesión se analizan aparte.

- [ ] **Step 3: Tests**

- suma por modalidad;
- audio puede costar más que reconocimiento;
- dos eventos derivados del mismo intento no duplican duración;
- menos de `minSamples` conserva fallback;
- cada modalidad se calibra por separado;
- IDs estáticos en fixtures, sin UUID global.

- [ ] **Step 4: Commit**

```bash
pnpm test lib/essential-words/__tests__/cost-estimate.test.ts
pnpm type-check
git add lib/essential-words/cost-estimate.ts lib/essential-words/__tests__/cost-estimate.test.ts
git commit -m "feat(essential-words): estimar coste por modalidad desde intentos unicos"
```

### Task 4.3: Modo recuperación con histéresis

**Files:**
- Create: `lib/essential-words/recovery-mode.ts`
- Test: `lib/essential-words/__tests__/recovery-mode.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/recovery-mode.test.ts
import { describe, it, expect } from "vitest";
import {
  resolveMode, backlogSeconds, DEFAULT_RECOVERY_POLICY,
} from "../recovery-mode";
import type { PlannedItem } from "../planning-types";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";

const item = (modality: PlannedItem["modality"] = "recognition"): PlannedItem => ({
  itemId: `c1k:x#meaning-${modality}`, wordId: "c1k:x", skill: "meaning",
  modality, dueAt: "2026-08-01T00:00:00.000Z",
});

const BUDGET = 900;

describe("backlogSeconds", () => {
  it("incluye las tres fuentes: FSRS atrasados, provisionales vencidos y learning steps", () => {
    const seconds = backlogSeconds(
      { learning: [item()], overdue: [item()], provisionalDue: [item()], dueToday: [] },
      DEFAULT_SECONDS_BY_MODALITY,
    );
    expect(seconds).toBe(DEFAULT_SECONDS_BY_MODALITY.recognition * 3);
  });

  it("no cuenta lo que vence hoy: eso es carga normal, no deuda", () => {
    const seconds = backlogSeconds(
      { learning: [], overdue: [], provisionalDue: [], dueToday: [item(), item()] },
      DEFAULT_SECONDS_BY_MODALITY,
    );
    expect(seconds).toBe(0);
  });
});

describe("resolveMode", () => {
  it("entra en recuperación al superar el ratio de entrada", () => {
    const backlog = BUDGET * DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio + 1;
    expect(resolveMode(backlog, BUDGET, "normal", DEFAULT_RECOVERY_POLICY)).toBe("recovery");
  });

  it("no entra justo por debajo del umbral", () => {
    const backlog = BUDGET * DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio - 1;
    expect(resolveMode(backlog, BUDGET, "normal", DEFAULT_RECOVERY_POLICY)).toBe("normal");
  });

  it("sale solo al bajar del ratio de salida, más exigente", () => {
    const backlog = BUDGET * DEFAULT_RECOVERY_POLICY.exitAtBacklogBudgetRatio - 1;
    expect(resolveMode(backlog, BUDGET, "recovery", DEFAULT_RECOVERY_POLICY)).toBe("normal");
  });

  it("NO oscila: en la banda intermedia mantiene el modo anterior (invariante 29)", () => {
    const mid = BUDGET * (
      (DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio
        + DEFAULT_RECOVERY_POLICY.exitAtBacklogBudgetRatio) / 2
    );
    expect(resolveMode(mid, BUDGET, "recovery", DEFAULT_RECOVERY_POLICY)).toBe("recovery");
    expect(resolveMode(mid, BUDGET, "normal", DEFAULT_RECOVERY_POLICY)).toBe("normal");
  });

  it("los umbrales de entrada y salida son distintos: eso ES la histéresis", () => {
    expect(DEFAULT_RECOVERY_POLICY.exitAtBacklogBudgetRatio)
      .toBeLessThan(DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio);
  });

  it("sin modo previo arranca en normal salvo que el backlog obligue", () => {
    expect(resolveMode(0, BUDGET, undefined, DEFAULT_RECOVERY_POLICY)).toBe("normal");
    expect(resolveMode(BUDGET * 5, BUDGET, undefined, DEFAULT_RECOVERY_POLICY)).toBe("recovery");
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/recovery-mode.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/recovery-mode.ts
// Modo recuperacion en SEGUNDOS ESTIMADOS, no en numero de items (spec 2.3):
// el presupuesto es tiempo, y comparar un contador de items contra minutos
// mezcla unidades.
//
// Entrada y salida usan umbrales DISTINTOS. Esa banda es la histeresis, y
// evita el ciclo entrar/salir/entrar en sesiones consecutivas.

import { estimateItemsSeconds } from "./cost-estimate";
import type { AttemptModality } from "./verification/types";
import type { DailyPlanningInput } from "./planning-types";

export interface RecoveryPolicy {
  enterAtBacklogBudgetRatio: number;
  exitAtBacklogBudgetRatio: number;
}

/** PROVISIONALES: la banda se ajusta en la Fase 8 (spec 10, decision 6). */
export const DEFAULT_RECOVERY_POLICY: RecoveryPolicy = {
  enterAtBacklogBudgetRatio: 2.0,
  exitAtBacklogBudgetRatio: 0.75,
};

/**
 * Deuda acumulada, en segundos. Incluye las TRES fuentes que compiten por el
 * mismo tiempo diario: repasos FSRS atrasados, provisionales vencidos y pasos
 * de aprendizaje vencidos. Excluir alguna daria un backlog que subestima la
 * carga y dejaria al usuario fuera del modo justo cuando mas lo necesita.
 *
 * Lo que vence HOY no es deuda: es la carga normal del dia.
 */
export function backlogSeconds(
  mandatory: DailyPlanningInput["mandatory"],
  byModality: Record<AttemptModality, number>,
): number {
  return estimateItemsSeconds(
    [...mandatory.learning, ...mandatory.overdue, ...mandatory.provisionalDue],
    byModality,
  );
}

export function resolveMode(
  backlog: number,
  dailyBudgetSeconds: number,
  previousMode: "normal" | "recovery" | undefined,
  policy: RecoveryPolicy,
): "normal" | "recovery" {
  const enterAt = dailyBudgetSeconds * policy.enterAtBacklogBudgetRatio;
  const exitAt = dailyBudgetSeconds * policy.exitAtBacklogBudgetRatio;

  if (backlog > enterAt) return "recovery";
  if (backlog < exitAt) return "normal";
  // Banda intermedia: se mantiene el modo anterior. Esto es la histeresis.
  return previousMode ?? "normal";
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/__tests__/recovery-mode.test.ts`
Expected: PASS (8 tests).

```bash
git add lib/essential-words/recovery-mode.ts lib/essential-words/__tests__/recovery-mode.test.ts
git commit -m "feat(essential-words): modo recuperacion en segundos con histeresis"
```

### Task 4.4: `planDailySession` con selección obligatoria acotada

**Files:**
- Modify: `lib/essential-words/planning-types.ts`
- Create: `lib/essential-words/daily-budget.ts`
- Test: `lib/essential-words/__tests__/daily-budget.test.ts`

- [ ] **Step 1: Implementar selección de obligatorios**

```ts
export function selectMandatory(
  mandatory: DailyPlanningInput["mandatory"],
  budgetSeconds: number,
  byModality: Record<AttemptModality, number>,
): { selected: PlannedItem[]; deferred: PlannedItem[]; seconds: number };
```

Orden:

1. learning/relearning;
2. reviews y provisionales atrasados por urgencia;
3. reviews de hoy.

La selección se detiene al alcanzar el límite de sesión. Puede sobrepasarlo solo por un único ítem indivisible, nunca presentar horas de backlog. Todo lo no seleccionado queda en `deferred`.

- [ ] **Step 2: Implementar planificación**

```ts
export function planDailySession(
  input: DailyPlanningInput,
  limits: ActivationLimits,
  recovery: RecoveryPolicy,
): DailyPlan;
```

Reglas:

- primero reserva tiempo para `mandatorySelected`;
- recovery pone a cero lo negociable, pero sigue devolviendo una cola obligatoria acotada;
- `baseSkillActivations` cuenta solo candidatos ya existentes;
- cada palabra nueva consume `newWordMeaningActivations = 1`;
- el total es derivado y no se usa para hacer `slice` de candidatos base;
- el límite de repetición usa `candidate.itemId`, no `candidate.skill`;
- un mismo ítem no se activa dos veces, pero dos palabras distintas pueden activar `listening` en la misma sesión.

- [ ] **Step 2b: Fijar el algoritmo de selección**

`selectMandatory` opera sobre una secuencia ya ordenada por tramo y urgencia.
No recorta cada tramo por separado, porque eso podría dejar sin espacio a un
learning step urgente al mezclar límites. Cuando el siguiente obligatorio no
cabe, difiere ese elemento y todos los posteriores: un ítem menos urgente no
salta por delante solo por ser más barato. El coste sale de su modalidad.

```ts
function selectMandatory(
  mandatory: DailyPlanningInput["mandatory"],
  budgetSeconds: number,
  byModality: Record<AttemptModality, number>,
): MandatorySelection {
  const ordered = orderMandatory(mandatory);
  const selected: PlannedItem[] = [];
  const deferred: PlannedItem[] = [];
  let seconds = 0;

  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index];
    const cost = byModality[item.modality];
    const firstItem = selected.length === 0;
    if (!firstItem && seconds + cost > budgetSeconds) {
      deferred.push(...ordered.slice(index));
      break;
    }
    selected.push(item);
    seconds += cost;
  }

  return { selected, deferred, seconds };
}
```

La excepción de un único ítem indivisible evita una sesión vacía si la primera
actividad cuesta más que el presupuesto estimado. No autoriza añadir un segundo
ítem que siga desbordando.

La selección de activaciones debe devolver los IDs elegidos, no solo un número.
Así `buildSkillQueue` no repite el algoritmo ni hace `slice` sobre un total
ambiguo.

```ts
export interface ActivationSelection {
  selected: ActivationCandidate[];
  deferred: ActivationCandidate[];
  seconds: number;
}

export interface DailyPlan {
  mandatorySelected: PlannedItem[];
  deferredMandatory: PlannedItem[];
  baseSkillSelected: ActivationCandidate[];
  usageSelected: ActivationCandidate[];
  newWordsSelected: NewWordCandidate[];
  allowance: DailyAllowance;
}
```

- [ ] **Step 3: Tests obligatorios**

1. Dos activaciones base + tres nuevas producen:
   - `baseSkillActivations = 2`;
   - `newWordMeaningActivations = 3`;
   - `totalSkillActivations = 5`;
   - nunca cinco activaciones base.
2. Un backlog de varias horas produce `mandatorySelected` acotado y `deferredMandatory` no vacío.
3. Lo diferido no se marca hecho ni se reprograma.
4. Dos `listening` de palabras distintas caben; el mismo `itemId` no se duplica.
5. Recovery usa histéresis y no oscila cerca del umbral.
6. Con backlog alto, `newWords`, base y usage son cero.
7. El primer obligatorio puede sobrepasar el presupuesto; el segundo se difiere.
8. `plannedSeconds` coincide con la suma de los elementos seleccionados.
9. `totalSkillActivations` es una suma de telemetría y nunca se usa para seleccionar.
10. Un `itemId` duplicado aparece una sola vez aunque llegue dos veces como candidato.
11. Dos `listening` con `itemId` distinto pueden seleccionarse en la misma sesión.
12. `deferredMandatory` conserva la edad y el `dueAt` originales.
13. Replanificar sin completar nada no rejuvenece el backlog.
14. La salida de recovery usa el umbral de salida, no el de entrada.

Ejemplo del caso que detecta el doble conteo:

```ts
it("2 base + 3 nuevas no se convierten en 5 base + 3 nuevas", () => {
  const plan = planDailySession(input({
    candidates: {
      baseSkillActivations: fiveBaseCandidates(),
      usageActivations: [],
      newWords: threeNewWords(),
    },
  }), {
    maxBaseSkillActivationsPerSession: 2,
    maxUsageActivationsPerSession: 0,
    maxPerItemPerSession: 1,
  }, DEFAULT_RECOVERY_POLICY);

  expect(plan.baseSkillSelected).toHaveLength(2);
  expect(plan.newWordsSelected).toHaveLength(3);
  expect(plan.allowance.baseSkillActivations).toBe(2);
  expect(plan.allowance.newWordMeaningActivations).toBe(3);
  expect(plan.allowance.totalSkillActivations).toBe(5);
});
```

Ejemplo de cola acotada en recovery:

```ts
it("presenta una porción priorizada y difiere el resto del backlog", () => {
  const plan = planDailySession(input({
    dailyBudgetSeconds: 900,
    mandatory: mandatoryForHours(4),
    previousMode: "recovery",
  }), DEFAULT_ACTIVATION_LIMITS, DEFAULT_RECOVERY_POLICY);

  expect(plan.allowance.mode).toBe("recovery");
  expect(plan.allowance.plannedSeconds).toBeLessThanOrEqual(1_020);
  expect(plan.deferredMandatory.length).toBeGreaterThan(0);
  expect(plan.baseSkillSelected).toHaveLength(0);
  expect(plan.usageSelected).toHaveLength(0);
  expect(plan.newWordsSelected).toHaveLength(0);
});
```

- [ ] **Step 4: Commit**

```bash
pnpm test lib/essential-words/__tests__/daily-budget.test.ts
pnpm type-check
git add lib/essential-words/daily-budget.ts lib/essential-words/__tests__/daily-budget.test.ts
git commit -m "feat(essential-words): planificar sesion acotada sin doble conteo"
```

### Task 4.5: Cola de seis tramos desde `DailyPlan`

**Files:**
- Create: `lib/essential-words/skill-queue.ts`
- Test: `lib/essential-words/__tests__/skill-queue.test.ts`

- [ ] **Step 1: Implementar**

```ts
export interface SkillQueueInput {
  plan: DailyPlan;
}

export function buildSkillQueue(input: SkillQueueInput): PlannedItem[];
```

La cola usa exclusivamente las selecciones materializadas en `DailyPlan`:
`mandatorySelected`, `baseSkillSelected`, `usageSelected` y
`newWordsSelected`. Nunca vuelve a cortar candidatos por conteos ni reincorpora
los obligatorios originales.

Tramos:

1. learning/relearning seleccionado;
2. atrasados/provisionales seleccionados;
3. hoy seleccionado;
4. `plan.baseSkillSelected`;
5. `plan.usageSelected`;
6. `plan.newWordsSelected` convertidas en activaciones de `meaning`.

- [ ] **Step 2: Tests**

- orden de los seis tramos;
- urgencia por recuperabilidad y antigüedad;
- no usa `allowance.totalSkillActivations` para cortar base;
- cola recovery no contiene `deferredMandatory` ni negociables;
- no hay IDs duplicados;
- `plannedSeconds` coincide con el contenido seleccionado dentro de tolerancia de redondeo.

- [ ] **Step 3: Commit**

```bash
pnpm test lib/essential-words/__tests__/skill-queue.test.ts
pnpm type-check
git add lib/essential-words/skill-queue.ts lib/essential-words/__tests__/skill-queue.test.ts
git commit -m "feat(essential-words): construir cola desde plan obligatorio acotado"
```

### Task 4.6: Sustituir caracterización del gating roto por regresiones

**Files:**
- Delete: `lib/essential-words/__tests__/queue.characterization.test.ts`
- Create: `lib/essential-words/__tests__/gating-regression.test.ts`

La eliminación es explícita: cada expectativa que documentaba un bug debe tener primero su expectativa contraria en el modelo nuevo.

- [ ] **Step 1: Crear regresiones**

- 40 atrasados bloquean nuevas y activaciones negociables;
- sin deuda existe progreso;
- prioridad por urgencia, no frecuencia;
- backlog enorme presenta solo una sesión acotada;
- 2 base + 3 nuevas no se convierten en 5 base + 3 nuevas;
- no existe límite global de un solo `listening` por sesión;
- deferred permanece en backlog.

- [ ] **Step 2: Ejecutar nuevas regresiones**

Run: `pnpm test lib/essential-words/__tests__/gating-regression.test.ts`

- [ ] **Step 3: Borrar caracterización antigua únicamente después del verde**

- [ ] **Step 4: Ejecutar fase completa y commit**

```bash
pnpm test lib/essential-words
pnpm type-check
pnpm lint
git add -A
git commit -m "test(essential-words): reemplazar gating roto por regresiones acotadas"
```

---

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

### Task 6.2: Confianza por banda e inferencia con reloj inyectado

**Files:**
- Create: `lib/essential-words/placement/policy.ts`
- Test: `lib/essential-words/placement/__tests__/policy.test.ts`

- [ ] **Step 1: Confianza explicable por banda**

Mantener `high / borderline / low` y no inferir la banda fronteriza.

- [ ] **Step 2: Planificar inferencias**

```ts
export function planInferences(
  bands: BandResult[],
  context: ExecutionContext,
): LearningItem[];
```

Reglas:

- crea las tres habilidades base con `schedule: { kind: "none" }`;
- solo `meaning` recibe `placementInference` en una prueba escrita;
- `inferredAt` usa `context.now`, nunca `new Date()`;
- IDs usan `learningItemId`; si se necesita un ID adicional, usa `context.newId()`;
- misma entrada + mismo contexto produce exactamente la misma salida.

- [ ] **Step 3: Tests**

- alta confianza crea inferencia solo en meaning;
- borderline no fast-trackea;
- no hay programación todavía;
- fecha inyectada exacta;
- no existe dependencia del reloj global.

- [ ] **Step 4: Commit**

```bash
pnpm test lib/essential-words/placement/__tests__/policy.test.ts
pnpm type-check
git add lib/essential-words/placement/policy.ts lib/essential-words/placement/__tests__/policy.test.ts
git commit -m "feat(essential-words): persistir inferencias de banda con reloj inyectado"
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

## Fase 7 — Ciclo de vida de `usage`

**Objetivo:** elegibilidad, prefetch, validación, activación presupuestada y telemetría de no-aparición. **La generación remota se sustituye por fixtures `authored`** para probar el ciclo completo sin depender del proveedor.

**Depende de:** Fase 4.
**Condición de salida:** invariantes 5, 7, 9, 23 verdes.

### Task 7.1: Elegibilidad de `usage` con historial por ítem

**Files:**
- Create: `lib/essential-words/usage/lifecycle.ts`
- Test: `lib/essential-words/usage/__tests__/eligibility.test.ts`

- [ ] **Step 1: Implementar política**

```ts
export type UsageEligibility = Record<UsageKind, boolean>;

export function usageEligibility(
  items: LearningItem[],
  events: SrsReviewEvent[],
  policy: MaturityPolicy,
): UsageEligibility {
  const meaning = items.find((item) => item.skill === "meaning");
  const production = items.find((item) => item.skill === "production");

  const meaningInReview = meaning
    ? deriveSkillStatus(meaning) === "review"
    : false;

  return {
    context_usage: meaningInReview,
    advanced_usage: Boolean(
      meaning && production
      && isMature(meaning, events, policy)
      && isMature(production, events, policy),
    ),
  };
}
```

`isMature` filtra internamente por `learningItemId`, así que un intento que actualizó dos tarjetas no mezcla sus historiales.

- [ ] **Step 2: Tests**

- context usage se desbloquea con meaning en review;
- provisional no desbloquea;
- advanced exige meaning y production maduros;
- listening no es requisito artificial;
- eventos de otro ítem no cuentan;
- fixtures usan IDs estáticos y contratos válidos de `SrsReviewEvent`.

- [ ] **Step 3: Commit**

```bash
pnpm test lib/essential-words/usage/__tests__/eligibility.test.ts
pnpm type-check
git add lib/essential-words/usage/lifecycle.ts lib/essential-words/usage/__tests__/eligibility.test.ts
git commit -m "feat(essential-words): elegibilidad usage desde eventos SRS por item"
```

### Task 7.2: La pérdida de madurez no retira contenido activo

**Files:**
- Modify: `lib/essential-words/usage/lifecycle.ts`
- Test: `lib/essential-words/usage/__tests__/maturity-loss.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/usage/__tests__/maturity-loss.test.ts
import { describe, it, expect } from "vitest";
import { planUsageAfterLapse } from "../lifecycle";
import type { LearningItem, UsagePayload } from "../../verification/types";

const payload = (over: Partial<UsagePayload> = {}): UsagePayload => ({
  usageKind: "advanced_usage", expression: "depend on",
  sentence: "It depends on the weather.", acceptedVariants: [],
  generationStatus: "ready", metadata: { schemaVersion: 1 },
  activatedAt: "2026-08-01T00:00:00.000Z", ...over,
});

const activeUsage = (): LearningItem => ({
  id: "c1k:on#usage:depend-on", wordId: "c1k:on", skill: "usage",
  contentOrigin: "generated", generatorProvider: "gemini",
  payload: payload(),
  schedule: { kind: "fsrs", dueAt: "2026-08-25T00:00:00.000Z", stability: 12, difficulty: 5, state: "Review" },
  repetitions: 3, lapses: 0, suspended: false,
});

describe("planUsageAfterLapse", () => {
  it("NO retira los usage ya activos (invariante 23)", () => {
    const result = planUsageAfterLapse([activeUsage()], { canActivateNew: false });
    expect(result.retired).toHaveLength(0);
  });

  it("los activos conservan su calendario propio", () => {
    const before = activeUsage();
    const result = planUsageAfterLapse([before], { canActivateNew: false });
    expect(result.unchanged[0].schedule).toEqual(before.schedule);
  });

  it("bloquea la activación de nuevos mientras no vuelva la madurez", () => {
    const result = planUsageAfterLapse([activeUsage()], { canActivateNew: false });
    expect(result.blockNewActivations).toBe(true);
  });

  it("con madurez recuperada vuelve a permitir activaciones", () => {
    const result = planUsageAfterLapse([activeUsage()], { canActivateNew: true });
    expect(result.blockNewActivations).toBe(false);
  });

  it("un fallo aislado no desestabiliza la experiencia", () => {
    // Sin esta regla, un lapse o un cambio de MaturityPolicy retiraría
    // contenido ya introducido.
    const usages = [activeUsage(), activeUsage()];
    const result = planUsageAfterLapse(usages, { canActivateNew: false });
    expect(result.unchanged).toHaveLength(2);
    expect(result.retired).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/usage/__tests__/maturity-loss.test.ts`
Expected: FAIL — `planUsageAfterLapse` no exportado.

- [ ] **Step 3: Implementar**

```ts
/**
 * Perder la madurez controla la ACTIVACION DE CONTENIDO NUEVO, nada mas
 * (spec 5.1). Sin esta regla, un fallo aislado —o un cambio de
 * MaturityPolicy— retiraria contenido ya introducido y volveria la
 * experiencia inestable.
 */
export function planUsageAfterLapse(
  usageItems: LearningItem[],
  eligibility: { canActivateNew: boolean },
): {
  unchanged: LearningItem[];
  retired: LearningItem[];
  blockNewActivations: boolean;
} {
  return {
    // Los activos siguen su propio calendario. No se tocan.
    unchanged: usageItems,
    retired: [],
    blockNewActivations: !eligibility.canActivateNew,
  };
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/usage/__tests__/maturity-loss.test.ts`
Expected: PASS (5 tests).

```bash
git add lib/essential-words/usage/lifecycle.ts lib/essential-words/usage/__tests__/maturity-loss.test.ts
git commit -m "feat(essential-words): perder madurez bloquea activaciones sin retirar contenido"
```

### Task 7.3: Validación y telemetría de no-aparición

**Files:**
- Create: `lib/essential-words/usage/validation.ts`
- Test: `lib/essential-words/usage/__tests__/validation.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/usage/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateUsagePayload, type NonAppearanceReason } from "../validation";
import type { UsagePayload } from "../../verification/types";

const valid = (over: Partial<UsagePayload> = {}): UsagePayload => ({
  usageKind: "advanced_usage",
  expression: "depend on",
  sentence: "The result depends on the weather.",
  acceptedVariants: ["depends on"],
  generationStatus: "ready",
  metadata: { schemaVersion: 1 },
  ...over,
});

describe("validateUsagePayload", () => {
  it("acepta un payload correcto", () => {
    expect(validateUsagePayload(valid(), [])).toEqual({ ok: true });
  });

  it("rechaza si la frase no contiene la expresión", () => {
    const result = validateUsagePayload(
      valid({ sentence: "The weather is nice today." }), []);
    expect(result.ok).toBe(false);
  });

  it("rechaza un payload sin generar", () => {
    const result = validateUsagePayload(valid({ generationStatus: "pending" }), []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_generated");
  });

  it("rechaza una generación fallida", () => {
    const result = validateUsagePayload(valid({ generationStatus: "failed" }), []);
    if (!result.ok) expect(result.reason).toBe("generation_failed");
  });

  it("rechaza un duplicado de un ítem existente", () => {
    const result = validateUsagePayload(valid(), ["depend on"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid_content");
  });

  it("rechaza una frase demasiado corta para evaluar el uso", () => {
    const result = validateUsagePayload(valid({ sentence: "Depend on." }), []);
    expect(result.ok).toBe(false);
  });

  it("exige schemaVersion: una actualización del generador invalida lo viejo", () => {
    const noVersion = { ...valid(), metadata: {} } as UsagePayload;
    expect(validateUsagePayload(noVersion, []).ok).toBe(false);
  });
});

describe("motivos de no-aparición", () => {
  it("cubre los cinco casos de la spec", () => {
    const reasons: NonAppearanceReason[] = [
      "not_generated", "generation_failed", "offline",
      "invalid_content", "daily_capacity_reached",
    ];
    expect(reasons).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/usage/__tests__/validation.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/usage/validation.ts
// Validacion antes de activar (spec 5.5). Sin la telemetria de no-aparicion
// es imposible distinguir "funciona correctamente" de "la generacion lleva
// tres semanas fallando".

import type { UsagePayload } from "../verification/types";

export type NonAppearanceReason =
  | "not_generated"
  | "generation_failed"
  | "offline"
  | "invalid_content"
  | "daily_capacity_reached";

export type UsageValidation =
  | { ok: true }
  | { ok: false; reason: NonAppearanceReason; detail: string };

/** Minimo de palabras para que la frase evalue el uso y no sea un eco. */
const MIN_SENTENCE_WORDS = 5;

export function validateUsagePayload(
  payload: UsagePayload,
  existingExpressions: string[],
): UsageValidation {
  if (payload.generationStatus === "pending") {
    return { ok: false, reason: "not_generated", detail: "generation pending" };
  }
  if (payload.generationStatus === "failed") {
    return { ok: false, reason: "generation_failed", detail: "generator reported failure" };
  }
  if (payload.metadata.schemaVersion === undefined) {
    return { ok: false, reason: "invalid_content", detail: "missing schemaVersion" };
  }

  const normalized = payload.sentence.toLowerCase();
  if (!normalized.includes(payload.expression.toLowerCase())) {
    return { ok: false, reason: "invalid_content", detail: "sentence lacks the expression" };
  }
  if (payload.sentence.trim().split(/\s+/).length < MIN_SENTENCE_WORDS) {
    return { ok: false, reason: "invalid_content", detail: "sentence too short to test usage" };
  }

  const duplicate = existingExpressions.some(
    (existing) => existing.toLowerCase() === payload.expression.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, reason: "invalid_content", detail: "duplicates an existing item" };
  }

  return { ok: true };
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/usage/__tests__/validation.test.ts`
Expected: PASS (8 tests).

```bash
git add lib/essential-words/usage/validation.ts lib/essential-words/usage/__tests__/validation.test.ts
git commit -m "feat(essential-words): validacion de usage con motivos de no-aparicion"
```

### Task 7.4: Fixtures `authored` y funcionamiento offline

**Files:**
- Create: `lib/essential-words/usage/__tests__/fixtures/authored-usage.ts`
- Test: `lib/essential-words/usage/__tests__/offline.test.ts`

La generación remota se sustituye por fixtures para probar el ciclo completo sin depender del proveedor. El pipeline real es una spec posterior.

- [ ] **Step 1: Crear las fixtures**

```ts
// lib/essential-words/usage/__tests__/fixtures/authored-usage.ts
import type { LearningItem, UsageKind } from "../../../verification/types";

/**
 * Contenido `authored` para probar el ciclo de vida completo sin llamar a
 * Gemini. El pipeline de generacion es una spec posterior; el motor solo
 * necesita saber que un payload valido existe.
 */
export function authoredUsage(
  wordId: string,
  expression: string,
  sentence: string,
  usageKind: UsageKind = "advanced_usage",
): LearningItem {
  return {
    id: `${wordId}#usage:${expression.replace(/\s+/g, "-")}`,
    wordId,
    skill: "usage",
    contentOrigin: "authored",
    payload: {
      usageKind,
      expression,
      sentence,
      acceptedVariants: [],
      generationStatus: "ready",
      generatedAt: "2026-08-01T00:00:00.000Z",
      metadata: { schemaVersion: 1, reviewed: true },
    },
    schedule: { kind: "none" },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  };
}

export const AUTHORED_ON_USAGES = [
  authoredUsage("c1k:on", "depend on", "The result depends on the weather today."),
  authoredUsage("c1k:on", "on purpose", "She did it on purpose, not by accident."),
  authoredUsage("c1k:on", "on Monday", "We have a meeting on Monday morning.", "context_usage"),
];
```

- [ ] **Step 2: Escribir el test de offline**

```ts
// lib/essential-words/usage/__tests__/offline.test.ts
import { describe, it, expect } from "vitest";
import { deriveUsageLifecycle } from "../../skill-item";
import { AUTHORED_ON_USAGES } from "./fixtures/authored-usage";
import { buildSkillQueue } from "../../skill-queue";
import type { DailyAllowance } from "../../planning-types";

const allowance = (over: Partial<DailyAllowance> = {}): DailyAllowance => ({
  newWords: 0, baseSkillActivations: 0, usageActivations: 2,
  newWordMeaningActivations: 0, totalSkillActivations: 0,
  plannedSeconds: 0, mode: "normal", ...over,
});

describe("usage sin generación disponible", () => {
  it("un usage sin activar no entra en la cola (invariante 5)", () => {
    expect(AUTHORED_ON_USAGES.every((i) => deriveUsageLifecycle(i) === "inactive")).toBe(true);
  });

  it("la sesión funciona igual sin ningún candidato usage (invariante 9)", () => {
    const queue = buildSkillQueue({
      mandatory: {
        learning: [], overdue: [{
          itemId: "c1k:on#meaning", wordId: "c1k:on", skill: "meaning",
          modality: "recognition", dueAt: "2026-08-01T00:00:00.000Z", retrievability: 0.4,
        }], dueToday: [], provisionalDue: [],
      },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      allowance: allowance(),
    });
    // La sesión existe y tiene contenido: la palabra simplemente espera.
    expect(queue).toHaveLength(1);
  });

  it("el contenido authored no necesita proveedor para ser válido", () => {
    expect(AUTHORED_ON_USAGES.every((i) => i.contentOrigin === "authored")).toBe(true);
    expect(AUTHORED_ON_USAGES.every((i) => i.generatorProvider === undefined)).toBe(true);
  });

  it("distingue context_usage de advanced_usage", () => {
    const kinds = new Set(AUTHORED_ON_USAGES.map((i) => i.payload?.usageKind));
    expect(kinds).toContain("context_usage");
    expect(kinds).toContain("advanced_usage");
  });
});
```

- [ ] **Step 3: Ejecutar**

Run: `pnpm test lib/essential-words/usage`
Expected: PASS.

- [ ] **Step 4: Verificar la fase completa**

Run: `pnpm test lib/essential-words && pnpm type-check && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/usage/__tests__/
git commit -m "test(essential-words): fixtures authored y ciclo de usage sin proveedor"
```

---

## Fase 8 — Simulación fiel y calibración

**Objetivo:** ejecutar una simulación que reproduzca las dinámicas que pueden
enterrar al usuario después de varias semanas: tres habilidades base por
palabra, inferencias de colocación, verificaciones provisionales, activación de
`usage`, ausencias y recuperación. No basta con simular un contador de tarjetas.

**Depende de:** fases 4–7 completas.

**Condición de salida:**

- los cinco perfiles generan sesiones reproducibles;
- los perfiles elegibles generan activaciones base, provisionales y `usage` no
  triviales;
- los once criterios de §9.5 tienen función, test unitario y llamada explícita
  en aceptación, y todos pasan en los perfiles aplicables;
- los diez motores adversariales fallan por el criterio esperado;
- los cuatro datasets por modalidad tienen al menos 200 muestras empíricas y
  ningún gate devuelve `insufficient-*`;
- los ocho grupos de parámetros quedan fijados y versionados.

> Esta fase puede detenerse, pero detenerse no equivale a cerrarla. Si falla
> después de agotar ajustes seguros, permanece abierta, bloquea Fase 9 y obliga
> a revisar la arquitectura; no se rebaja ningún criterio.

### Task 8.1: Perfiles, PRNG semillado y estado simulado por palabra

**Files:**
- Create: `lib/essential-words/simulation/random.ts`
- Create: `lib/essential-words/simulation/profiles.ts`
- Create: `lib/essential-words/simulation/state.ts`
- Create: `lib/essential-words/simulation/fixtures.ts`
- Test: `lib/essential-words/simulation/__tests__/random.test.ts`
- Test: `lib/essential-words/simulation/__tests__/profiles.test.ts`
- Test: `lib/essential-words/simulation/__tests__/state.test.ts`

- [ ] **Step 1: Crear una fuente de aleatoriedad reproducible**

```ts
// lib/essential-words/simulation/random.ts
export interface RandomSource {
  next(): number;
  integer(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(values: readonly T[]): T;
}

export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  const next = (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    next,
    integer: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (probability) => next() < probability,
    pick: <T>(values: readonly T[]): T => {
      if (values.length === 0) throw new Error("pick requires values");
      return values[Math.floor(next() * values.length)];
    },
  };
}
```

Tests:

```ts
it("misma semilla produce la misma secuencia", () => {
  const a = seededRandom(42);
  const b = seededRandom(42);
  expect(Array.from({ length: 20 }, () => a.next()))
    .toEqual(Array.from({ length: 20 }, () => b.next()));
});

it("semillas distintas divergen", () => {
  expect(seededRandom(1).next()).not.toBe(seededRandom(2).next());
});
```

No usar `Math.random()` fuera de la implementación encapsulada del PRNG.

- [ ] **Step 2: Definir los cinco perfiles de la spec**

```ts
// lib/essential-words/simulation/profiles.ts
export interface SimulationProfile {
  id: "steady" | "intermittent" | "bursty" | "beginner" | "advanced";
  practicePattern:
    | { kind: "probability"; dailyRate: number }
    | { kind: "cycle"; activeDays: number; idleDays: number };
  accuracyByModality: Record<AttemptModality, number>;
  completionBudgetRatio: number;
  placementConfidence: "none" | "low" | "high";
  alreadyKnownOverestimateRate: number;
  audioReplayRate: number;
}

export const PROFILES: Record<SimulationProfile["id"], SimulationProfile> = {
  steady: {
    id: "steady",
    practicePattern: { kind: "probability", dailyRate: 1 },
    accuracyByModality: {
      recognition: 0.9,
      production: 0.82,
      listening: 0.8,
      pronunciation: 0.78,
    },
    completionBudgetRatio: 1,
    placementConfidence: "low",
    alreadyKnownOverestimateRate: 0.05,
    audioReplayRate: 0.1,
  },
  intermittent: {
    id: "intermittent",
    practicePattern: { kind: "probability", dailyRate: 0.5 },
    accuracyByModality: {
      recognition: 0.86,
      production: 0.75,
      listening: 0.72,
      pronunciation: 0.7,
    },
    completionBudgetRatio: 0.9,
    placementConfidence: "low",
    alreadyKnownOverestimateRate: 0.08,
    audioReplayRate: 0.15,
  },
  bursty: {
    id: "bursty",
    practicePattern: { kind: "cycle", activeDays: 7, idleDays: 14 },
    accuracyByModality: {
      recognition: 0.86,
      production: 0.74,
      listening: 0.7,
      pronunciation: 0.68,
    },
    completionBudgetRatio: 1,
    placementConfidence: "low",
    alreadyKnownOverestimateRate: 0.08,
    audioReplayRate: 0.16,
  },
  beginner: {
    id: "beginner",
    practicePattern: { kind: "probability", dailyRate: 0.85 },
    accuracyByModality: {
      recognition: 0.68,
      production: 0.52,
      listening: 0.5,
      pronunciation: 0.48,
    },
    completionBudgetRatio: 0.9,
    placementConfidence: "none",
    alreadyKnownOverestimateRate: 0.12,
    audioReplayRate: 0.25,
  },
  advanced: {
    id: "advanced",
    practicePattern: { kind: "probability", dailyRate: 0.9 },
    accuracyByModality: {
      recognition: 0.96,
      production: 0.9,
      listening: 0.9,
      pronunciation: 0.86,
    },
    completionBudgetRatio: 1,
    placementConfidence: "high",
    alreadyKnownOverestimateRate: 0.15,
    audioReplayRate: 0.08,
  },
};
```

Tests:

- constante practica todos los días;
- intermitente tiene días activos e inactivos con la misma semilla;
- ráfagas contiene una ausencia continua de al menos diez días;
- principiante tiene menor precisión de producción que de reconocimiento;
- avanzado crea inferencias de colocación y candidatos `usage`;
- misma semilla produce el mismo calendario y respuestas.

- [ ] **Step 3: Definir el estado simulado canónico**

```ts
// lib/essential-words/simulation/state.ts
export interface SimulatedUsageContent {
  item: LearningItem;
  readyAt: string;
}

export interface SimulatedWordState {
  wordId: string;
  rank: number;
  introducedAt?: string;
  meaning: LearningItem;
  listening: LearningItem;
  production: LearningItem;
  usage: SimulatedUsageContent[];
}

export interface DeferredState {
  item: PlannedItem;
  firstDeferredSession: number;
  lastOfferedSession?: number;
}

export interface SimulationWorld {
  words: Map<string, SimulatedWordState>;
  attemptLogs: AttemptLog[];
  srsEvents: SrsReviewEvent[];
  deferred: Map<string, DeferredState>;
  previousMode: "normal" | "recovery";
  sessionIndex: number;
  introducedWords: number;
  placementConversions: number;
}

export interface SimulationOptions {
  days: number;
  corpusSize: number;
  seed: number;
  startAt: string;
  dailyBudgetSeconds: number;
  targetNewWords: number;
}
```

`createInitialWorld` debe crear tres `LearningItem` base por palabra con
`schedule.kind === "none"`. El corpus no se considera introducido por existir
en memoria. Para el perfil avanzado, una fracción de `meaning` lleva
`placementInference`, pero continúa sin programación.

Los usos authored o generados se almacenan con `schedule.kind === "none"` y
`generationStatus: "ready"` cuando estén disponibles. No todos los usos están
listos desde el día cero; `readyAt` permite probar el comportamiento offline y
la ausencia temporal de candidatos.

- [ ] **Step 4: Contexto diario determinista**

```ts
export function simulationContext(
  date: Date,
  seed: number,
  counter: { value: number },
): ExecutionContext {
  return {
    now: date,
    newId: () => `sim:${seed}:${counter.value++}`,
  };
}
```

El contexto se crea en el borde del motor. Ninguna política llama a
`new Date()`, `Date.now()`, `crypto.randomUUID()` o `Math.random()`.

- [ ] **Step 5: Tests de aislamiento del estado**

```ts
it("cada palabra contiene exactamente tres habilidades base", () => {
  const world = createInitialWorld(options, PROFILES.steady);
  const first = [...world.words.values()][0];
  expect([first.meaning.skill, first.listening.skill, first.production.skill])
    .toEqual(["meaning", "listening", "production"]);
});

it("dos simulaciones no comparten referencias mutables", () => {
  const a = createInitialWorld(options, PROFILES.steady);
  const b = createInitialWorld(options, PROFILES.steady);
  const wordA = [...a.words.values()][0];
  const wordB = [...b.words.values()][0];
  wordA.meaning.repetitions = 99;
  expect(wordB.meaning.repetitions).toBe(0);
});

it("advanced contiene inferencias sin programación", () => {
  const world = createInitialWorld(options, PROFILES.advanced);
  const inferred = [...world.words.values()]
    .map((word) => word.meaning)
    .filter((item) => item.placementInference);
  expect(inferred.length).toBeGreaterThan(0);
  expect(inferred.every((item) => item.schedule.kind === "none")).toBe(true);
});
```

- [ ] **Step 6: Ejecutar y commit**

```bash
pnpm test lib/essential-words/simulation/__tests__/random.test.ts
pnpm test lib/essential-words/simulation/__tests__/profiles.test.ts
pnpm test lib/essential-words/simulation/__tests__/state.test.ts
pnpm type-check
git add lib/essential-words/simulation/
git commit -m "feat(essential-words): estado simulado fiel y reproducible por palabra"
```

### Task 8.2: Motor diario que ejecuta las políticas reales

**Files:**
- Create: `lib/essential-words/simulation/candidates.ts`
- Create: `lib/essential-words/simulation/apply-session.ts`
- Create: `lib/essential-words/simulation/run-simulation.ts`
- Test: `lib/essential-words/simulation/__tests__/candidates.test.ts`
- Test: `lib/essential-words/simulation/__tests__/apply-session.test.ts`
- Test: `lib/essential-words/simulation/__tests__/run-simulation.test.ts`

Los ficheros se separan para conservar el límite aproximado de 250 líneas.

- [ ] **Step 1: Construir obligatorios desde el estado real**

```ts
export interface SimulationMandatory {
  learning: PlannedItem[];
  overdue: PlannedItem[];
  dueToday: PlannedItem[];
  provisionalDue: PlannedItem[];
}

export function collectMandatory(
  world: SimulationWorld,
  now: Date,
): SimulationMandatory;
```

Reglas:

- `schedule.kind === "fsrs"` y estado `Learning/Relearning/New` vencido →
  `learning`;
- FSRS con `dueAt < inicio del día` → `overdue`;
- FSRS que vence durante el día → `dueToday`;
- provisional vencido → `provisionalDue`;
- suspendidos y retirados no aparecen;
- un mismo `itemId` aparece una sola vez;
- los diferidos de ayer conservan su edad y vuelven a competir por urgencia.

- [ ] **Step 2: Construir candidatos base, placement y usage**

```ts
export interface SimulationCandidates {
  baseSkillActivations: ActivationCandidate[];
  usageActivations: ActivationCandidate[];
  newWords: NewWordCandidate[];
  inferredConversions: LearningItem[];
}

export function collectCandidates(
  world: SimulationWorld,
  profile: SimulationProfile,
  context: ExecutionContext,
): SimulationCandidates;
```

Activaciones base:

- solo `listening` o `production` con `schedule.kind === "none"`;
- la palabra debe tener `meaning` introducido;
- respetar la política de secuenciación de §2.5;
- no incluir el mismo ítem dos veces;
- no inferir escucha ni producción desde placement escrito.

Conversiones de placement:

- seleccionar hasta `DEFAULT_CONVERSIONS_PER_DAY`;
- `meaning` conserva `placementInference` hasta que la verificación real se
  procese;
- la fecha provisional usa `provisionalDueAt("inference", item.id, now)`;
- muestras de control se mezclan según la política de Fase 6;
- una confianza degradada reduce conversiones futuras.

Candidatos `usage`:

- `generationStatus === "ready"`;
- no retirados;
- `schedule.kind === "none"`;
- `context_usage` exige meaning estable;
- `advanced_usage` exige meaning y production maduros;
- una pérdida posterior de madurez bloquea nuevos usos, no retira activos.

Palabras nuevas:

- no introducidas;
- ordenadas por rank y política del corpus;
- el coste incluye introducción y activación de meaning.

- [ ] **Step 3: Ejecutar el planificador real**

```ts
const planningInput: DailyPlanningInput = {
  dailyBudgetSeconds: options.dailyBudgetSeconds,
  mandatory,
  candidates: {
    baseSkillActivations: candidates.baseSkillActivations,
    usageActivations: candidates.usageActivations,
    newWords: candidates.newWords,
  },
  estimatedSeconds: calibratedCosts,
  consumed: {
    baseSkillActivations: 0,
    usageActivations: 0,
    newWords: 0,
  },
  previousMode: world.previousMode,
};

const plan = planDailySession(
  planningInput,
  activationLimits,
  recoveryPolicy,
);
const queue = buildSkillQueue(plan);
```

No copiar el algoritmo de presupuesto dentro de la simulación. Si la
simulación necesita un adaptador, este solo traduce tipos.

- [ ] **Step 4: Simular la ejecución de la sesión**

```ts
export interface SimulatedCompletion {
  item: PlannedItem;
  assessment: AttemptAssessment;
}

export function completePlannedSession(
  queue: PlannedItem[],
  profile: SimulationProfile,
  costs: Record<AttemptModality, number>,
  budgetSeconds: number,
  random: RandomSource,
): SimulatedCompletion[];
```

La persona completa hasta su presupuesto real multiplicado por
`completionBudgetRatio`. Cada respuesta produce:

- modalidad del ítem;
- corrección según perfil y modalidad;
- latencia y duración coherentes con los costes;
- pistas, replays y firstTryFailed según tasas del perfil;
- `Grade` mediante `buildAssessment`, no mediante una tabla paralela.

- [ ] **Step 5: Aplicar resultados con `planAttemptRecord`**

```ts
for (const completion of completions) {
  const word = world.words.get(completion.item.wordId);
  if (!word) throw new Error("missing simulated word");

  const currentItems = itemsObservedBy(completion.item, word);
  const record = planAttemptRecord(
    {
      wordId: word.wordId,
      sessionId,
      assessment: completion.assessment,
      eventType: eventTypeFor(completion.item),
      currentItems,
    },
    context,
  );

  applyAttemptRecordToWorld(world, record);
}
```

`applyAttemptRecordToWorld`:

1. añade el `AttemptLog` una vez;
2. añade todos los `SrsReviewEvent`;
3. sustituye los ítems por `updatedItems`;
4. marca como introducida la palabra nueva;
5. asigna `activatedAt` a usage activado;
6. conserva como deferred todo obligatorio no completado;
7. no crea eventos para elementos solo presentados pero no respondidos.

- [ ] **Step 6: Métricas diarias**

```ts
export interface SimulatedDay {
  date: string;
  active: boolean;
  plannedSeconds: number;
  completedSeconds: number;
  plannedItems: number;
  completedItems: number;
  mandatorySelected: number;
  deferredMandatory: number;
  backlogSeconds: number;
  mode: "normal" | "recovery";
  newWords: number;
  baseSkillActivations: number;
  newWordMeaningActivations: number;
  usageActivations: number;
  provisionalDue: number;
  placementConversions: number;
  scheduledReviews: number;
  correctScheduledReviews: number;
  oldestDeferredAgeSessions: number;
  listeningEligibleWaiting: number;
  productionEligibleWaiting: number;
}
```

`plannedSeconds` viene de `DailyPlan`; `completedSeconds` de las interacciones
realmente ejecutadas. El criterio de carga usa planificado. La retención usa
solo `SrsReviewEvent` de revisiones programadas.

- [ ] **Step 7: Pruebas de dinámica no trivial**

```ts
it("activa listening y production a lo largo de 90 días", () => {
  const result = runSimulation(PROFILES.steady, options);
  expect(result.days.some((day) => day.baseSkillActivations > 0)).toBe(true);
  expect(result.worldCounts.activeListening).toBeGreaterThan(0);
  expect(result.worldCounts.activeProduction).toBeGreaterThan(0);
});

it("genera y vence provisionales", () => {
  const result = runSimulation(PROFILES.advanced, options);
  expect(result.days.some((day) => day.placementConversions > 0)).toBe(true);
  expect(result.days.some((day) => day.provisionalDue > 0)).toBe(true);
});

it("activa usage cuando se vuelve elegible", () => {
  const result = runSimulation(PROFILES.advanced, {
    ...options,
    days: 180,
  });
  expect(result.days.some((day) => day.usageActivations > 0)).toBe(true);
});

it("un día inactivo acumula deuda sin planificar sesión", () => {
  const result = runSimulation(PROFILES.bursty, options);
  const idle = result.days.find((day) => !day.active)!;
  expect(idle.plannedSeconds).toBe(0);
  expect(result.days.some((day) => day.backlogSeconds > 0)).toBe(true);
});

it("lo diferido no desaparece", () => {
  const result = runSimulation(PROFILES.bursty, options);
  expect(result.days.some((day) => day.deferredMandatory > 0)).toBe(true);
  expect(result.maxDeferredAgeSessions).toBeGreaterThan(0);
});

it("misma semilla reproduce el resultado completo", () => {
  const a = runSimulation(PROFILES.steady, options);
  const b = runSimulation(PROFILES.steady, options);
  expect(a).toEqual(b);
});
```

La simulación falla inmediatamente si, para un perfil elegible y horizonte
suficiente, una de estas series es permanentemente cero:

- `baseSkillActivations`;
- `provisionalDue`;
- `usageActivations`.

- [ ] **Step 8: Ejecutar y commit**

```bash
pnpm test lib/essential-words/simulation/__tests__/candidates.test.ts
pnpm test lib/essential-words/simulation/__tests__/apply-session.test.ts
pnpm test lib/essential-words/simulation/__tests__/run-simulation.test.ts
pnpm type-check
git add lib/essential-words/simulation/
git commit -m "feat(essential-words): simular ciclo real de habilidades provisionales y usage"
```

### Task 8.3: Once criterios de aprobación, uno por función

**Files:**
- Create: `lib/essential-words/simulation/criteria/load.ts`
- Create: `lib/essential-words/simulation/criteria/progress.ts`
- Create: `lib/essential-words/simulation/criteria/retention.ts`
- Create: `lib/essential-words/simulation/criteria/index.ts`
- Test: `lib/essential-words/simulation/__tests__/criteria-load.test.ts`
- Test: `lib/essential-words/simulation/__tests__/criteria-progress.test.ts`
- Test: `lib/essential-words/simulation/__tests__/criteria-retention.test.ts`

Separar los módulos si el conjunto supera 250 líneas.

Cada criterio debe tener:

- una función exportada;
- fórmula exacta;
- resultado estructurado con `passed` y diagnóstico;
- un test que pasa;
- un test que falla por la causa que pretende detectar.

```ts
export interface CriterionResult {
  passed: boolean;
  name: string;
  measured: number | null;
  limit: number | null;
  detail: string;
}
```

#### Criterio 1 — presupuesto en el 90 % de sesiones activas

```ts
export function budgetRespected(
  days: SimulatedDay[],
  dailyBudgetSeconds: number,
): CriterionResult;
```

- filtrar sesiones activas;
- aprobar si al menos 90 % tiene `plannedSeconds <= 1.2 × budget`;
- no contar días inactivos como sesiones perfectas;
- fallar con diagnóstico si no hay sesiones activas.

#### Criterio 2 — percentil 95

```ts
export function percentile95WithinBudget(
  days: SimulatedDay[],
  dailyBudgetSeconds: number,
): CriterionResult;
```

Calcular p95 sobre sesiones activas y exigir `<= 1.5 × budget`.

#### Criterio 3 — recovery no queda atrapado

```ts
export function recoveryExits(days: SimulatedDay[]): CriterionResult;
```

Si nunca entra en recovery, aprueba con detalle. Si entra, debe existir una
sesión activa posterior en modo normal.

#### Criterio 4 — backlog estable

```ts
export function backlogStable(
  days: SimulatedDay[],
  warmupSessions: number,
  maxFinalBudgetRatios: number,
  dailyBudgetSeconds: number,
): CriterionResult;
```

Exigir ambas condiciones:

1. pendiente por regresión lineal `<= 0` después del warm-up;
2. backlog final `<= maxFinalBudgetRatios × dailyBudgetSeconds`.

No basta con “no monotónico”.

#### Criterio 5 — vuelta tras ausencia

```ts
export function recoveryReturnSessions(
  days: SimulatedDay[],
  maximumActiveSessions: number,
): CriterionResult;
```

Para cada hueco largo seguido de recovery, contar sesiones activas hasta volver
a normal. Exigir máximo 14.

#### Criterio 6 — proporción de activaciones usage

```ts
export function usageActivationShare(
  days: SimulatedDay[],
  windowSessions: number,
  minimumDenominator: number,
  maximumShare: number,
): CriterionResult;
```

Denominador:

```text
baseSkillActivations
+ newWordMeaningActivations
+ usageActivations
```

Aplicar ventana móvil de siete sesiones activas y solo evaluar ventanas con al
menos diez activaciones.

#### Criterio 7 — picos sincronizados

```ts
export function noSynchronizedPeaks(
  days: SimulatedDay[],
  dailyBudgetSeconds: number,
): CriterionResult;
```

Un valor es pico si supera `1.5 × mediana` de las cuatro ventanas activas
anteriores. Fallar cuando:

- `provisionalDue` es pico;
- `usageActivations` es pico en la misma sesión;
- `plannedSeconds > 1.5 × dailyBudgetSeconds`.

#### Criterio 8 — liveness de palabras nuevas (capacity-conditioned, Task 8.9i)

```ts
export interface NewWordLivenessResult extends CriterionResult {
  highCapacitySessions: number;
  lowCapacitySessions: number;
  zeroCapacitySessions: number;
  longestStarvationRunSessions: number;
}

export function newWordLiveness(
  days: SimulatedDay[],
  targetNewWords: number,
  starvationLimitSessions?: number,
): NewWordLivenessResult;
```

**Semántica revisada (Task 8.9h/8.9i, Decisión 1 aprobada).** `targetNewWords`
es un máximo por sesión, no una cuota que deba alcanzarse en cualquier
régimen. En sesiones normales con backlog inferior a 80 % del presupuesto,
particionadas por `capacitySafeNewWords` (el forecast completo de admisión,
nunca recortado artificialmente):

- `capacitySafeNewWords >= ceil(target × 0.60)` ("alta capacidad"): exigir
  que lo admitido agregado alcance ese 60 %.
- `0 < capacitySafeNewWords < ceil(target × 0.60)` ("baja capacidad"):
  exento del 60 % nominal; solo se exige liveness (no starvation).
- `capacitySafeNewWords = 0`: exento por completo — el forecast ya probó
  que 0 es lo máximo posible.

Starvation: falla si existe una racha de sesiones consecutivas con
`capacitySafeNewWords > 0` y cero admitidas mayor que
`starvationLimitSessions` (por defecto 8, el mismo horizonte que C9). C8
nunca sustituye a C9 ni viceversa; la aceptación exige ambos de forma
independiente. Ver
[`2026-08-07-fase8-9h-c8-c9-spec-review.md`](../plans/notes/2026-08-07-fase8-9h-c8-c9-spec-review.md)
y
[`2026-08-07-fase8-9h-decision-record.md`](../plans/notes/2026-08-07-fase8-9h-decision-record.md).

#### Criterio 9 — liveness de habilidades base

```ts
export function baseSkillActivationLiveness(
  observations: EligibilityObservation[],
  maximumWaitingSessions: number,
): CriterionResult;
```

Una habilidad base elegible no permanece con `schedule.kind === "none"` más de
`Y` sesiones activas si existe presupuesto acumulado. Medir listening y
production por separado en el diagnóstico.

#### Criterio 10 — no starvation de atrasados

```ts
export function noOverdueStarvation(
  observations: DeferredObservation[],
  maximumWaitingSessions: number,
): CriterionResult;
```

Fallar si un obligatorio elegible acumula más de `Y` sesiones activas sin ser
seleccionado, salvo suspensión explícita. El diagnóstico incluye `itemId`,
tramo, dueAt y edad.

#### Criterio 11 — calibración de retención (Task 8.9i, Decisión 2 aprobada)

```ts
export interface SimulatedScheduledReview {
  retrievability: number;
  recalled: boolean;
  grade: Grade;
  eventType: "scheduled-review";
  affectsSchedule: true;
}

export type RetentionResult =
  | { status: "measured"; retention: number; sampleSize: number }
  | { status: "insufficient-data"; sampleSize: number; required: number };

export function observedRetention(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  minimumReviews: number,
): RetentionResult;

/** @deprecated superseded by retentionCalibrationWithinExpected (Task 8.9i). */
export function observedRetentionWithinTarget(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  target: number,
  tolerance: number,
  minimumReviews: number,
): CriterionResult;

export interface RetentionCalibrationResult extends CriterionResult {
  sampleSize: number;
  expectedRetention: number | null;
  observedRetentionValue: number | null;
  zScore: number | null;
}

export function retentionCalibrationWithinExpected(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  minimumReviews: number,
  zCriticalValue?: number,
): RetentionCalibrationResult;

export interface RetrievabilitySegmentResult {
  segment: "stable" | "low-stability-post-lapse";
  sampleSize: number;
  meanRetrievability: number | null;
}

export function meanRetrievabilityAtReview(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  lowStabilityThresholdDays?: number,
): RetrievabilitySegmentResult[];
```

Para cada revisión FSRS en estado `Review`, calcular primero la retrievability
con el schedule y el reloj inyectado, y después resolver
`recalled = seededRng.next() < retrievability`. La precisión o fluidez fija de
la modalidad no participa en `recalled`; solo puede afectar después el grade,
`latencyMs`, `interactionDurationMs` y otros parámetros secundarios.

Resolver `attemptLogId` contra `AttemptLog` y usar una sola vez cada intento
con `eventType === "scheduled-review"` que tenga un evento con
`affectsSchedule === true`. Excluir verification, practice, learning-step y
placement.

**Semántica revisada (Task 8.9i, Decisión 2 aprobada).** 8.9g demostró que
`recalled` sigue correctamente la retrievability calculada, pero que el
redondeo a día entero del scheduler FSRS compartido deprime la
retrievability real para ítems de `stability` baja — comparar
`observedRetention` contra un umbral fijo (`0,9 ± 0,05`) mezclaba esa
propiedad de scheduling con la calibración del propio pipeline
`recalled`/`retrievability`. C11 separa ambas cosas:

- `expectedRetention = mean(retrievabilityBeforeReview)` sobre las reviews
  elegibles.
- `observedRetention = correct / n`.
- `z = (observedRetention − expectedRetention) / sqrt(expectedRetention × (1 − expectedRetention) / n)`.
- C11 aprueba si `|z| <= 3` (no 1.96/95 %: con miles de reviews elegibles, un
  95 % marca ruido de muestreo como "no calibrado" — ver la nota de decisión
  8.9i). Por debajo de `minimumReviews`, falla explícitamente
  (`insufficient-data`), nunca aprueba de forma vacía.
- No usa `desiredRetention` como comparador directo, no usa
  `accuracyByModality`, no usa umbrales distintos por perfil.

La calidad de scheduling (¿el scheduler alcanza ~0,90 de retrievability?) se
mide aparte, sin decidir pass/fail, con `meanRetrievabilityAtReview`,
segmentada en `stable` y `low-stability-post-lapse` (`stability` previa
< 1 día). Un segmento puede estar lejos de 0,90 mientras C11 sigue en verde
— eso es esperado, no un fallo de C11. Ver
[`2026-08-07-fase8-9h-c8-c9-spec-review.md`](../plans/notes/2026-08-07-fase8-9h-c8-c9-spec-review.md)
(Parte B) y
[`2026-08-07-fase8-9h-decision-record.md`](../plans/notes/2026-08-07-fase8-9h-decision-record.md)
(Decisión 2).

- [ ] **Step 2: Tests de éxito y fallo**

Ejemplos mínimos:

```ts
it("criterio 9 falla si listening nunca se activa", () => {
  const observations = eligibleForSessions("c1k:on#listening", 20);
  expect(baseSkillActivationLiveness(observations, 8).passed).toBe(false);
});

it("criterio 10 detecta un atrasado que baja ocasionalmente de posición", () => {
  const observations = deferredForSessions("c1k:on#meaning", 30);
  expect(noOverdueStarvation(observations, 12).passed).toBe(false);
});

it("criterio 11 falla con retención muy inferior al objetivo", () => {
  const events = scheduledEvents({ total: 100, correct: 55 });
  expect(observedRetentionWithinTarget(
    attemptsFor(events, "scheduled-review"),
    events,
    0.9,
    0.05,
    50,
  ).passed).toBe(false);
});
```

- [ ] **Step 3: Ejecutar y commit**

```bash
pnpm test lib/essential-words/simulation/__tests__/criteria-load.test.ts
pnpm test lib/essential-words/simulation/__tests__/criteria-progress.test.ts
pnpm test lib/essential-words/simulation/__tests__/criteria-retention.test.ts
pnpm type-check
git add lib/essential-words/simulation/
git commit -m "feat(essential-words): once criterios de carga progreso y retencion"
```

### Task 8.4: Aceptación sobre perfiles y motores adversariales

**Files:**
- Create: `lib/essential-words/simulation/__tests__/acceptance.test.ts`
- Create: `lib/essential-words/simulation/adversarial.ts`
- Create: `lib/essential-words/simulation/__tests__/adversarial.test.ts`

- [ ] **Step 1: Ejecutar los once criterios explícitamente**

```ts
// lib/essential-words/simulation/__tests__/acceptance.test.ts
import { describe, expect, it } from "vitest";
import {
  baseSkillActivationLiveness,
  backlogStable,
  budgetRespected,
  newWordLiveness,
  noOverdueStarvation,
  noSynchronizedPeaks,
  observedRetentionWithinTarget,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
  usageActivationShare,
} from "../criteria";
import { PROFILES } from "../profiles";
import { runSimulation } from "../run-simulation";

const options = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

for (const profile of Object.values(PROFILES)) {
  describe(`perfil ${profile.id}`, () => {
    const result = runSimulation(profile, options);

    it("criterio 1 — presupuesto", () => {
      expect(budgetRespected(result.days, 900)).toMatchObject({ passed: true });
    });

    it("criterio 2 — p95", () => {
      expect(percentile95WithinBudget(result.days, 900))
        .toMatchObject({ passed: true });
    });

    it("criterio 3 — salida recovery", () => {
      expect(recoveryExits(result.days)).toMatchObject({ passed: true });
    });

    it("criterio 6 — cuota usage", () => {
      expect(usageActivationShare(result.days, 7, 10, 0.3))
        .toMatchObject({ passed: true });
    });

    it("criterio 7 — picos sincronizados", () => {
      expect(noSynchronizedPeaks(result.days, 900))
        .toMatchObject({ passed: true });
    });

    it("criterio 9 — liveness base", () => {
      expect(baseSkillActivationLiveness(result.eligibility, 8))
        .toMatchObject({ passed: true });
    });

    it("criterio 10 — no starvation", () => {
      expect(noOverdueStarvation(result.deferredObservations, 12))
        .toMatchObject({ passed: true });
    });

    it("criterio 11 — retención", () => {
      expect(observedRetentionWithinTarget(
        result.attemptLogs,
        result.srsEvents,
        0.9,
        0.05,
        50,
      )).toMatchObject({ passed: true });
    });
  });
}

describe("criterios específicos", () => {
  const steady = runSimulation(PROFILES.steady, options);
  const bursty = runSimulation(PROFILES.bursty, options);

  it("criterio 4 — backlog estable en constante", () => {
    expect(backlogStable(steady.days, 14, 2, 900))
      .toMatchObject({ passed: true });
  });

  it("criterio 5 — regreso tras ausencia", () => {
    expect(recoveryReturnSessions(bursty.days, 14))
      .toMatchObject({ passed: true });
  });

  it("criterio 8 — nuevas cuando no hay presión", () => {
    expect(newWordLiveness(steady.days, 10))
      .toMatchObject({ passed: true });
  });
});
```

No agrupar los criterios en una función opaca que oculte que uno no se llamó.
El test debe importar y ejecutar los once nombres.

- [ ] **Step 2: Implementar motores adversariales**

```ts
export type SimulationMutation =
  | "never-listening"
  | "never-production"
  | "never-usage"
  | "zero-new-words"
  | "ignore-placement"
  | "duplicate-base-activations"
  | "starve-overdue"
  | "show-entire-recovery-backlog"
  | "synchronize-provisionals"
  | "low-retention";

export function runAdversarialSimulation(
  mutation: SimulationMutation,
  profile: SimulationProfile,
  options: SimulationOptions,
): SimulationResult;
```

La mutación se inyecta en un punto explícito del arnés. No copiar el motor
completo diez veces.

- [ ] **Step 3: Fijar el criterio que debe detectar cada defecto**

| Motor defectuoso | Criterio mínimo que debe fallar |
|---|---|
| nunca listening | 9 |
| nunca production | 9 |
| nunca usage | 6 o prueba de no trivialidad |
| cero nuevas | 8 |
| ignora placement | 7 o 9 más prueba de conversiones |
| duplica base | 1, 2 o invariante de allowance |
| posterga atrasado | 10 |
| muestra backlog completo | 1 o 2 |
| sincroniza provisionales | 7 |
| retención baja | 11 |

```ts
it.each([
  ["never-listening", 9],
  ["never-production", 9],
  ["zero-new-words", 8],
  ["starve-overdue", 10],
  ["synchronize-provisionals", 7],
  ["low-retention", 11],
] as const)("%s falla el criterio %s", (mutation, criterion) => {
  const result = runAdversarialSimulation(
    mutation,
    PROFILES.steady,
    options,
  );
  expect(failedCriterionNumbers(result)).toContain(criterion);
});
```

Para `never-usage` e `ignore-placement`, además del criterio numérico exigir
que la prueba de dinámica no trivial falle. Esto evita declarar éxito porque
el denominador de usage nunca alcanzó el mínimo.

- [ ] **Step 4: Ejecutar**

```bash
pnpm test lib/essential-words/simulation/__tests__/acceptance.test.ts
pnpm test lib/essential-words/simulation/__tests__/adversarial.test.ts
```

Expected: puede fallar por parámetros provisionales. No puede fallar porque una
serie necesaria sea siempre cero, porque falte una función o porque un criterio
no esté invocado.

- [ ] **Step 5: Commit del arnés**

```bash
git add lib/essential-words/simulation/
git commit -m "test(essential-words): aceptacion y motores adversariales del planificador"
```

### Estado de parada de la Fase 8

La ejecución se detuvo en la antigua Task 8.5. No iniciar Fase 9 ni una tarea
posterior de calibración hasta completar las Tasks 8.5–8.12. Los umbrales de
C1–C11 permanecen literalmente iguales. El diagnóstico reproducible está en
[`2026-08-06-fase8-calibracion.md`](../plans/notes/2026-08-06-fase8-calibracion.md).

**Regla transversal:** después de cada cambio de Tasks 8.5–8.11 se ejecutan los
cinco perfiles y los diez adversariales, y se registra el delta de C1–C11.
Ninguna tarea se considera verde solo por sus tests unitarios.

### Contratos revisados de simulación y planificación

#### Fórmula exacta de C11

Sea `A` el mapa de `AttemptLog` por `id`. El conjunto evaluable es:

```text
E = { event |
  event.affectsSchedule = true
  ∧ A[event.attemptLogId].eventType = "scheduled-review"
}
```

La clasificación del intento garantiza que solo un FSRS en estado `Review`
usa `scheduled-review`; `New | Learning | Relearning` usan `learning-step`, y
verification, practice y placement conservan sus tipos no programados. La
simulación calcula la retrievability antes de construir el intento, usando
`lastReview`, `stability` y los parámetros versionados del mismo scheduler
FSRS:

```text
t_i = max(0, (now_i - lastReview_i) / DAY_MS)
decay = -w[20]
factor = exp(log(0.9) / decay) - 1
r_i = clamp(round((1 + factor × t_i / stability_i) ^ decay, 8), 0, 1)
u_i = siguiente valor del PRNG semillado de la simulación
correct_i = 1 si u_i < r_i; 0 en otro caso

n = número de attemptLogId únicos en E
observedRetention = (Σ correct_i) / n
```

El evento persiste `fsrsAudit.retrievabilityBeforeReview = r_i`, junto con las
versiones de scheduler y parámetros. C11 usa `assessment.correct` para el
cociente y ese audit para demostrar el modelo; no intenta reconstruir `r_i`
desde `priorSchedule`, porque `lastReview` no vive dentro de `ItemSchedule`.

`desiredRetention` controla el vencimiento FSRS y, por tanto, la distribución
de `r_i`. **(Actualizado, Task 8.9i, Decisión 2 aprobada)** C11 ya no compara
`observedRetention` contra `desiredRetention ± tolerancia`; compara
`observedRetention` contra `expectedRetention = mean(r_i)` de la misma
muestra, vía un z-test (`|z| <= 3`, ver Criterio 11 arriba). Esto separa la
calibración del pipeline `recalled`/`retrievability` (C11) de si el
scheduler realmente alcanza `desiredRetention ≈ 0,90` (medido aparte por
`meanRetrievabilityAtReview`, sin decidir pass/fail). Si `n < 50`, devuelve
`insufficient-data` y la aceptación continúa roja — igual que antes.

La modalidad no participa en `correct_i`. Sí puede cambiar la distribución de
`latencyMs`, `interactionDurationMs`, dificultad, pistas y la frontera
`Easy/Good`. `accuracyByModality` permanece disponible para verification,
practice y learning-step, nunca como techo de una revisión `Review` vencida.

#### Ledger exacto de ocho sesiones activas

El horizonte es `H = 8` sesiones activas ordinales. Un día sin práctica no
consume slot. El planificador recibe un `ActiveSessionForecast` explícito; la
simulación usa su calendario semillado. Si el runtime no puede proyectar ocho
sesiones, el ledger devuelve `insufficient-forecast` y bloquea nuevas palabras
y conversiones placement, pero sigue sirviendo obligatorios y base pendiente.

Cada slot `s ∈ [1, 8]` contiene:

```ts
interface ForecastSessionCapacity {
  sessionOffset: number; // 1..8
  availableSeconds: number;
  listeningSeconds: number;
  productionSeconds: number;
}

interface CapacityReservation {
  itemId: string;
  source: "pending-base" | "placement" | "usage" | "new-word";
  skill: Skill;
  deadlineSession: number;
  estimatedSeconds: number;
}

interface ForecastCapacityDemand {
  itemId: string;
  skill: Skill;
  deadlineSession: number;
  estimatedSeconds: number;
}
```

`availableSeconds` es compartido. Una reserva siempre lo descuenta y, si es
listening o production, descuenta además su carril. Los carriles nunca amplían
el presupuesto compartido. Una reserva cabe únicamente si su coste es finito,
no negativo y cabe en ambos saldos aplicables.

La entrada deja de mezclar categorías bajo `mandatory` o `candidates`:

```ts
interface ForecastPlanningInput {
  activeSessions: readonly ForecastSessionCapacity[]; // exactamente 8
  mandatoryReviews: readonly PlannedItem[]; // FSRS Review
  learningSteps: readonly PlannedItem[]; // New, Learning, Relearning
  pendingBaseSkills: readonly ActivationCandidate[];
  placementCandidates: readonly PlacementCandidate[];
  usageCandidates: readonly ActivationCandidate[];
  newWordCandidates: readonly NewWordCandidate[];
  deferredWork: readonly DeferredWork[];
  futureReservations: readonly CapacityReservation[];
  estimatedSeconds: CalibratedOrFallbackCosts;
}
```

El `DailyPlan` conserva esas categorías separadas en selección, diferidos y
telemetría; ninguna se reconstruye después desde una cola plana.

El ledger se construye y reserva en este orden estable:

1. reservas futuras ya persistidas que entren en el horizonte;
2. revisiones `Review` obligatorias;
3. learning steps `New | Learning | Relearning`;
4. trabajo obligatorio diferido, conservando `firstDeferredSession`;
5. habilidades base pendientes, por deadline C9 e `itemId`;
6. conversiones placement que superen su reserva atómica;
7. `usage`, únicamente con capacidad residual;
8. palabras nuevas, únicamente con capacidad residual y reserva atómica.

Dentro de una prioridad se usa earliest-deadline-first y luego `itemId`. Cada
reserva lleva `itemId`, `source`, `skill`, `deadlineSession` y
`estimatedSeconds`; el slot confirmado queda reflejado en `deadlineSession`.

Para una palabra nueva se clona el ledger y se intenta, como una transacción:

1. comprobar que introducción + meaning cabe en la sesión actual;
2. reservar listening en el primer slot futuro con capacidad;
3. reservar production en el primer slot posterior a listening y como máximo
   en `sessionOffset = 8`;
4. confirmar ambas reservas solo si las dos caben; de lo contrario, revertir la
   copia y no admitir la palabra.

El máximo diario queda subordinado al ledger:

```text
newWords = min(configuredNewWordLimit, capacitySafeNewWords)
```

Por tanto, toda palabra admitida tiene listening y production reservados dentro
de ocho sesiones activas. Un límite diario fijo puede coexistir como protección
secundaria, pero nunca sustituye esta transacción.

#### Reserva de placement

Cada candidato inferido se evalúa contra una copia del mismo ledger, en orden
estable `control sample → inferredAt → itemId`. Una conversión solo confirma si:

1. listening cabe en el primer slot con capacidad entre `0` y `6`, y production
   cabe en el primer slot posterior, como máximo `7`;
2. la verificación provisional cabe en el primer slot activo proyectado cuya
   fecha sea `>= dueAt`;
3. ningún slot compartido queda con saldo negativo;
4. el deadline C9 de ninguna habilidad base existente se desplaza.

`dueAt` conserva la ventana provisional. Para distribuir cohortes se recorren
determinísticamente los offsets permitidos comenzando por
`hash(itemId) mod windowLength`; se elige el primer `dueAt` cuyo bucket tenga
capacidad. Si ninguno cabe, no se convierte el ítem.

El forecast de placement cubre los ocho slots de servicio y, adicionalmente,
los buckets fechados hasta el máximo de la ventana provisional. Una reserva
fuera de los ocho slots se persiste como `futureReservation` y entra en el
ledger cuando su fecha alcanza el horizonte. Sin forecast hasta `dueAt`, la
conversión devuelve `insufficient-forecast`; no usa el límite diario como
aproximación.

#### Gate de datos empíricos

Implementación: `lib/essential-words/calibration/` (Task 8.8). La telemetría de
calibración se **deriva** de `AttemptLog` + flags opcionales / `priorSchedule`
(`toInteractionTelemetry`); no hay tabla Dexie/Supabase nueva. `userId` en
`AttemptLogRecord` permite `minDistinctUsersPerModality`.

**Separación de tiempos (nunca mezclar):**

| Campo | Definición | Uso |
| --- | --- | --- |
| `latencyMs` | Ventana de respuesta relevante para Easy/Good. Sin carga previa, red, transición posterior ni background. | Dataset de latencia |
| `interactionDurationMs` | Coste completo: presentación, audio, lectura, respuesta, feedback y transición de la interacción. | Dataset de coste |

Invariante: `interactionDurationMs >= latencyMs` en interacciones válidas
(salvo fallo técnico documentado). `buildAssessment` ya aplica
`max(context, latencyMs)`.

**Autonomía (`isAutonomousLatencySample`) — solo latencia Easy/Good:**

```
correct
&& !usedHints && !rescued && !acceptedVariant && !firstTryFailed
&& freeAudioReplays === 0
&& priorScheduleState === "Review"
&& source !== "synthetic"
&& timing válido && !technicalFailure && !interrupted && !debugSession
```

Coste puede incluir correctas e incorrectas (ambas consumen tiempo) y practice
con hints si el evento es elegible; excluye abandonos técnicos, debug,
background/interrupted, duplicados, duraciones inválidas y `source: "synthetic"`.

**Política versionada (`CalibrationDataPolicy` v1):**

- `minSamplesPerModality = 200`
- `minDistinctUsersPerModality = 20`
- estadística: mediana tras filtro MAD (`multiplier = 3`, escala 1,4826)
- si `MAD = 0`, conservar todas las finitas
- no usar media aritmética como estimador del gate

**Resultado discriminado (`evaluateCalibrationGate`):**

```ts
type CalibrationDatasetStatus =
  | { status: "ready"; cost: CalibrationSummary; latency: CalibrationSummary }
  | { status: "insufficient-data"; missing: CalibrationGap[] };
```

`insufficient-data` **nunca** se convierte en `ready` vía fallback. El producto
puede seguir usando `DEFAULT_COST_FALLBACK` / `DEFAULT_LATENCY_FALLBACK`
(`provenance: "fallback"`) mientras el gate no esté ready. Una cohorte
`source: "synthetic"` (simulación) nunca satisface el gate empírico.

**Desbloqueo posterior:** 8.11 solo fija costes/latencia cuando el gate es
`ready` por modalidad; 8.12 exige dataset empírico listo además de C1–C11.
No modificar umbrales C1–C11 en esta instrumentación.

### Task 8.5: Modelo determinista de C11

**Files:**
- Create: `lib/essential-words/simulation/scheduled-review-outcome.ts`
- Create: `lib/essential-words/simulation/simulated-outcome.ts`
- Create: `lib/essential-words/simulation/types.ts`
- Modify: `lib/essential-words/simulation/apply-session.ts`
- Modify: `lib/essential-words/simulation/criteria/retention.ts`
- Modify: `lib/essential-words/verification/types.ts`
- Modify: `lib/essential-words/record-attempt.ts`
- Test: `lib/essential-words/simulation/__tests__/scheduled-review-outcome.test.ts`
- Test: `lib/essential-words/simulation/__tests__/criteria-retention.test.ts`

Implementar la fórmula anterior sin tocar sus límites. Tests obligatorios:

- misma semilla y schedules producen la misma secuencia;
- `10.000` reviews con `retrievability = 0,90` quedan entre `0,85` y `0,95`;
- cambiar `accuracyByModality` no cambia la corrección de scheduled Review;
- el evento audita retrievability y versiones de scheduler/parámetros;
- verification, practice, New, Learning y Relearning no entran en C11;
- `49` muestras devuelven `insufficient-data`; `50` sí se evalúan;
- una muestra controlada y suficiente programada alrededor de
  `desiredRetention = 0,90` cierra C11 sin alterar C1–C10; el baseline completo
  puede seguir rojo por retrasos/capacidad hasta las tareas posteriores.

### Task 8.6: Forecast y ledger de ocho sesiones

**Files:**
- Create: `lib/essential-words/capacity-forecast.ts`
- Create: `lib/essential-words/admission-control.ts`
- Create: `lib/essential-words/future-capacity.ts`
- Modify: `lib/essential-words/planning-types.ts`
- Modify: `lib/essential-words/daily-budget.ts`
- Modify: `lib/essential-words/simulation/run-simulation.ts`
- Create: `lib/essential-words/simulation/capacity.ts`
- Create: `lib/essential-words/simulation/capacity-state.ts`
- Test: `lib/essential-words/__tests__/capacity-forecast.test.ts`
- Test: `lib/essential-words/__tests__/admission-control.test.ts`

Implementar slots, prioridades, earliest-deadline-first y transacciones de
reserva. Tests obligatorios:

- inactividad no consume un slot activo;
- las capacidades por modalidad comparten segundos y no se duplican;
- obligatorios, learning, diferidos y base se reservan antes que usage/nuevas;
- listening y production se confirman o revierten juntos;
- una sola habilidad sin capacidad rechaza la palabra completa;
- dos ejecuciones con el mismo forecast producen el mismo ledger;
- el backlog base existente conserva deadline C9 ≤8.

### Task 8.7: Placement sobre reservas futuras

**Files:**
- Modify: `lib/essential-words/placement/policy.ts`
- Modify: `lib/essential-words/verification/provisional-intervals.ts`
- Modify: `lib/essential-words/simulation/candidates.ts`
- Test: `lib/essential-words/placement/__tests__/capacity-reservations.test.ts`

Eliminar el límite diario como condición suficiente. Tests obligatorios:

- una conversión reserva listening, production y su provisional atómicamente;
- una cohorte que rompería C9 no se convierte;
- colisiones de `dueAt` se distribuyen dentro de la ventana sin aleatoriedad;
- sin forecast hasta `dueAt` se devuelve `insufficient-forecast`;
- una reserva futura reaparece al entrar en los ocho slots;
- control samples conservan prioridad sin saltarse capacidad.

### Task 8.8: Telemetría y dataset empírico

**Files:**
- Create: `lib/essential-words/calibration/types.ts`
- Create: `lib/essential-words/calibration/policy.ts`
- Create: `lib/essential-words/calibration/telemetry.ts`
- Create: `lib/essential-words/calibration/dataset.ts`
- Create: `lib/essential-words/calibration/robust-estimate.ts`
- Modify: `lib/essential-words/cost-estimate.ts` (documentar fallback; no sustituir valores)
- Modify: `lib/essential-words/verification/latency.ts` (idem)
- Test: `lib/essential-words/calibration/__tests__/dataset.test.ts`
- Test: `lib/essential-words/calibration/__tests__/robust-estimate.test.ts`
- Test: `lib/essential-words/calibration/__tests__/filters-and-fallback.test.ts`

Persistencia: opción A — derivar desde `AttemptLog` (sin tabla nueva).

Tests obligatorios (A–R del brief): separación duration/latency; invariante
`duration >= latency`; coste vs autonomía; exclusiones quality/synthetic;
umbral 200×20; MAD robusto; fallback versionado; serialización sin contenido
pedagógico; instrumentación sin cambiar grading/schedule.

### Task 8.9: Recalibración estructural

Reejecutar baseline y ajustar exclusivamente estructura/capacidad para cerrar
C1–C5 y C8–C11, en ese orden. Después de cada cambio ejecutar los cinco
perfiles y los diez adversariales. Registrar impacto en todos los criterios.
No tocar madurez ni latencia en esta tarea.

### Task 8.10: Calibración de `MaturityPolicy`

Solo empieza con C1–C5 y C8–C11 verdes. Ajustar madurez y reejecutar C6, C7 y
C9 después de cada cambio, además de los cinco perfiles y diez adversariales.
`mature` sigue derivado y no reescribe historial.

### Task 8.11: Costes y latencia

Solo empieza cuando cada modalidad tiene dataset empírico `ready`. Fijar costes
desde `interactionDurationMs` y Easy/Good desde `latencyMs`; versionar valores y
fallbacks por separado. Después de cada ajuste ejecutar perfiles y
adversariales. No usar datos sintéticos como calibración final.

### Task 8.12: Cierre y versionado

Fijar los ocho grupos y reemplazar comentarios provisionales únicamente cuando:

- C1–C11 estén verdes en todos los perfiles aplicables;
- los diez adversariales estén verdes;
- ningún resultado sea `insufficient-sample`, `insufficient-forecast` o
  `insufficient-data`;
- el dataset empírico cumpla `200` muestras por modalidad;
- la nota de calibración registre valores, versiones, series y comandos.

Hasta entonces la Fase 8 permanece abierta y Fase 9 bloqueada. Ejecutar suite,
type-check y lint solo para cerrar, sin `git add -A` en un worktree mixto.

---

## Fase 9 — Integración y rollout real bajo flag

**Objetivo:** conectar el motor nuevo a rutas reales sin retirar todavía el
modelo antiguo. Esta fase convierte el feature flag en un mecanismo operativo,
no en una constante creada y eliminada sin uso.

**Precondiciones:** fases 0–8 verdes, simulación no trivial, once criterios en
verde y parámetros versionados.

**Condición de salida:** existe evidencia de un rollout `off → shadow → on`, sin
doble escritura, con rollback probado y métricas suficientes para decidir la
retirada.

### Task 9.1: Router único `off | shadow | on`

**Files:**
- Modify: `lib/feature-flags.ts`
- Create: `lib/essential-words/engine-router.ts`
- Test: `lib/essential-words/__tests__/engine-router.test.ts`
- Integration test: `lib/essential-words/__tests__/engine-router.integration.test.ts`

- [ ] **Step 1: Definir modos y resolución estable de cohorte**

```ts
export type SkillEngineMode = "off" | "shadow" | "on";

export interface SkillEngineRolloutConfig {
  mode: SkillEngineMode;
  cohortPercent: number;
  cohortSalt: string;
  internalUsers: readonly string[];
}

export function resolveSkillEngineMode(
  userId: string,
  config: SkillEngineRolloutConfig,
): SkillEngineMode;
```

Reglas:

- `off` siempre devuelve viejo;
- usuarios internos pueden entrar primero en shadow/on;
- la cohorte se calcula con hash estable de `userId + salt`;
- el mismo usuario no cambia de cohorte entre sesiones;
- cambiar de `shadow` a `on` no cambia la asignación de cohorte;
- no usar `Math.random()` para rollout.

Tests:

```ts
it("la cohorte es estable", () => {
  const a = resolveSkillEngineMode("user-1", config);
  const b = resolveSkillEngineMode("user-1", config);
  expect(a).toBe(b);
});

it("off nunca ejecuta el motor nuevo", () => { /* ... */ });
it("internal user puede entrar aunque cohortPercent sea cero", () => { /* ... */ });
```

- [ ] **Step 2: Definir el router como único punto de bifurcación**

```ts
export interface EssentialWordsEngine {
  buildSession(input: BuildSessionInput): Promise<SessionPlan>;
  recordAttempt(input: RecordAttemptInput): Promise<void>;
  getProgress(input: ProgressInput): Promise<ProgressSnapshot>;
}

export interface EssentialWordsEngineRouter {
  buildSession(input: BuildSessionInput): Promise<SessionPlan>;
  recordAttempt(input: RecordAttemptInput): Promise<void>;
  getProgress(input: ProgressInput): Promise<ProgressSnapshot>;
}
```

El router recibe implementaciones `legacyEngine`, `skillEngine` y
`shadowComparator`. Hooks, componentes y repositorios no consultan el flag por
su cuenta.

- [ ] **Step 3: Semántica de cada modo**

`off`:

- lectura de sesión desde `SRSData`;
- escritura solo por la ruta antigua;
- no crea `LearningItem`, `AttemptLog` ni `SrsReviewEvent` por interacción;
- la migración previa puede existir, pero no decide experiencia.

`on`:

- lectura desde `LearningItem`;
- sesión con `planDailySession` y `buildSkillQueue`;
- escritura solo mediante `persistAttemptRecord`;
- no llama `saveSRSData` para prefijo `c1k:`;
- conserva `answer_history` por ser ortogonal.

`shadow`:

- legacy decide la sesión y es el único que escribe;
- skill engine calcula en memoria con snapshot de datos;
- no abre transacción de persistencia nueva;
- no crea outbox nuevo;
- registra solo métricas agregadas de comparación.

- [ ] **Step 4: Tests contra doble escritura**

```ts
it.each(["off", "shadow"] as const)(
  "%s no persiste el bundle del motor nuevo",
  async (mode) => {
    await router(mode).recordAttempt(attemptInput);
    expect(skillPersistence.saveAttemptBundle).not.toHaveBeenCalled();
    expect(legacyPersistence.saveSRSData).toHaveBeenCalledTimes(1);
  },
);

it("on persiste solo el bundle nuevo", async () => {
  await router("on").recordAttempt(attemptInput);
  expect(skillPersistence.saveAttemptBundle).toHaveBeenCalledTimes(1);
  expect(legacyPersistence.saveSRSData).not.toHaveBeenCalled();
});
```

Añadir un test de integración que inspeccione Dexie/outbox después de una
interacción en cada modo.

- [ ] **Step 5: Ejecutar y commit**

```bash
pnpm test lib/essential-words/__tests__/engine-router.test.ts
pnpm test lib/essential-words/__tests__/engine-router.integration.test.ts
pnpm type-check
git add lib/feature-flags.ts lib/essential-words/engine-router.ts lib/essential-words/__tests__/
git commit -m "feat(essential-words): router off shadow on sin doble escritura"
```

### Task 9.2: Comparación shadow y telemetría agregada

**Files:**
- Create: `lib/essential-words/shadow-metrics.ts`
- Create: `lib/essential-words/shadow-runner.ts`
- Test: `lib/essential-words/__tests__/shadow-metrics.test.ts`
- Test: `lib/essential-words/__tests__/shadow-runner.test.ts`

- [ ] **Step 1: Definir una salida de comparación sin datos sensibles**

```ts
export interface ShadowComparison {
  occurredAt: string;
  cohort: string;
  legacy: {
    queueSize: number;
    dueCount: number;
    estimatedSeconds: number;
  };
  skill: {
    queueSize: number;
    mandatorySelected: number;
    deferredMandatory: number;
    estimatedSeconds: number;
    baseSkillActivations: number;
    usageActivations: number;
    mode: "normal" | "recovery";
  };
  differences: {
    queueSize: number;
    estimatedSeconds: number;
    dueCount: number;
  };
  errors: string[];
}
```

No guardar respuesta textual, frase del usuario, audio ni observaciones
individuales. Los IDs de palabra no son necesarios para la métrica agregada.

- [ ] **Step 2: Ejecutar shadow sin mutación**

```ts
export async function runShadowComparison(
  input: BuildSessionInput,
  legacy: EssentialWordsEngine,
  skill: ReadonlySkillEngine,
): Promise<{ session: SessionPlan; comparison: ShadowComparison }>;
```

La sesión devuelta siempre es la legacy. El motor skill recibe repositorios de
solo lectura o una transacción abortada deliberadamente. Un test debe fallar si
intenta llamar a:

- `persistAttemptRecord`;
- `saveAttemptBundle`;
- `saveSRSData` por segunda vez;
- outbox de tablas nuevas.

- [ ] **Step 3: Métricas mínimas**

Registrar:

- diferencia de cantidad y minutos de cola;
- porcentaje de sesiones donde skill entraría en recovery;
- distribución de `deferredMandatory`;
- activaciones base y usage propuestas;
- errores de mapeo/migración;
- discrepancias de `dueAt` agrupadas por rango, no por palabra;
- tiempo de cómputo del motor nuevo;
- fallos de reconstrucción desde eventos;
- entradas de outbox fallidas por tabla en modo on, no shadow.

Definir denominadores y tratamiento de sesiones vacías en el módulo.

- [ ] **Step 4: Tests de agregación**

```ts
it("no incluye respuestas ni ids de palabra", () => { /* ... */ });
it("shadow devuelve la sesión legacy aunque skill difiera", () => { /* ... */ });
it("una excepción del skill engine no rompe la sesión legacy", () => { /* ... */ });
it("clasifica discrepancias de minutos por bucket", () => { /* ... */ });
it("no persiste intento, evento ni outbox", () => { /* ... */ });
```

- [ ] **Step 5: Commit**

```bash
pnpm test lib/essential-words/__tests__/shadow-metrics.test.ts
pnpm test lib/essential-words/__tests__/shadow-runner.test.ts
git add lib/essential-words/shadow-metrics.ts lib/essential-words/shadow-runner.ts lib/essential-words/__tests__/
git commit -m "feat(essential-words): comparar motores en shadow sin mutacion"
```

### Task 9.3: Rollout por cohorte y rollback

**Files:**
- Create: `lib/essential-words/rollout-gate.ts`
- Test: `lib/essential-words/__tests__/rollout-gate.test.ts`
- Create: `docs/superpowers/plans/notes/2026-08-06-fase9-rollout.md`

- [ ] **Step 1: Definir etapas**

```text
Etapa A — off global
Etapa B — shadow interno
Etapa C — shadow cohorte pequeña
Etapa D — on interno
Etapa E — on cohorte pequeña
Etapa F — ampliación gradual
```

No saltar directamente de off a on global.

- [ ] **Step 2: Definir observación mínima**

Antes de promover una cohorte:

- al menos 14 días naturales;
- al menos 100 sesiones activas de la cohorte;
- al menos 50 revisiones programadas para estimar retención;
- cero double-write detectado;
- cero eventos huérfanos;
- reconstrucción de muestra aleatoria satisfactoria;
- outbox fallido por debajo del umbral documentado;
- backlog, p95 y recovery dentro de límites;
- discrepancias shadow explicadas.

Si el tamaño de muestra no alcanza, el gate devuelve `insufficient-data`, no
`passed`.

- [ ] **Step 3: Probar rollback**

Rollback `on → off`:

- deja de leer y escribir el motor nuevo;
- no borra `LearningItem`, intentos ni eventos;
- no reprograma tarjetas;
- no transforma datos nuevos en `SRSData` sintético;
- la próxima reactivación de on continúa desde el historial nuevo;
- documenta si las sesiones legacy y skill divergen mientras off.

```ts
it("rollback no borra ni reescribe datos nuevos", async () => {
  await runSessionsInOnMode(20);
  const before = await snapshotSkillTables();
  await switchMode("off");
  await runLegacySession();
  const after = await snapshotSkillTables();
  expect(after).toEqual(before);
});
```

- [ ] **Step 4: Nota de rollout**

La nota debe registrar:

- configuración exacta por etapa;
- hash de commit desplegado;
- inicio/fin y tamaños de muestra;
- métricas y límites;
- incidentes;
- discrepancias aceptadas y explicación;
- pruebas de rollback;
- decisión de avanzar, mantener o volver a off.

- [ ] **Step 5: Commit**

```bash
pnpm test lib/essential-words/__tests__/rollout-gate.test.ts
git add lib/essential-words/rollout-gate.ts lib/essential-words/__tests__/rollout-gate.test.ts docs/superpowers/plans/notes/2026-08-06-fase9-rollout.md
git commit -m "feat(essential-words): gate de rollout por cohorte y rollback"
```

### Task 9.4: Gate formal para retirada

**Files:**
- Modify: `lib/essential-words/rollout-gate.ts`
- Test: `lib/essential-words/__tests__/retirement-gate.test.ts`
- Modify: `docs/superpowers/plans/notes/2026-08-06-fase9-rollout.md`

- [ ] **Step 1: Definir el resultado discriminado**

```ts
export type RetirementGateResult =
  | { status: "passed"; evidence: RetirementEvidence }
  | { status: "blocked"; blockers: string[] }
  | { status: "insufficient-data"; missing: string[] };
```

- [ ] **Step 2: Precondiciones obligatorias**

La Fase 10 solo se desbloquea si:

1. simulación y adversariales están verdes;
2. los once criterios fueron ejecutados;
3. cero double-write;
4. intentos/eventos se reconstruyen por ítem;
5. no existen eventos huérfanos;
6. outbox de `learning_items`, `attempt_logs` y `srs_review_events` es estable;
7. discrepancias shadow están explicadas;
8. métricas on están dentro de límites;
9. rollback está verificado;
10. la nota contiene muestras y resultados;
11. no se propone borrar `SRSData` de usuario durante la retirada.

- [ ] **Step 3: Tests de bloqueo individual**

Crear un test por precondición. El gate debe indicar exactamente cuál falta; no
usar un único booleano.

```ts
it("bloquea con double-write", () => { /* ... */ });
it("bloquea si reconstrucción no coincide", () => { /* ... */ });
it("devuelve insufficient-data con menos de 100 sesiones", () => { /* ... */ });
it("pasa solo con evidencia completa", () => { /* ... */ });
```

- [ ] **Step 4: Commit**

```bash
pnpm test lib/essential-words/__tests__/retirement-gate.test.ts
git add lib/essential-words/rollout-gate.ts lib/essential-words/__tests__/retirement-gate.test.ts docs/superpowers/plans/notes/2026-08-06-fase9-rollout.md
git commit -m "docs(essential-words): cerrar gate de rollout antes de retirar SRSData"
```

---

## Fase 10 — Retirada segura del modelo anterior

**Objetivo:** eliminar la lectura y escritura del `SRSData` viejo de Essential Words.

**Precondiciones — TODAS obligatorias.** No empezar esta fase sin marcarlas:

- [ ] Migración verificada sobre datos reales (no solo fixtures)
- [ ] Sincronización estable: sin entradas `failed` en el outbox para `learning_items` / `srs_review_events`
- [ ] Simulación de la Fase 8 aprobada
- [ ] Métricas de producción razonables con el flag encendido
- [ ] Posibilidad de reconstruir la programación desde `srs_review_events`

**Condición de salida:** el flag deja de existir; `gradeEssentialWord` ya no escribe `SRSData` con prefijo `c1k:`.

### Task 10.1: Reconstrucción de programación desde `SrsReviewEvent`

**Files:**
- Create: `lib/essential-words/rebuild-from-events.ts`
- Test: `lib/essential-words/__tests__/rebuild-from-events.test.ts`
- Integration test: `lib/essential-words/__tests__/rebuild-sample.integration.test.ts`

La reconstrucción es la red de seguridad previa a retirar la ruta vieja. Debe
ser independiente por tarjeta: dos efectos de la misma interacción no se
mezclan.

```ts
export interface RebuildOptions {
  schedulerVersion: string;
  desiredRetention: number;
}

export function rebuildScheduleFromEvents(
  item: LearningItem,
  events: SrsReviewEvent[],
  options: RebuildOptions,
): LearningItem;
```

Reglas:

- filtrar por `learningItemId === item.id`;
- ordenar por `occurredAt` y luego por ID para desempate determinista;
- validar que `event.priorSchedule` coincide con el estado acumulado;
- aplicar el grade al estado anterior;
- comparar el resultado con `event.resultingSchedule`;
- fallar de forma explícita ante hueco o inconsistencia;
- ignorar intentos que no produjeron evento;
- no usar la fecha actual: cada evento lleva su momento;
- no reconstruir `placementInference` desde el historial SRS;
- no persistir `mature`.

Test completo mínimo:

```ts
it("reconstruye meaning y production de una misma interacción por separado", () => {
  const attemptId = "attempt-1";
  const meaningEvents = eventsFor("c1k:on#meaning", attemptId, ["Good", "Good"]);
  const productionEvents = eventsFor("c1k:on#production", attemptId, ["Again", "Good"]);

  const meaning = rebuildScheduleFromEvents(
    emptyItem("meaning"),
    [...meaningEvents, ...productionEvents],
    options,
  );
  const production = rebuildScheduleFromEvents(
    emptyItem("production"),
    [...meaningEvents, ...productionEvents],
    options,
  );

  expect(meaning.schedule).not.toEqual(production.schedule);
  expect(meaning.repetitions).toBe(2);
  expect(production.lapses).toBe(1);
});

it("ordena eventos aunque lleguen desordenados", () => { /* ... */ });
it("ignora eventos de otro learningItem", () => { /* ... */ });
it("falla si priorSchedule no enlaza con el evento anterior", () => { /* ... */ });
it("falla si resultingSchedule no coincide con FSRS reproducido", () => { /* ... */ });
it("sin eventos devuelve schedule none", () => { /* ... */ });
```

La prueba de integración selecciona una muestra de ítems reales, reconstruye y
compara todos los campos de schedule con tolerancias documentadas para números
de coma flotante.

- [ ] **Step 1: Implementar**

```ts
export function rebuildScheduleFromEvents(
  item: LearningItem,
  events: SrsReviewEvent[],
): LearningItem;
```

Filtra exclusivamente `learningItemId === item.id`, ordena cronológicamente y reproduce cada grade desde el `priorSchedule`/estado inicial. Si la cadena contiene una discontinuidad (`priorSchedule` distinto al resultado anterior), falla explícitamente en vez de adivinar.

- [ ] **Step 2: Tests**

- reconstruye una tarjeta;
- ignora eventos de otros ítems;
- dos efectos del mismo intento reconstruyen dos tarjetas independientes;
- orden de llegada no importa;
- discontinuidad falla;
- sin eventos devuelve schedule none;
- lapses y repetitions coinciden.

- [ ] **Step 3: Commit**

```bash
pnpm test lib/essential-words/__tests__/rebuild-from-events.test.ts
git add lib/essential-words/rebuild-from-events.ts lib/essential-words/__tests__/rebuild-from-events.test.ts
git commit -m "feat(essential-words): reconstruir cada tarjeta desde sus eventos SRS"
```

### Task 10.2: Verificar precondiciones sobre datos reales

**Files:**
- Create: `scripts/essential-words/verify-retirement-readiness.ts`
- Create: `docs/superpowers/plans/notes/2026-08-06-fase10-readiness.md`

No empezar esta tarea con una lista marcada a mano. El script debe generar los
conteos y muestras que respaldan cada casilla.

Consultas mínimas:

- cantidad de `LearningItem` por habilidad y schedule kind;
- cantidad de `AttemptLog` y `SrsReviewEvent`;
- intentos con cero, uno y múltiples eventos;
- eventos sin intento o sin ítem;
- duplicados por ID;
- inconsistencias entre espejos y `schedule`;
- outbox pending/failed por tabla y antigüedad;
- reconstrucciones exactas y fallidas;
- usuarios en off/shadow/on;
- sesiones y días de observación por cohorte;
- double-write detectado;
- retención observada y muestra;
- backlog/p95/recovery en on.

El script es de solo lectura. No repara, borra ni migra durante la verificación.

No iniciar sin marcar todas:

- [ ] migración verificada sobre datos reales;
- [ ] Fase 8 y adversariales verdes;
- [ ] documento de rollout de Fase 9 aprobado;
- [ ] cero double-write;
- [ ] sin entradas `failed` persistentes para `learning_items`, `attempt_logs` y `srs_review_events`;
- [ ] reconstrucción por eventos coincide con schedules almacenados en una muestra representativa;
- [ ] rollback a off probado;
- [ ] no se va a borrar `SRSData` de usuario en esta fase.

Crear una nota firmada con consultas, tamaños de muestra y resultados. Una casilla sin evidencia bloquea la fase.

### Task 10.3: Retirar ruta vieja y feature flag tras el gate

**Files:**
- Modify: `lib/essential-words/engine-router.ts`
- Modify: `lib/feature-flags.ts`
- Modify: hooks, session builders y grade route afectados
- Test: `lib/essential-words/__tests__/legacy-retirement.test.ts`
- Test: `lib/essential-words/__tests__/single-engine.integration.test.ts`

Esta tarea solo puede empezar con `RetirementGateResult.status === "passed"` y
la nota de readiness adjunta al commit.

Pasos:

1. fijar temporalmente el router en `on` sin borrar todavía ramas;
2. ejecutar suite, build y smoke tests;
3. eliminar llamadas legacy de Essential Words;
4. eliminar resolución de cohortes y shadow del camino normal;
5. conservar herramientas de lectura para auditoría durante la ventana acordada;
6. no borrar filas `SRSData` del usuario;
7. conservar `answer_history`;
8. demostrar que una interacción crea un intento y N eventos, nunca `SRSData c1k:`;
9. demostrar que una sesión se construye exclusivamente desde `LearningItem`;
10. retirar el flag solo al final del mismo commit atómico.

Test de no escritura legacy:

```ts
it("ningún intento de Essential Words escribe SRSData c1k", async () => {
  await runSkillSessionAndAnswer();
  const rows = await db.srsData
    .filter((row) => row.wordId.startsWith("c1k:"))
    .toArray();
  expect(rows).toEqual(existingLegacySnapshot);
  expect(saveSRSData).not.toHaveBeenCalled();
});
```

**Files:**
- Modify: router, `gradeEssentialWord`, hooks y queries afectados
- Test: `lib/essential-words/__tests__/legacy-retirement.test.ts`

- [ ] La ruta nueva persiste mediante `persistAttemptRecord`.
- [ ] `gradeEssentialWord` deja de escribir `SRSData` con prefijo `c1k:`.
- [ ] `answer_history` se conserva por ser ortogonal.
- [ ] El router deja de ofrecer off/shadow solo después de pasar el gate.
- [ ] No borrar filas antiguas del usuario; quedan como respaldo temporal.
- [ ] `pnpm build` es obligatorio porque la ruta nueva pasa a ser única.

```bash
pnpm test
pnpm type-check
pnpm lint
pnpm build
git add -A
git commit -m "refactor(essential-words): retirar ruta SRSData tras rollout verificado"
```

### Task 10.4: Limpieza final y baseline cerrada

- [ ] comprobar llamantes del planificador viejo antes de borrar archivos;
- [ ] eliminar código muerto, no datos de usuario;
- [ ] actualizar baseline con conteos finales;
- [ ] conservar tests de hint ladder existentes y su trazabilidad;
- [ ] comprobar que no quedan símbolos incompatibles:
  - `ReviewLog`;
  - `reviewLogs`;
  - `currentItems[0]` como atribución SRS;
  - `skillActivations` ambiguo;
  - funciones puras con reloj/UUID global;
  - simulación con candidatos base/usage permanentemente vacíos.

Run:

```bash
pnpm test && pnpm type-check && pnpm lint && pnpm build
```

Commit:

```bash
git add -A
git commit -m "chore(essential-words): cerrar retirada y limpiar contratos obsoletos"
```

---

## Criterio de aprobación de cada fase

Ninguna fase se da por terminada sin:

1. `pnpm type-check` limpio y lint sin errores nuevos.
2. Tests unitarios de sus invariantes.
3. Tests de integración de sus límites.
4. Migraciones reversibles o conservadoras.
5. Dependencias posteriores apagadas o en el modo de rollout previsto.
6. Ningún contrato obsoleto coexistiendo con su reemplazo en tareas posteriores.

El flag permanece `off` durante las fases 0–8. La fase 9 es la única que puede usar `shadow` y `on`. La fase 10 lo retira únicamente después del gate.

## Mapa de invariantes por fase

| Invariantes (§7 de la spec) | Fase |
|---|---|
| 10, 19, 20, 21, 25, 26, 30 + separación intento/evento | 1 |
| 18, 19 + RLS/inmutabilidad/idempotencia | 2 |
| 1, 2, 3, 12, 13, 16, 24 + atomicidad y reconstrucción por ítem | 3 |
| 7, 11, 14, 27, 28, 29 + cola acotada/sin doble conteo | 4 |
| 8, 28 | 5 |
| 4, 11, 25, 26 + reloj inyectado | 6 |
| 5, 7, 9, 23 | 7 |
| 6, 15, 17, 22 + once criterios y adversariales | 8 |
| rollout, no double-write, rollback y métricas | 9 |
| reconstrucción y retirada conservadora | 10 |

## Trazabilidad spec → implementación → pruebas

| Requisito | Módulo/función | Test unitario | Integración/aceptación |
|---|---|---|---|
| §1.2–1.5 modelo y derivados | `verification/types.ts`, `skill-item.ts` | `types.test.ts`, `skill-item*.test.ts` | Fase 8 |
| §1.7 observaciones con signo | `deriveObservations` | `observations.test.ts` | `record-attempt.test.ts` |
| §1.8 assessment + duración | `buildAssessment` | `assessment.test.ts` | simulación |
| §1.9b inferencia | `placement/policy.ts` | `policy.test.ts` | simulación + adversarial placement |
| §1.10 intento y N efectos | `AttemptLog`, `SrsReviewEvent`, `planAttemptRecord` | `types.test.ts`, `record-attempt.test.ts` | `persist-attempt-record.test.ts`, reconstrucción |
| §1.11 persistencia | Dexie/Supabase/queries | schema/mappers/RLS tests | sync integration |
| §1.12 migración | migración conservadora | migration tests | datos reales Fase 10.2 |
| §2.1 cola | `buildSkillQueue` | `skill-queue.test.ts` | simulación |
| §2.2 presupuesto | `planDailySession` | `daily-budget.test.ts` | aceptación/adversariales |
| §2.3 recovery | `selectMandatory`, `RecoveryPolicy` | recovery tests | criterios 3 y 5 |
| §2.5 activación base | candidates + allowance separado | budget/queue tests | criterio 9 |
| §3.1 verificación inmediata | verification policy/UI | tests Fase 5 | flujo sesión |
| §3.2 evidencia/colocación | `deriveObservations`, `derivePlacements` | policy tests | record attempt |
| §3.5 latencia | `latency.ts` | `latency.test.ts` | calibración Fase 8 |
| §3.5 pistas tipificadas | `hint-ladder.ts` existente | `hint-ladder.test.ts`, `attempt-grade.test.ts` | no tarea nueva |
| §3.6 provisionales | `provisional-intervals.ts` | interval tests | provisional graduation + simulación |
| §4 bandas | `placement/*` | placement tests | criterios 7/9 + adversarial placement |
| §5 usage | `usage/*`, ciclo derivado | usage tests | simulación criterios 6/7 |
| §11 rollout | `engine-router.ts`, shadow metrics | router/metrics tests | `rollout-gate.test.ts` |

### Trazabilidad individual de los once criterios

| # | Requisito | Función | Unit test | Acceptance |
|---|---|---|---|---|
| 1 | 90 % bajo 1.2× | `budgetRespected` | éxito/fallo | todos los perfiles |
| 2 | p95 bajo 1.5× | `percentile95WithinBudget` | éxito/fallo | todos |
| 3 | salir de recovery | `recoveryExits` | éxito/fallo | todos |
| 4 | backlog estable | `backlogStable` | pendiente/techo | constante |
| 5 | volver tras ausencia | `recoveryReturnSessions` | sesiones activas | ráfagas |
| 6 | cuota usage | `usageActivationShare` | denominador/ventana | aplicables |
| 7 | sin picos sincronizados | `noSynchronizedPeaks` | pico/no pico | todos |
| 8 | liveness nuevas (capacity-conditioned, 8.9i) | `newWordLiveness` | 6 escenarios de capacidad/starvation | constante |
| 9 | liveness base | `baseSkillActivationLiveness` | starvation/no starvation | elegibles |
| 10 | no starvation atrasados | `noOverdueStarvation` | edad máxima | todos |
| 11 | calibración de retención (8.9i) | `retentionCalibrationWithinExpected` | calibrado/descalibrado/insuficiente | todos |

> `observedRetentionWithinTarget` (umbral fijo `0,9 ± 0,05`) queda
> `@deprecated`, retenida solo por regresión histórica en
> `criteria-retention.test.ts` / `c11-accuracy-independence.test.ts`. La
> acceptance/adversarial de C11 usa `retentionCalibrationWithinExpected`.
> `meanRetrievabilityAtReview` es una métrica de scheduling adicional, no un
> criterio pass/fail — no tiene fila propia en esta tabla.

## Alcance explícitamente diferido

Fuera de este plan, por decisión de la spec: vistas de habilidad, pipeline general de contenido, AI Coach y ruta teórica. Los ganchos quedan listos (`contentOrigin`, observaciones `journal`, queries, intentos y eventos), pero ninguna tarea debe improvisarlos.

## Autorrevisión final obligatoria

Antes de declarar el plan cerrado:

- buscar secciones de spec sin tarea y sin test;
- buscar tipos o decisiones del plan ausentes en la spec;
- ejecutar mentalmente las tareas en orden para detectar imports y APIs acumulativas;
- comprobar que los diez motores adversariales fallan;
- comprobar que el documento contiene una sola versión de cada contrato;
- comprobar que no existe adenda ni regla de precedencia.

**Conteo final:** 54 tareas en 11 fases (Fase 0 a Fase 10). Si se añade o elimina una tarea, actualizar este conteo y el diagrama en el mismo commit.
