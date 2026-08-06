# Essential Words — Modelo de habilidades: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir el modelo "una palabra = una tarjeta SRS" por un modelo de ítems de habilidad (`meaning` / `listening` / `production` / `usage`) con evidencia por modalidad, programación FSRS por ítem y un planificador con presupuesto real.

**Architecture:** Tres capas — `LearningItem` (unidad programable) → `ReviewLog` (telemetría, con `affectsSchedule` como único autorizado a tocar FSRS) → funciones puras derivadas (`deriveSkillStatus`, `isMature`, `deriveUsageLifecycle`) que eliminan estado duplicado. El motor viejo (`SRSData` con prefijo `c1k:`) sigue vivo detrás de un feature flag hasta la fase 9.

**Tech Stack:** TypeScript estricto, Dexie (v31), Supabase + RLS, `ts-fsrs`, Vitest, Next.js 16 App Router.

**Spec:** [`docs/superpowers/specs/2026-08-06-essential-words-skill-model-design.md`](../specs/2026-08-06-essential-words-skill-model-design.md)

---

## Dependencias entre fases

```
Fase 0 (caracterización)
   └─► Fase 1 (modelo puro)
          └─► Fase 2 (persistencia + migración + flag)
                 └─► Fase 3 (observaciones + FSRS)
                        └─► Fase 4 (planificador + presupuesto)   ◄── riesgo principal
                               ├─► Fase 5 (verificación "Ya la conozco")
                               ├─► Fase 6 (colocación inicial)
                               └─► Fase 7 (ciclo de vida usage)
                                      └─► Fase 8 (simulación + calibración)
                                             └─► Fase 9 (retirada de SRSData)
```

Las fases 5, 6 y 7 son paralelizables entre sí, pero **ninguna** empieza antes de que la 4 esté verde: el presupuesto es donde vive el riesgo de acumulación, y colocación y `usage` son precisamente los dos que más carga generan.

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

**Objetivo:** los tipos y las funciones derivadas, sin tocar UI, Dexie ni Supabase. Todo puro y testeable sin I/O.

**Condición de salida:** invariantes estructurales (10, 19, 20, 21, 24, 25, 26, 30) verdes; `pnpm type-check` limpio; nada de la app importa todavía estos módulos.

### Task 1.1: Tipos del modelo

**Files:**
- Create: `lib/essential-words/verification/types.ts`
- Test: `lib/essential-words/verification/__tests__/types.test.ts`

- [ ] **Step 1: Escribir el test primero**

El test comprueba lo que el compilador no puede comprobar solo: que las uniones discriminan de verdad y que las combinaciones prohibidas no compilan (vía `@ts-expect-error`).

```ts
// lib/essential-words/verification/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  ItemSchedule, LearningItem, SkillObservation, ReviewLog, AttemptModality,
} from "../types";

describe("tipos del modelo de habilidades", () => {
  it("ItemSchedule discrimina por kind", () => {
    const none: ItemSchedule = { kind: "none" };
    const prov: ItemSchedule = {
      kind: "provisional", dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct", evidenceConfidence: 1,
    };
    const fsrs: ItemSchedule = {
      kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z",
      stability: 12, difficulty: 5, state: "Review",
    };
    expect([none.kind, prov.kind, fsrs.kind]).toEqual(["none", "provisional", "fsrs"]);
  });

  it("un provisional no admite campos FSRS (invariante 10)", () => {
    const bad = {
      kind: "provisional" as const, dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct" as const, evidenceConfidence: 1,
      // @ts-expect-error — stability no existe en la rama provisional
      stability: 12,
    };
    expect(bad.kind).toBe("provisional");
  });

  it("ReviewLog con affectsSchedule:false no admite fsrsLogId", () => {
    const log: ReviewLog = {
      id: "l1", learningItemId: "c1k:on#meaning", sessionId: "s1",
      assessment: {
        grade: "Good", modality: "production", correct: true,
        latencyMs: 3_000, interactionDurationMs: 9_000,
        usedHints: false, rescued: false, acceptedVariant: false,
      },
      observations: [], eventType: "practice",
      affectsSchedule: false,
      occurredAt: "2026-08-06T10:00:00.000Z",
    };
    expect(log.affectsSchedule).toBe(false);
  });

  it("una observación de inferencia de banda no declara modalidad", () => {
    const obs: SkillObservation = {
      skill: "meaning", outcome: "success", source: "placement-inference",
      basis: { kind: "band-inference", bandId: "band-3", policyVersion: "v1" },
      evidenceConfidence: 0.85, observedAt: "2026-08-06T10:00:00.000Z",
    };
    expect(obs.basis.kind).toBe("band-inference");
  });

  it("placementInference solo aparece en habilidades base (invariante 25)", () => {
    const item: LearningItem = {
      id: "c1k:on#meaning", wordId: "c1k:on", skill: "meaning",
      contentOrigin: "authored", schedule: { kind: "none" },
      repetitions: 0, lapses: 0, suspended: false,
      placementInference: {
        bandId: "band-3", confidence: 0.85,
        inferredAt: "2026-08-06T10:00:00.000Z", policyVersion: "v1",
      },
    };
    expect(item.placementInference?.bandId).toBe("band-3");
  });

  it("AttemptModality cubre las cuatro modalidades", () => {
    const all: AttemptModality[] = ["recognition", "production", "listening", "pronunciation"];
    expect(all).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar por módulo inexistente**

Run: `pnpm test lib/essential-words/verification/__tests__/types.test.ts`
Expected: FAIL — "Cannot find module '../types'".

- [ ] **Step 3: Escribir los tipos**

```ts
// lib/essential-words/verification/types.ts
// Modelo canónico del motor de habilidades (spec §1). Solo tipos: ninguna
// función, ningún I/O. Las funciones derivadas viven en skill-item.ts.

import type { Grade } from "../attempt-grade";

/** Estado de tarjeta FSRS, tal como lo expone ts-fsrs. */
export type FsrsCardState = "New" | "Learning" | "Review" | "Relearning";

export type Skill = "meaning" | "listening" | "production" | "usage";

/** Cómo se evaluó un intento. NO es una Skill: `pronunciation` acredita
 *  `production` (spec §1.2, invariante 16). */
export type AttemptModality = "recognition" | "production" | "listening" | "pronunciation";

/**
 * Única fuente de verdad de programación (spec §1.3). Sustituye a un
 * `nextReview` sobrecargado que hacía trivial tratar un provisional como
 * tarjeta FSRS.
 */
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

/** Estimación de colocación por banda de frecuencia (spec §1.9b). No es una
 *  programación: un ítem inferido conserva `schedule.kind === "none"`. */
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

/** Contenido y ciclo de vida de un ítem `usage` (spec §5.2). Sin
 *  `activationStatus`: el ciclo se deriva de `schedule` + `retiredAt`. */
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

/** Una fila por habilidad de una palabra (spec §1.2). Reemplaza al SRSData
 *  único como unidad de programación. */
export interface LearningItem {
  id: string;              // "c1k:on#meaning" | "c1k:on#usage:depend-on"
  wordId: string;          // "c1k:on"
  skill: Skill;

  contentOrigin: "authored" | "generated" | "journal";
  generatorProvider?: "gemini";

  payload?: UsagePayload;  // solo skill: "usage"
  /** Solo habilidades base, nunca `usage` (invariante 25). */
  placementInference?: PlacementInference;

  schedule: ItemSchedule;
  lastReview?: string;
  repetitions: number;
  lapses: number;
  suspended: boolean;
}

export type SkillStatus = "unseen" | "learning" | "provisional" | "review";

/**
 * Observación CON SIGNO (spec §1.7). Un fallo también es evidencia: sin
 * `outcome`, un `Again` dejaría la lista vacía y `derivePlacements` tendría
 * que reinterpretar la modalidad por su cuenta.
 */
export interface SkillObservation {
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

/** Grade y modalidad viajan juntos: un Easy en reconocimiento no equivale a
 *  un Easy en producción (spec §1.8). */
export interface AttemptAssessment {
  grade: Grade;
  modality: AttemptModality;
  correct: boolean;
  /** Solo la respuesta. Subestima el coste real de la sesión. */
  latencyMs: number;
  /** Interacción completa: audio, lectura, respuesta y transición. Es lo que
   *  usa el presupuesto (spec §2.2). */
  interactionDurationMs: number;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
}

export interface SkillPlacement {
  skill: Skill;
  schedule: ItemSchedule;
  verificationSource: "direct" | "placement-inference";
}

interface ReviewLogBase {
  id: string;
  learningItemId: string;
  sessionId: string;
  assessment: AttemptAssessment;
  observations: SkillObservation[];
  eventType: "practice" | "verification" | "scheduled-review" | "learning-step";
  occurredAt: string;
}

/**
 * Unión discriminada para que `affectsSchedule` y `fsrsLogId` no puedan
 * contradecirse (spec §1.10): un log que no toca el calendario no tiene
 * entrada FSRS que referenciar.
 */
export type ReviewLog = ReviewLogBase & (
  | { affectsSchedule: false; fsrsLogId?: never }
  | { affectsSchedule: true; fsrsLogId: string }
);

export interface MaturityPolicy {
  version: string;
  minStabilityDays: number;
  minSuccessfulReviews: number;
  maxRecentLapses: number;
  /** "Recent" en número de revisiones, no en días: con perfiles intermitentes
   *  una ventana temporal deja el historial vacío y declara maduro por
   *  ausencia de datos (spec §1.5). */
  recentReviewWindow: number;
}
```

- [ ] **Step 4: Ejecutar el test**

Run: `pnpm test lib/essential-words/verification/__tests__/types.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Verificar tipos y commit**

```bash
pnpm type-check
git add lib/essential-words/verification/types.ts lib/essential-words/verification/__tests__/types.test.ts
git commit -m "feat(essential-words): tipos canonicos del modelo de habilidades"
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

import type {
  LearningItem, MaturityPolicy, ReviewLog, SkillStatus,
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

### Task 1.3: `isMature`

**Files:**
- Modify: `lib/essential-words/skill-item.ts`
- Test: `lib/essential-words/__tests__/skill-item-maturity.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/skill-item-maturity.test.ts
import { describe, it, expect } from "vitest";
import { isMature, DEFAULT_MATURITY_POLICY } from "../skill-item";
import type { ItemSchedule, LearningItem, ReviewLog } from "../verification/types";

const item = (schedule: ItemSchedule): LearningItem => ({
  id: "c1k:on#meaning", wordId: "c1k:on", skill: "meaning",
  contentOrigin: "authored", schedule,
  repetitions: 0, lapses: 0, suspended: false,
});

const mature = (stability = 30): ItemSchedule => ({
  kind: "fsrs", dueAt: "2026-09-06T00:00:00.000Z",
  stability, difficulty: 5, state: "Review",
});

const log = (over: Partial<ReviewLog> = {}): ReviewLog => ({
  id: crypto.randomUUID(),
  learningItemId: "c1k:on#meaning",
  sessionId: "s1",
  assessment: {
    grade: "Good", modality: "production", correct: true,
    latencyMs: 3_000, interactionDurationMs: 8_000,
    usedHints: false, rescued: false, acceptedVariant: false,
  },
  observations: [],
  eventType: "scheduled-review",
  affectsSchedule: true,
  fsrsLogId: "f1",
  occurredAt: "2026-08-06T10:00:00.000Z",
  ...over,
} as ReviewLog);

const successes = (n: number) => Array.from({ length: n }, () => log());

describe("isMature", () => {
  it("un ítem sin programación FSRS nunca es maduro", () => {
    expect(isMature(item({ kind: "none" }), successes(10), DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("un provisional nunca es maduro (invariante 4)", () => {
    const prov = item({
      kind: "provisional", dueAt: "2026-08-20T00:00:00.000Z",
      source: "placement-inference", evidenceConfidence: 0.85,
    });
    expect(isMature(prov, successes(10), DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("un ítem FSRS que no está en Review no es maduro", () => {
    const learning = item({
      kind: "fsrs", dueAt: "2026-08-07T00:00:00.000Z",
      stability: 30, difficulty: 5, state: "Learning",
    });
    expect(isMature(learning, successes(10), DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("exige estabilidad mínima", () => {
    const low = item(mature(DEFAULT_MATURITY_POLICY.minStabilityDays - 1));
    expect(isMature(low, successes(10), DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("exige un mínimo de revisiones exitosas", () => {
    const few = successes(DEFAULT_MATURITY_POLICY.minSuccessfulReviews - 1);
    expect(isMature(item(mature()), few, DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("es maduro cuando cumple estabilidad y revisiones", () => {
    expect(isMature(item(mature()), successes(10), DEFAULT_MATURITY_POLICY)).toBe(true);
  });

  it("solo cuenta logs con affectsSchedule true (invariante 30)", () => {
    const practice = Array.from({ length: 10 }, () =>
      log({ eventType: "practice", affectsSchedule: false, fsrsLogId: undefined } as Partial<ReviewLog>));
    expect(isMature(item(mature()), practice, DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("demasiados lapses recientes lo bloquean", () => {
    const lapses = Array.from({ length: DEFAULT_MATURITY_POLICY.maxRecentLapses + 1 }, () =>
      log({ assessment: { ...log().assessment, grade: "Again", correct: false } }));
    const history = [...successes(10), ...lapses];
    expect(isMature(item(mature()), history, DEFAULT_MATURITY_POLICY)).toBe(false);
  });

  it("un lapse fuera de recentReviewWindow ya no bloquea", () => {
    const old = Array.from({ length: DEFAULT_MATURITY_POLICY.maxRecentLapses + 1 }, () =>
      log({ assessment: { ...log().assessment, grade: "Again", correct: false } }));
    // La ventana mira las ÚLTIMAS N: llenamos con éxitos posteriores.
    const history = [...old, ...successes(DEFAULT_MATURITY_POLICY.recentReviewWindow)];
    expect(isMature(item(mature()), history, DEFAULT_MATURITY_POLICY)).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/skill-item-maturity.test.ts`
Expected: FAIL — `isMature` no exportado.

- [ ] **Step 3: Implementar en `skill-item.ts`**

Añadir al final del fichero:

```ts
/**
 * Política de madurez por defecto. Los valores son PROVISIONALES: se calibran
 * en la Fase 8 con la simulación de carga (spec §10, decisión 5). Al ser
 * `mature` un predicado derivado, cambiarlos no requiere migración.
 */
export const DEFAULT_MATURITY_POLICY: MaturityPolicy = {
  version: "provisional-1",
  minStabilityDays: 21,
  minSuccessfulReviews: 3,
  maxRecentLapses: 1,
  recentReviewWindow: 5,
};

/**
 * `mature` NUNCA se persiste (invariante 19): si se almacenara, un cambio de
 * parámetros FSRS o de umbral dejaría miles de filas mintiendo.
 *
 * Solo cuentan los logs con `affectsSchedule: true`: los pasos de práctica
 * intra-sesión no son recuperaciones programadas, e incluirlos inflaría tanto
 * el conteo de éxitos como la ventana de lapses.
 */
export function isMature(
  item: LearningItem,
  history: ReviewLog[],
  policy: MaturityPolicy,
): boolean {
  if (item.schedule.kind !== "fsrs") return false;
  if (item.schedule.state !== "Review") return false;
  if (item.schedule.stability < policy.minStabilityDays) return false;

  const scheduled = history.filter((log) => log.affectsSchedule);
  const successful = scheduled.filter((log) => log.assessment.grade !== "Again");
  if (successful.length < policy.minSuccessfulReviews) return false;

  const recent = scheduled.slice(-policy.recentReviewWindow);
  const recentLapses = recent.filter((log) => log.assessment.grade === "Again").length;
  return recentLapses <= policy.maxRecentLapses;
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/skill-item-maturity.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/skill-item.ts lib/essential-words/__tests__/skill-item-maturity.test.ts
git commit -m "feat(essential-words): isMature como predicado con politica versionada"
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

```ts
import type { Skill } from "./verification/types";

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

### Task 2.2: Tablas Dexie v31

**Files:**
- Modify: `lib/db/index.ts` (clase `PronunciationDB`, ~línea 265; bloque de versiones, ~línea 506)
- Test: `lib/db/__tests__/skill-model-schema.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/db/__tests__/skill-model-schema.test.ts
import { describe, it, expect } from "vitest";
import { db } from "../index";

describe("esquema Dexie v31 — modelo de habilidades", () => {
  it("declara learningItems y reviewLogs", () => {
    const names = db.tables.map((t) => t.name);
    expect(names).toContain("learningItems");
    expect(names).toContain("reviewLogs");
  });

  it("learningItems indexa por cuenta, palabra y vencimiento", () => {
    const schema = db.table("learningItems").schema;
    const indexes = schema.indexes.map((i) => i.name);
    expect(schema.primKey.name).toBe("id");
    expect(indexes).toContain("userId");
    expect(indexes).toContain("[userId+wordId]");
    expect(indexes).toContain("[userId+dueAt]");
    expect(indexes).toContain("[userId+skill]");
  });

  it("reviewLogs indexa por ítem y por momento", () => {
    const schema = db.table("reviewLogs").schema;
    const indexes = schema.indexes.map((i) => i.name);
    expect(schema.primKey.name).toBe("id");
    expect(indexes).toContain("[userId+learningItemId]");
    expect(indexes).toContain("[userId+occurredAt]");
  });

  it("la versión del esquema es al menos 31", () => {
    expect(db.verno).toBeGreaterThanOrEqual(31);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/db/__tests__/skill-model-schema.test.ts`
Expected: FAIL — tabla `learningItems` inexistente.

- [ ] **Step 3: Declarar los tipos de registro**

`dueAt` y `scheduleKind` se **desnormalizan** como columnas indexables: Dexie no indexa campos anidados, y la Fase 4 necesita consultar vencimientos sin cargar la tabla entera. Son campos derivados, y la spec (§1.4) los autoriza siempre que se escriban en la misma transacción que `schedule`.

Añadir a `lib/db/index.ts`, junto a los demás tipos de registro:

```ts
import type { LearningItem, ReviewLog } from "@/lib/essential-words/verification/types";

/**
 * Fila local de un LearningItem. `dueAt` y `scheduleKind` están
 * desnormalizados desde `schedule` porque Dexie no indexa campos anidados;
 * se escriben SIEMPRE en la misma transacción que `schedule` (spec §1.4).
 */
export interface LearningItemRecord extends LearningItem {
  userId: string;
  /** Espejo de `schedule.dueAt`; ausente cuando `schedule.kind === "none"`. */
  dueAt?: string;
  /** Espejo de `schedule.kind`, para filtrar sin deserializar. */
  scheduleKind: LearningItem["schedule"]["kind"];
  updatedAt: string;
}

export interface ReviewLogRecord extends ReviewLog {
  userId: string;
  /** false hasta que el outbox confirma la subida. */
  synced: boolean;
}
```

- [ ] **Step 4: Declarar las tablas en la clase**

En `class PronunciationDB`, tras `missionSessions!`:

```ts
  learningItems!: Table<LearningItemRecord, string>;
  reviewLogs!: Table<ReviewLogRecord, string>;
```

- [ ] **Step 5: Añadir la versión 31**

Tras el bloque `this.version(30)`:

```ts
    // v31: modelo de habilidades (spec 2026-08-06). Una fila por habilidad de
    // una palabra, más el log de eventos. `dueAt`/`scheduleKind` están
    // desnormalizados desde `schedule` para poder indexarlos.
    this.version(31).stores({
      learningItems: 'id, userId, [userId+wordId], [userId+skill], [userId+dueAt], [userId+scheduleKind], updatedAt',
      reviewLogs: 'id, userId, [userId+learningItemId], [userId+occurredAt], synced',
    });
```

- [ ] **Step 6: Ejecutar**

Run: `pnpm test lib/db/__tests__/skill-model-schema.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Verificar que no rompimos el resto de la DB**

Run: `pnpm test lib/db && pnpm type-check`
Expected: PASS, sin errores.

- [ ] **Step 8: Commit**

```bash
git add lib/db/index.ts lib/db/__tests__/skill-model-schema.test.ts
git commit -m "feat(db): tablas Dexie v31 para learningItems y reviewLogs"
```

### Task 2.3: Migración Supabase con RLS

**Files:**
- Create: `supabase/migrations/20260806120000_create_learning_items.sql`

- [ ] **Step 1: Escribir la migración**

Sigue el patrón de `20260726182554_create_pronunciation_feedback_evidence.sql`: `enable row level security`, `grant` explícito y una policy por operación con `(select auth.uid())`.

```sql
-- Spec 2026-08-06: modelo de habilidades de Essential Words. Una fila por
-- habilidad de una palabra. `schedule` es la unica fuente de verdad de
-- programacion; `due_at` y `schedule_kind` son espejos indexables escritos en
-- la misma operacion, nunca fuentes independientes.
create table if not exists public.learning_items (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,
  skill text not null check (skill in ('meaning', 'listening', 'production', 'usage')),

  content_origin text not null check (content_origin in ('authored', 'generated', 'journal')),
  generator_provider text check (generator_provider in ('gemini')),

  payload jsonb,
  placement_inference jsonb,

  schedule jsonb not null,
  schedule_kind text not null check (schedule_kind in ('none', 'provisional', 'fsrs')),
  due_at timestamptz,

  last_review timestamptz,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  suspended boolean not null default false,

  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  primary key (user_id, id),

  -- Invariante 25: la inferencia de banda solo existe en habilidades base.
  constraint learning_items_inference_base_skill_only
    check (placement_inference is null or skill <> 'usage'),
  -- `payload` es exclusivo de usage (spec 1.2).
  constraint learning_items_payload_usage_only
    check (payload is null or skill = 'usage'),
  -- Invariante 10: un no-programado no tiene fecha; un programado si.
  constraint learning_items_due_at_matches_kind
    check ((schedule_kind = 'none' and due_at is null)
        or (schedule_kind <> 'none' and due_at is not null))
);

create index if not exists learning_items_user_due_idx
  on public.learning_items (user_id, due_at)
  where schedule_kind <> 'none';

create index if not exists learning_items_user_word_idx
  on public.learning_items (user_id, word_id);

alter table public.learning_items enable row level security;
grant select, insert, update, delete on public.learning_items to authenticated;

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


-- Telemetria de intentos. `affects_schedule` marca el unico tipo de evento
-- autorizado a mover el calendario o alimentar el optimizador FSRS (spec 1.10).
create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_item_id text not null,
  session_id text not null,

  assessment jsonb not null,
  observations jsonb not null default '[]'::jsonb,

  event_type text not null
    check (event_type in ('practice', 'verification', 'scheduled-review', 'learning-step')),
  affects_schedule boolean not null,
  fsrs_log_id text,

  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),

  -- Union discriminada del tipo ReviewLog: un log que no toca el calendario
  -- no puede referenciar una entrada FSRS.
  constraint review_logs_fsrs_log_requires_schedule
    check ((affects_schedule = false and fsrs_log_id is null)
        or (affects_schedule = true and fsrs_log_id is not null))
);

create index if not exists review_logs_user_item_occurred_idx
  on public.review_logs (user_id, learning_item_id, occurred_at desc);

create index if not exists review_logs_user_scheduled_idx
  on public.review_logs (user_id, occurred_at desc)
  where affects_schedule = true;

alter table public.review_logs enable row level security;
grant select, insert on public.review_logs to authenticated;

create policy "review_logs_select_own"
  on public.review_logs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "review_logs_insert_own"
  on public.review_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
```

`review_logs` no concede `update` ni `delete`: un log es un hecho inmutable.

- [ ] **Step 2: Verificar la sintaxis SQL**

Run: `npx supabase db lint --schema public 2>&1 | tail -20`
Expected: sin errores. Si el CLI no está disponible localmente, revisar a mano que cada `create policy` lleva `to authenticated` y que ambas tablas tienen `enable row level security`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260806120000_create_learning_items.sql
git commit -m "feat(db): tablas learning_items y review_logs con RLS"
```

### Task 2.4: Registrar las tablas en el outbox de sincronización

**Files:**
- Modify: `lib/sync/types.ts:5`
- Test: `lib/sync/__tests__/skill-model-tables.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/sync/__tests__/skill-model-tables.test.ts
import { describe, it, expect } from "vitest";
import type { SyncTable } from "../types";

describe("SyncTable incluye las tablas del modelo de habilidades", () => {
  it("acepta learning_items y review_logs", () => {
    const tables: SyncTable[] = ["learning_items", "review_logs"];
    expect(tables).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/sync/__tests__/skill-model-tables.test.ts`
Expected: FAIL en type-check — los literales no son asignables a `SyncTable`.

- [ ] **Step 3: Añadir las tablas**

En `lib/sync/types.ts:5`, añadir `| 'learning_items' | 'review_logs'` al final de la unión `SyncTable`.

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/sync/__tests__/skill-model-tables.test.ts && pnpm type-check`
Expected: PASS, sin errores.

- [ ] **Step 5: Commit**

```bash
git add lib/sync/types.ts lib/sync/__tests__/skill-model-tables.test.ts
git commit -m "feat(sync): registrar learning_items y review_logs en el outbox"
```

### Task 2.5: Capa de queries

**Files:**
- Create: `lib/essential-words/queries.ts`
- Test: `lib/essential-words/__tests__/queries.test.ts`

Regla del repo: ningún acceso a Supabase fuera de `lib/*/queries.ts`. Este módulo es el único que las fases 3–7 pueden llamar.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/queries.test.ts
import { describe, it, expect } from "vitest";
import { toLearningItemRecord, fromLearningItemRow } from "../queries";
import type { LearningItem } from "../verification/types";

const item: LearningItem = {
  id: "c1k:on#meaning", wordId: "c1k:on", skill: "meaning",
  contentOrigin: "authored",
  schedule: { kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z", stability: 12, difficulty: 5, state: "Review" },
  repetitions: 3, lapses: 0, suspended: false,
};

describe("toLearningItemRecord", () => {
  it("desnormaliza dueAt y scheduleKind desde schedule", () => {
    const record = toLearningItemRecord(item, "user-1", "2026-08-06T10:00:00.000Z");
    expect(record.dueAt).toBe("2026-08-20T00:00:00.000Z");
    expect(record.scheduleKind).toBe("fsrs");
    expect(record.userId).toBe("user-1");
  });

  it("deja dueAt ausente cuando no hay programación", () => {
    const record = toLearningItemRecord(
      { ...item, schedule: { kind: "none" } }, "user-1", "2026-08-06T10:00:00.000Z",
    );
    expect(record.dueAt).toBeUndefined();
    expect(record.scheduleKind).toBe("none");
  });

  it("los espejos se derivan, nunca se pasan por parámetro", () => {
    const prov = toLearningItemRecord(
      {
        ...item,
        schedule: {
          kind: "provisional", dueAt: "2026-08-15T00:00:00.000Z",
          source: "direct", evidenceConfidence: 1,
        },
      },
      "user-1", "2026-08-06T10:00:00.000Z",
    );
    expect(prov.dueAt).toBe("2026-08-15T00:00:00.000Z");
    expect(prov.scheduleKind).toBe("provisional");
  });
});

describe("fromLearningItemRow", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: "c1k:on#meaning", user_id: "user-1", word_id: "c1k:on", skill: "meaning",
    content_origin: "authored", generator_provider: null,
    payload: null, placement_inference: null,
    schedule: { kind: "fsrs", dueAt: "2026-08-20T00:00:00.000Z", stability: 12, difficulty: 5, state: "Review" },
    schedule_kind: "fsrs", due_at: "2026-08-20T00:00:00.000Z",
    last_review: null, repetitions: 3, lapses: 0, suspended: false,
    updated_at: "2026-08-06T10:00:00.000Z",
    ...over,
  });

  it("reconstruye el LearningItem desde snake_case", () => {
    const parsed = fromLearningItemRow(row());
    expect(parsed.wordId).toBe("c1k:on");
    expect(parsed.schedule.kind).toBe("fsrs");
    expect(parsed.repetitions).toBe(3);
  });

  it("ignora los espejos de la fila: schedule manda", () => {
    // Fila corrupta: due_at no coincide con schedule.dueAt.
    const parsed = fromLearningItemRow(row({ due_at: "1999-01-01T00:00:00.000Z" }));
    expect(parsed.schedule.kind === "fsrs" && parsed.schedule.dueAt)
      .toBe("2026-08-20T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/queries.test.ts`
Expected: FAIL — "Cannot find module '../queries'".

- [ ] **Step 3: Implementar los mapeadores**

```ts
// lib/essential-words/queries.ts
// Unico punto de acceso a Supabase para el modelo de habilidades.
// Los mapeadores son puros y se testean sin red.

import type { LearningItemRecord } from "@/lib/db";
import type { LearningItem, ItemSchedule } from "./verification/types";

/** Espejo indexable de `schedule`. Derivado SIEMPRE aquí, nunca pasado por
 *  el llamante: así no puede divergir de la fuente. */
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

/** Fila de Supabase (snake_case) → LearningItem. `schedule` es la fuente de
 *  verdad; `due_at`/`schedule_kind` de la fila se ignoran deliberadamente. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- la fila llega
// sin tipar desde supabase-js; se normaliza campo a campo justo debajo.
export function fromLearningItemRow(row: any): LearningItem {
  return {
    id: String(row.id),
    wordId: String(row.word_id),
    skill: row.skill,
    contentOrigin: row.content_origin,
    generatorProvider: row.generator_provider ?? undefined,
    payload: row.payload ?? undefined,
    placementInference: row.placement_inference ?? undefined,
    schedule: row.schedule as ItemSchedule,
    lastReview: row.last_review ?? undefined,
    repetitions: Number(row.repetitions ?? 0),
    lapses: Number(row.lapses ?? 0),
    suspended: Boolean(row.suspended),
  };
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/queries.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/queries.ts lib/essential-words/__tests__/queries.test.ts
git commit -m "feat(essential-words): mapeadores de LearningItem para Dexie y Supabase"
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
// viejo es la Fase 9, y solo tras verificar la sincronizacion.

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

**Objetivo:** que un intento produzca `AttemptAssessment` → observaciones → colocaciones → `ReviewLog`, y que **solo** los eventos con `affectsSchedule: true` toquen FSRS.

**Condición de salida:** invariantes 1, 2, 3, 12, 13, 16, 24 verdes. Un test demuestra que un evento de práctica no mueve el calendario ni alimenta el optimizador.

### Task 3.1: `AttemptOutcome` → `AttemptAssessment`

**Files:**
- Create: `lib/essential-words/verification/assessment.ts`
- Test: `lib/essential-words/verification/__tests__/assessment.test.ts`

`attemptGrade` no se toca: sigue siendo la función que decide el `Grade`. Lo nuevo es envolverla con la modalidad y la duración de interacción, que ella no conoce.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/verification/__tests__/assessment.test.ts
import { describe, it, expect } from "vitest";
import { buildAssessment } from "../assessment";
import type { AttemptOutcome } from "../../attempt-grade";

const outcome = (over: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  correct: true, hintsUsed: 0, rescued: false, typo: false,
  firstTryFailed: false, latencyMs: 3_000, ...over,
});

describe("buildAssessment", () => {
  it("conserva el Grade que decide attemptGrade", () => {
    const a = buildAssessment(outcome(), "production", 9_000);
    expect(a.grade).toBe("Easy");
    const b = buildAssessment(outcome({ hintsUsed: 1 }), "production", 9_000);
    expect(b.grade).toBe("Hard");
  });

  it("lleva la modalidad, que attemptGrade no conoce", () => {
    expect(buildAssessment(outcome(), "listening", 9_000).modality).toBe("listening");
  });

  it("distingue latencyMs de interactionDurationMs", () => {
    const a = buildAssessment(outcome({ latencyMs: 3_000 }), "listening", 12_000);
    expect(a.latencyMs).toBe(3_000);
    expect(a.interactionDurationMs).toBe(12_000);
  });

  it("marca usedHints a partir de las pistas de pago", () => {
    expect(buildAssessment(outcome({ hintsUsed: 0 }), "production", 1).usedHints).toBe(false);
    expect(buildAssessment(outcome({ hintsUsed: 1 }), "production", 1).usedHints).toBe(true);
  });

  it("un typo cuenta como correcto y como variante aceptada", () => {
    const a = buildAssessment(outcome({ typo: true }), "production", 1);
    expect(a.correct).toBe(true);
    expect(a.acceptedVariant).toBe(true);
  });

  it("una respuesta revelada nunca es Easy ni Good (invariante 3)", () => {
    const revealed = buildAssessment(outcome({ rescued: true }), "production", 1);
    expect(revealed.grade).toBe("Again");
    const failedFirst = buildAssessment(outcome({ firstTryFailed: true }), "production", 1);
    expect(failedFirst.grade).toBe("Again");
  });

  it("interactionDurationMs nunca es menor que latencyMs", () => {
    // El llamante podría pasarlos al revés; se corrige aquí en vez de
    // envenenar la estimación de presupuesto de la Fase 4.
    const a = buildAssessment(outcome({ latencyMs: 10_000 }), "production", 2_000);
    expect(a.interactionDurationMs).toBeGreaterThanOrEqual(a.latencyMs);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/verification/__tests__/assessment.test.ts`
Expected: FAIL — "Cannot find module '../assessment'".

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/verification/assessment.ts
// Envuelve attemptGrade con lo que esa funcion no conoce: la modalidad del
// ejercicio y la duracion completa de la interaccion (spec 1.8).

import { attemptGrade, type AttemptOutcome } from "../attempt-grade";
import type { AttemptAssessment, AttemptModality } from "./types";

export function buildAssessment(
  outcome: AttemptOutcome,
  modality: AttemptModality,
  interactionDurationMs: number,
): AttemptAssessment {
  return {
    grade: attemptGrade(outcome),
    modality,
    // Un typo se acepta como correcto (spec Fase B); attemptGrade ya asume
    // que el llamante lo normalizo, y aqui lo hacemos explicito.
    correct: outcome.correct || outcome.typo,
    latencyMs: outcome.latencyMs,
    // La duracion total nunca puede ser menor que la latencia de respuesta:
    // si el llamante se equivoca, no envenenamos el presupuesto (Fase 4).
    interactionDurationMs: Math.max(interactionDurationMs, outcome.latencyMs),
    usedHints: outcome.hintsUsed > 0,
    rescued: outcome.rescued,
    acceptedVariant: outcome.typo,
  };
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/verification/__tests__/assessment.test.ts`
Expected: PASS (7 tests).

```bash
git add lib/essential-words/verification/assessment.ts lib/essential-words/verification/__tests__/assessment.test.ts
git commit -m "feat(essential-words): buildAssessment con modalidad y duracion de interaccion"
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
});

const skillsOf = (a: AttemptAssessment) =>
  deriveObservations(a).map((o) => o.skill).sort();

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
    const obs = deriveObservations(assess("production", true));
    expect(obs.every((o) => o.outcome === "success")).toBe(true);
  });

  it("un fallo observa LAS MISMAS habilidades, con failure (invariante 24)", () => {
    const ok = skillsOf(assess("production", true));
    const ko = skillsOf(assess("production", false));
    expect(ko).toEqual(ok);
    expect(deriveObservations(assess("production", false)).every((o) => o.outcome === "failure"))
      .toBe(true);
  });

  it("un fallo de producción sigue sin observar listening", () => {
    expect(skillsOf(assess("production", false))).not.toContain("listening");
  });

  it("un Again nunca deja la lista vacía: derivePlacements tiene contrato", () => {
    expect(deriveObservations(assess("listening", false))).toHaveLength(2);
  });
});

describe("deriveObservations — procedencia", () => {
  it("marca source direct y basis attempt con su modalidad", () => {
    const [first] = deriveObservations(assess("listening", true));
    expect(first.source).toBe("direct");
    expect(first.basis).toEqual({ kind: "attempt", modality: "listening" });
  });

  it("la evidencia directa tiene confianza 1", () => {
    expect(deriveObservations(assess("production", true))[0].evidenceConfidence).toBe(1);
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

export function deriveObservations(assessment: AttemptAssessment): SkillObservation[] {
  const outcome = assessment.correct ? "success" : "failure";
  const observedAt = new Date().toISOString();

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
Expected: PASS (12 tests).

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
});

const unseen = (skill: LearningItem["skill"]): LearningItem => ({
  id: `c1k:on#${skill}`, wordId: "c1k:on", skill,
  contentOrigin: "authored", schedule: { kind: "none" },
  repetitions: 0, lapses: 0, suspended: false,
});

const place = (a: AttemptAssessment, items = [unseen("meaning"), unseen("production")]) =>
  derivePlacements(deriveObservations(a), a, items, NOW);

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
    const placements = place(assess("production", "Easy"));
    for (const p of placements) {
      expect(p.schedule.kind).not.toBe("fsrs");
    }
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/verification/__tests__/placements.test.ts`
Expected: FAIL — `derivePlacements` no exportado.

- [ ] **Step 3: Implementar en `policy.ts`**

```ts
import { scheduleFsrsReview } from "@/lib/srs/fsrs-schedule";
import { provisionalDueAt, type ProvisionalOrigin } from "./provisional-intervals";
import type { ItemSchedule, LearningItem, SkillPlacement } from "./types";

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

### Task 3.5: Escritura de `ReviewLog` y aplicación de FSRS

**Files:**
- Create: `lib/essential-words/record-attempt.ts`
- Test: `lib/essential-words/__tests__/record-attempt.test.ts`

Este es **el** test de la fase: que un evento de práctica no toque el calendario.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/record-attempt.test.ts
import { describe, it, expect } from "vitest";
import { planAttemptRecord } from "../record-attempt";
import type { AttemptAssessment, LearningItem } from "../verification/types";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const assess = (grade: AttemptAssessment["grade"] = "Good"): AttemptAssessment => ({
  grade, modality: "production", correct: grade !== "Again",
  latencyMs: 3_000, interactionDurationMs: 9_000,
  usedHints: false, rescued: false, acceptedVariant: false,
});

const item = (skill: LearningItem["skill"], schedule: LearningItem["schedule"] = { kind: "none" }): LearningItem => ({
  id: `c1k:on#${skill}`, wordId: "c1k:on", skill,
  contentOrigin: "authored", schedule,
  repetitions: 0, lapses: 0, suspended: false,
});

const items = () => [item("meaning"), item("production")];

describe("planAttemptRecord — eventos que SÍ mueven el calendario", () => {
  it("un scheduled-review actualiza la programación", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess(),
      eventType: "scheduled-review", currentItems: items(), now: NOW,
    });
    expect(plan.log.affectsSchedule).toBe(true);
    expect(plan.updatedItems.length).toBeGreaterThan(0);
  });

  it("una verification actualiza la programación", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess("Easy"),
      eventType: "verification", currentItems: items(), now: NOW,
    });
    expect(plan.log.affectsSchedule).toBe(true);
    expect(plan.updatedItems.some((i) => i.schedule.kind === "provisional")).toBe(true);
  });
});

describe("planAttemptRecord — eventos que NO mueven el calendario", () => {
  it("un evento de práctica no cambia ningún schedule (invariante 12)", () => {
    const before = items();
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess(),
      eventType: "practice", currentItems: before, now: NOW,
    });
    expect(plan.log.affectsSchedule).toBe(false);
    expect(plan.updatedItems).toHaveLength(0);
  });

  it("un learning-step tampoco mueve el calendario", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess(),
      eventType: "learning-step", currentItems: items(), now: NOW,
    });
    expect(plan.log.affectsSchedule).toBe(false);
    expect(plan.updatedItems).toHaveLength(0);
  });

  it("un evento sin efecto no lleva fsrsLogId", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess(),
      eventType: "practice", currentItems: items(), now: NOW,
    });
    expect(plan.log.fsrsLogId).toBeUndefined();
  });

  it("un evento de práctica SÍ registra observaciones: es telemetría, no silencio", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess(),
      eventType: "practice", currentItems: items(), now: NOW,
    });
    expect(plan.log.observations).toHaveLength(2);
  });
});

describe("planAttemptRecord — contabilidad del ítem", () => {
  it("un Again incrementa lapses y no incrementa repetitions", () => {
    const current = [item("meaning", {
      kind: "fsrs", dueAt: "2026-08-10T00:00:00.000Z", stability: 10, difficulty: 5, state: "Review",
    }), item("production")];
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess("Again"),
      eventType: "scheduled-review", currentItems: current, now: NOW,
    });
    const meaning = plan.updatedItems.find((i) => i.skill === "meaning")!;
    expect(meaning.lapses).toBe(1);
    expect(meaning.repetitions).toBe(0);
  });

  it("un acierto incrementa repetitions", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess("Good"),
      eventType: "scheduled-review", currentItems: items(), now: NOW,
    });
    expect(plan.updatedItems.every((i) => i.repetitions === 1)).toBe(true);
  });

  it("nunca escribe mature ni status en el ítem (invariante 19)", () => {
    const plan = planAttemptRecord({
      wordId: "c1k:on", sessionId: "s1", assessment: assess(),
      eventType: "scheduled-review", currentItems: items(), now: NOW,
    });
    for (const updated of plan.updatedItems) {
      expect(updated).not.toHaveProperty("mature");
      expect(updated).not.toHaveProperty("status");
    }
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/record-attempt.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/record-attempt.ts
// Convierte un intento en (a) un ReviewLog y (b) los LearningItem
// actualizados. PURA: el I/O lo hace el llamante.
//
// La regla central de la fase (spec 1.10, invariante 12): todo intento
// produce telemetria, pero solo `verification` y `scheduled-review` mueven el
// calendario. Alimentar el optimizador FSRS con ejercicios que no eran
// recuperaciones programadas corromperia la calibracion.

import { deriveObservations, derivePlacements } from "./verification/policy";
import type {
  AttemptAssessment, LearningItem, ReviewLog,
} from "./verification/types";

/** Los unicos tipos de evento autorizados a modificar la programacion. */
const SCHEDULING_EVENTS = new Set<ReviewLog["eventType"]>([
  "verification",
  "scheduled-review",
]);

export interface AttemptRecordInput {
  wordId: string;
  sessionId: string;
  assessment: AttemptAssessment;
  eventType: ReviewLog["eventType"];
  currentItems: LearningItem[];
  now: Date;
}

export interface AttemptRecordPlan {
  log: ReviewLog;
  /** Vacio cuando el evento no afecta a la programacion. */
  updatedItems: LearningItem[];
}

export function planAttemptRecord(input: AttemptRecordInput): AttemptRecordPlan {
  const { assessment, currentItems, now, eventType } = input;
  const observations = deriveObservations(assessment);
  const affectsSchedule = SCHEDULING_EVENTS.has(eventType);

  const base = {
    id: crypto.randomUUID(),
    learningItemId: currentItems[0]?.id ?? input.wordId,
    sessionId: input.sessionId,
    assessment,
    observations,
    eventType,
    occurredAt: now.toISOString(),
  };

  if (!affectsSchedule) {
    // Telemetria sin efecto: la union discriminada impide adjuntar fsrsLogId.
    return { log: { ...base, affectsSchedule: false }, updatedItems: [] };
  }

  const placements = derivePlacements(observations, assessment, currentItems, now);
  const bySkill = new Map(currentItems.map((item) => [item.skill, item]));
  const isLapse = assessment.grade === "Again";

  const updatedItems = placements.flatMap((placement) => {
    const current = bySkill.get(placement.skill);
    if (!current) return [];
    return [{
      ...current,
      schedule: placement.schedule,
      lastReview: now.toISOString(),
      repetitions: current.repetitions + (isLapse ? 0 : 1),
      lapses: current.lapses + (isLapse ? 1 : 0),
    }];
  });

  return {
    log: { ...base, affectsSchedule: true, fsrsLogId: crypto.randomUUID() },
    updatedItems,
  };
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/record-attempt.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Ejecutar la fase completa**

Run: `pnpm test lib/essential-words && pnpm type-check && pnpm lint`
Expected: PASS. Los tests de caracterización de la Fase 0 siguen verdes: `attemptGrade` no se ha tocado.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/record-attempt.ts lib/essential-words/__tests__/record-attempt.test.ts
git commit -m "feat(essential-words): planAttemptRecord separa telemetria de evento SRS"
```

### Task 3.6: Primer intento sobre un provisional crea una tarjeta FSRS real

**Files:**
- Test: `lib/essential-words/__tests__/provisional-graduation.test.ts`

No hay código nuevo: es la comprobación de que la composición de 3.4 y 3.5 cumple la spec §1.6. Si falla, el arreglo va en `derivePlacements`.

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/provisional-graduation.test.ts
import { describe, it, expect } from "vitest";
import { planAttemptRecord } from "../record-attempt";
import type { AttemptAssessment, LearningItem } from "../verification/types";

const NOW = new Date("2026-08-20T10:00:00.000Z");

const provisional = (skill: LearningItem["skill"]): LearningItem => ({
  id: `c1k:on#${skill}`, wordId: "c1k:on", skill,
  contentOrigin: "authored",
  schedule: {
    kind: "provisional", dueAt: "2026-08-20T00:00:00.000Z",
    source: "direct", evidenceConfidence: 1,
  },
  repetitions: 0, lapses: 0, suspended: false,
});

const assess = (grade: AttemptAssessment["grade"]): AttemptAssessment => ({
  grade, modality: "production", correct: grade !== "Again",
  latencyMs: 3_000, interactionDurationMs: 9_000,
  usedHints: false, rescued: false, acceptedVariant: false,
});

const graduate = (grade: AttemptAssessment["grade"]) => planAttemptRecord({
  wordId: "c1k:on", sessionId: "s1", assessment: assess(grade),
  eventType: "scheduled-review",
  currentItems: [provisional("meaning"), provisional("production")],
  now: NOW,
});

describe("un provisional que vence y se practica", () => {
  it("adopta lo que devuelva FSRS, no un estado prefijado", () => {
    const updated = graduate("Good").updatedItems;
    expect(updated.every((i) => i.schedule.kind === "fsrs")).toBe(true);
  });

  it("con Again termina en aprendizaje, no en review (spec 1.6)", () => {
    const production = graduate("Again").updatedItems.find((i) => i.skill === "production")!;
    expect(production.schedule.kind).toBe("fsrs");
    if (production.schedule.kind === "fsrs") {
      expect(["Learning", "Relearning", "New"]).toContain(production.schedule.state);
    }
  });

  it("el primer evento FSRS real es este, no uno sintético", () => {
    // El provisional no tenía historial: no se fabricaron reviews previas.
    const plan = graduate("Good");
    expect(plan.log.affectsSchedule).toBe(true);
    expect(plan.updatedItems.every((i) => i.repetitions === 1)).toBe(true);
  });

  it("no arrastra stability inventada del provisional", () => {
    const meaning = graduate("Good").updatedItems.find((i) => i.skill === "meaning")!;
    if (meaning.schedule.kind === "fsrs") {
      expect(Number.isFinite(meaning.schedule.stability)).toBe(true);
      expect(meaning.schedule.stability).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/provisional-graduation.test.ts`
Expected: PASS (4 tests). Si el segundo falla porque un provisional con `Again` acaba en `Review`, corregir `scheduleForObservation`: un provisional debe entrar a FSRS con `INITIAL_FSRS`, no con estado `Review`.

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/__tests__/provisional-graduation.test.ts
git commit -m "test(essential-words): un provisional vencido crea una tarjeta FSRS real"
```

---

## Fase 4 — Planificador y presupuesto

**Objetivo:** la cola de seis tramos con presupuesto real, activaciones contabilizadas y modo recuperación con histéresis. **Aquí se resuelve el riesgo principal de acumulación.**

**Condición de salida:** invariantes 7, 11, 14, 27, 28, 29 verdes; los tests de caracterización de la Fase 0 sobre el gating viejo se borran **conscientemente** en la tarea 4.6, sustituidos por los nuevos.

### Task 4.1: Tipos de planificación

**Files:**
- Create: `lib/essential-words/planning-types.ts`
- Test: `lib/essential-words/__tests__/planning-types.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/planning-types.test.ts
import { describe, it, expect } from "vitest";
import type {
  DailyPlanningInput, DailyAllowance, PlannedItem, ActivationCandidate,
} from "../planning-types";

describe("tipos de planificación", () => {
  it("DailyAllowance separa tres unidades y devuelve plannedSeconds", () => {
    const allowance: DailyAllowance = {
      newWords: 3, skillActivations: 5, usageActivations: 1,
      plannedSeconds: 840, mode: "normal",
    };
    expect(allowance.newWords).not.toBe(allowance.skillActivations);
    expect(allowance.plannedSeconds).toBe(840);
  });

  it("los obligatorios se separan por categoría, no en un contador único", () => {
    const input: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      estimatedSeconds: {
        byModality: { recognition: 12, production: 25, listening: 20, pronunciation: 30 },
        newWordIntroduction: 40,
      },
      consumed: { skillActivations: 0, usageActivations: 0 },
    };
    expect(Object.keys(input.mandatory)).toHaveLength(4);
  });

  it("un PlannedItem lleva su modalidad para poder estimar su coste", () => {
    const planned: PlannedItem = {
      itemId: "c1k:on#meaning", wordId: "c1k:on", skill: "meaning",
      modality: "recognition", dueAt: "2026-08-06T00:00:00.000Z",
      retrievability: 0.72,
    };
    expect(planned.modality).toBe("recognition");
  });

  it("un candidato de activación declara qué habilidad activaría", () => {
    const candidate: ActivationCandidate = {
      itemId: "c1k:on#listening", wordId: "c1k:on", skill: "listening",
      modality: "listening",
    };
    expect(candidate.skill).toBe("listening");
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/planning-types.test.ts`
Expected: FAIL — "Cannot find module '../planning-types'".

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/planning-types.ts
// Contratos del planificador (spec 2.2). Cuatro contadores y un promedio
// global NO bastan para calcular tres presupuestos independientes: no dicen
// cuanto cuesta lo obligatorio, ni que candidatos hay de cada categoria, ni
// cuanto se lleva consumido en la sesion.

import type { AttemptModality, Skill } from "./verification/types";

/** Un item ya programado que compite por el tiempo de hoy. */
export interface PlannedItem {
  itemId: string;
  wordId: string;
  skill: Skill;
  /** Como se va a practicar: determina su coste estimado. */
  modality: AttemptModality;
  dueAt: string;
  /** Recuperabilidad FSRS, si la tiene. Los provisionales no. */
  retrievability?: number;
}

/** Una habilidad que existe con schedule "none" y podria activarse hoy. */
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

export interface DailyPlanningInput {
  dailyBudgetSeconds: number;

  /** No negociable: se planifica siempre y consume presupuesto antes que nada. */
  mandatory: {
    learning: PlannedItem[];
    overdue: PlannedItem[];
    dueToday: PlannedItem[];
    provisionalDue: PlannedItem[];
  };

  /** Negociable: entra solo con el presupuesto que sobre, por tramos (spec 2.1). */
  candidates: {
    baseSkillActivations: ActivationCandidate[];
    usageActivations: ActivationCandidate[];
    newWords: NewWordCandidate[];
  };

  estimatedSeconds: {
    byModality: Record<AttemptModality, number>;
    newWordIntroduction: number;
  };

  /** Ya gastado en esta sesion: el helper es idempotente al recalcularse. */
  consumed: {
    skillActivations: number;
    usageActivations: number;
  };

  /** Modo de la sesion anterior, para la histeresis del modo recuperacion. */
  previousMode?: "normal" | "recovery";
}

export interface DailyAllowance {
  newWords: number;
  skillActivations: number;
  usageActivations: number;
  /** Coste estimado de la cola resultante. Es lo que la simulacion (Fase 8)
   *  mide contra el presupuesto; sin devolverlo habria que recalcularlo
   *  fuera con otra formula. */
  plannedSeconds: number;
  mode: "normal" | "recovery";
}

/** Limites de activacion. PROVISIONALES: se calibran en la Fase 8. */
export interface ActivationLimits {
  maxSkillActivationsPerSession: number;
  maxUsageActivationsPerSession: number;
  /** Maximo una activacion nueva persistente por habilidad y sesion. */
  maxPerSkillPerSession: number;
}

export const DEFAULT_ACTIVATION_LIMITS: ActivationLimits = {
  maxSkillActivationsPerSession: 6,
  maxUsageActivationsPerSession: 2,
  maxPerSkillPerSession: 1,
};

/** Presupuesto por defecto: 15 minutos (spec 2.2). */
export const DEFAULT_DAILY_BUDGET_SECONDS = 900;
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/__tests__/planning-types.test.ts && pnpm type-check`
Expected: PASS (4 tests).

```bash
git add lib/essential-words/planning-types.ts lib/essential-words/__tests__/planning-types.test.ts
git commit -m "feat(essential-words): contratos de planificacion con tres unidades de presupuesto"
```

### Task 4.2: Estimación de coste por modalidad

**Files:**
- Create: `lib/essential-words/cost-estimate.ts`
- Test: `lib/essential-words/__tests__/cost-estimate.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/cost-estimate.test.ts
import { describe, it, expect } from "vitest";
import {
  estimateItemsSeconds, estimateFromLogs, DEFAULT_SECONDS_BY_MODALITY,
} from "../cost-estimate";
import type { PlannedItem } from "../planning-types";
import type { ReviewLog } from "../verification/types";

const planned = (modality: PlannedItem["modality"]): PlannedItem => ({
  itemId: `c1k:x#${modality}`, wordId: "c1k:x", skill: "meaning",
  modality, dueAt: "2026-08-06T00:00:00.000Z",
});

const log = (modality: PlannedItem["modality"], durationMs: number): ReviewLog => ({
  id: crypto.randomUUID(), learningItemId: "c1k:x#meaning", sessionId: "s1",
  assessment: {
    grade: "Good", modality, correct: true,
    latencyMs: Math.round(durationMs / 3), interactionDurationMs: durationMs,
    usedHints: false, rescued: false, acceptedVariant: false,
  },
  observations: [], eventType: "scheduled-review",
  affectsSchedule: true, fsrsLogId: "f1",
  occurredAt: "2026-08-06T10:00:00.000Z",
});

describe("estimateItemsSeconds", () => {
  it("suma el coste de cada ítem según SU modalidad", () => {
    const seconds = estimateItemsSeconds(
      [planned("recognition"), planned("pronunciation")],
      DEFAULT_SECONDS_BY_MODALITY,
    );
    expect(seconds).toBe(
      DEFAULT_SECONDS_BY_MODALITY.recognition + DEFAULT_SECONDS_BY_MODALITY.pronunciation,
    );
  });

  it("una lista vacía cuesta cero", () => {
    expect(estimateItemsSeconds([], DEFAULT_SECONDS_BY_MODALITY)).toBe(0);
  });

  it("las modalidades con audio cuestan más que reconocimiento", () => {
    // Un promedio global único haría desbordarse a quien practica audio.
    expect(DEFAULT_SECONDS_BY_MODALITY.listening)
      .toBeGreaterThan(DEFAULT_SECONDS_BY_MODALITY.recognition);
    expect(DEFAULT_SECONDS_BY_MODALITY.pronunciation)
      .toBeGreaterThan(DEFAULT_SECONDS_BY_MODALITY.recognition);
  });
});

describe("estimateFromLogs", () => {
  it("mide con interactionDurationMs, no con latencyMs", () => {
    const logs = [log("listening", 30_000), log("listening", 30_000)];
    const estimate = estimateFromLogs(logs, DEFAULT_SECONDS_BY_MODALITY, 2);
    expect(estimate.listening).toBe(30);
  });

  it("mantiene el valor por defecto si no hay muestras suficientes", () => {
    const estimate = estimateFromLogs([log("listening", 60_000)], DEFAULT_SECONDS_BY_MODALITY, 5);
    expect(estimate.listening).toBe(DEFAULT_SECONDS_BY_MODALITY.listening);
  });

  it("cada modalidad se calibra por separado", () => {
    const logs = [
      log("recognition", 6_000), log("recognition", 6_000),
      log("pronunciation", 45_000), log("pronunciation", 45_000),
    ];
    const estimate = estimateFromLogs(logs, DEFAULT_SECONDS_BY_MODALITY, 2);
    expect(estimate.recognition).toBe(6);
    expect(estimate.pronunciation).toBe(45);
    // Las no medidas conservan su valor por defecto.
    expect(estimate.listening).toBe(DEFAULT_SECONDS_BY_MODALITY.listening);
  });

  it("solo usa logs con affectsSchedule true", () => {
    const practice = {
      ...log("recognition", 90_000), affectsSchedule: false, fsrsLogId: undefined,
    } as ReviewLog;
    const estimate = estimateFromLogs([practice, practice], DEFAULT_SECONDS_BY_MODALITY, 2);
    expect(estimate.recognition).toBe(DEFAULT_SECONDS_BY_MODALITY.recognition);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/cost-estimate.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/cost-estimate.ts
// Coste estimado POR MODALIDAD, no con un promedio global (spec 2.2). Una
// dictacion con audio y una eleccion multiple no duran lo mismo, y un usuario
// que practica sobre todo audio veria su sesion desbordarse con un unico
// promedio.

import type { AttemptModality, ReviewLog } from "./verification/types";
import type { PlannedItem } from "./planning-types";

/**
 * Segundos por interaccion completa (audio + lectura + respuesta +
 * transicion), no solo latencia de respuesta.
 *
 * PROVISIONALES (spec 10, decision 3): se reemplazan por la medicion real del
 * usuario en cuanto haya muestras suficientes.
 */
export const DEFAULT_SECONDS_BY_MODALITY: Record<AttemptModality, number> = {
  recognition: 12,
  production: 25,
  listening: 20,
  pronunciation: 30,
};

export function estimateItemsSeconds(
  items: PlannedItem[],
  byModality: Record<AttemptModality, number>,
): number {
  return items.reduce((total, item) => total + byModality[item.modality], 0);
}

/**
 * Recalibra los costes con el historial real. Solo cuentan los logs con
 * `affectsSchedule: true`: los pasos de practica intra-sesion tienen otra
 * dinamica y contaminarian la estimacion de una sesion de repaso.
 *
 * Una modalidad con menos de `minSamples` muestras conserva su valor por
 * defecto: es mejor una estimacion declarada que una medicion de una muestra.
 */
export function estimateFromLogs(
  logs: ReviewLog[],
  fallback: Record<AttemptModality, number>,
  minSamples: number,
): Record<AttemptModality, number> {
  const totals = new Map<AttemptModality, { sum: number; count: number }>();

  for (const log of logs) {
    if (!log.affectsSchedule) continue;
    const { modality, interactionDurationMs } = log.assessment;
    const acc = totals.get(modality) ?? { sum: 0, count: 0 };
    acc.sum += interactionDurationMs;
    acc.count += 1;
    totals.set(modality, acc);
  }

  const result = { ...fallback };
  for (const [modality, { sum, count }] of totals) {
    if (count < minSamples) continue;
    result[modality] = Math.round(sum / count / 1000);
  }
  return result;
}
```

- [ ] **Step 4: Ejecutar y commit**

Run: `pnpm test lib/essential-words/__tests__/cost-estimate.test.ts`
Expected: PASS (8 tests).

```bash
git add lib/essential-words/cost-estimate.ts lib/essential-words/__tests__/cost-estimate.test.ts
git commit -m "feat(essential-words): estimacion de coste por modalidad medida con interactionDuration"
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
  itemId: crypto.randomUUID(), wordId: "c1k:x", skill: "meaning",
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

### Task 4.4: `planDailyAllowance`

**Files:**
- Create: `lib/essential-words/daily-budget.ts`
- Test: `lib/essential-words/__tests__/daily-budget.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/daily-budget.test.ts
import { describe, it, expect } from "vitest";
import { planDailyAllowance } from "../daily-budget";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import { DEFAULT_ACTIVATION_LIMITS } from "../planning-types";
import type {
  ActivationCandidate, DailyPlanningInput, PlannedItem,
} from "../planning-types";

const item = (modality: PlannedItem["modality"] = "recognition"): PlannedItem => ({
  itemId: crypto.randomUUID(), wordId: `c1k:${Math.random()}`, skill: "meaning",
  modality, dueAt: "2026-08-01T00:00:00.000Z",
});

const activation = (skill: ActivationCandidate["skill"], wordId = "c1k:x"): ActivationCandidate => ({
  itemId: `${wordId}#${skill}`, wordId, skill,
  modality: skill === "listening" ? "listening" : "production",
});

const input = (over: Partial<DailyPlanningInput> = {}): DailyPlanningInput => ({
  dailyBudgetSeconds: 900,
  mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
  candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
  estimatedSeconds: {
    byModality: DEFAULT_SECONDS_BY_MODALITY,
    newWordIntroduction: 40,
  },
  consumed: { skillActivations: 0, usageActivations: 0 },
  ...over,
});

const newWords = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ wordId: `c1k:new${i}`, rank: i }));

describe("planDailyAllowance — lo obligatorio manda", () => {
  it("con presupuesto libre introduce palabras nuevas", () => {
    const allowance = planDailyAllowance(input({
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: newWords(10) },
    }), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.newWords).toBeGreaterThan(0);
    expect(allowance.mode).toBe("normal");
  });

  it("con los atrasados llenando el presupuesto no introduce nada nuevo", () => {
    // 60 repasos × 12s = 720s de 900s: casi todo el presupuesto.
    const allowance = planDailyAllowance(input({
      mandatory: {
        learning: [], overdue: Array.from({ length: 60 }, () => item()),
        dueToday: [], provisionalDue: [],
      },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: newWords(10) },
    }), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.newWords).toBe(0);
  });

  it("ESTE es el bug que corregimos: 40 atrasados ya no dejan pasar 10 nuevas", () => {
    const allowance = planDailyAllowance(input({
      mandatory: {
        learning: [], overdue: Array.from({ length: 40 }, () => item("production")),
        dueToday: [], provisionalDue: [],
      },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: newWords(10) },
    }), DEFAULT_ACTIVATION_LIMITS);
    // 40 × 25s = 1000s > 900s de presupuesto.
    expect(allowance.newWords).toBe(0);
    expect(allowance.mode).toBe("recovery");
  });

  it("plannedSeconds refleja el coste de la cola resultante", () => {
    const allowance = planDailyAllowance(input({
      mandatory: {
        learning: [], overdue: [item(), item()], dueToday: [], provisionalDue: [],
      },
    }), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.plannedSeconds).toBeGreaterThanOrEqual(
      DEFAULT_SECONDS_BY_MODALITY.recognition * 2,
    );
  });
});

describe("planDailyAllowance — contabilidad de activaciones", () => {
  it("introducir una palabra consume al menos una skillActivation (invariante 27)", () => {
    const allowance = planDailyAllowance(input({
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: newWords(3) },
    }), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.skillActivations).toBeGreaterThanOrEqual(allowance.newWords);
  });

  it("respeta el límite de activaciones por sesión", () => {
    const allowance = planDailyAllowance(input({
      candidates: {
        baseSkillActivations: Array.from({ length: 20 }, (_, i) =>
          activation("listening", `c1k:w${i}`)),
        usageActivations: [], newWords: [],
      },
    }), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.skillActivations)
      .toBeLessThanOrEqual(DEFAULT_ACTIVATION_LIMITS.maxSkillActivationsPerSession);
  });

  it("descuenta lo ya consumido en la sesión", () => {
    const base = input({
      candidates: {
        baseSkillActivations: Array.from({ length: 20 }, (_, i) =>
          activation("listening", `c1k:w${i}`)),
        usageActivations: [], newWords: [],
      },
    });
    const fresh = planDailyAllowance(base, DEFAULT_ACTIVATION_LIMITS);
    const partial = planDailyAllowance(
      { ...base, consumed: { skillActivations: 4, usageActivations: 0 } },
      DEFAULT_ACTIVATION_LIMITS,
    );
    expect(partial.skillActivations).toBeLessThan(fresh.skillActivations);
  });

  it("los usage cuentan contra el presupuesto (invariante 7)", () => {
    const allowance = planDailyAllowance(input({
      dailyBudgetSeconds: 60, // presupuesto minúsculo
      mandatory: {
        learning: [], overdue: [item("production"), item("production")],
        dueToday: [], provisionalDue: [],
      },
      candidates: {
        baseSkillActivations: [], newWords: [],
        usageActivations: [activation("usage" as never), activation("usage" as never)],
      },
    }), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.usageActivations).toBe(0);
  });
});

describe("planDailyAllowance — modo recuperación", () => {
  const overloaded = () => input({
    dailyBudgetSeconds: 900,
    mandatory: {
      learning: [], overdue: Array.from({ length: 200 }, () => item()),
      dueToday: [], provisionalDue: [],
    },
    candidates: {
      baseSkillActivations: [activation("listening")],
      usageActivations: [activation("usage" as never)],
      newWords: newWords(10),
    },
  });

  it("cero palabras nuevas", () => {
    expect(planDailyAllowance(overloaded(), DEFAULT_ACTIVATION_LIMITS).newWords).toBe(0);
  });

  it("cero activaciones de habilidad base y de usage", () => {
    const allowance = planDailyAllowance(overloaded(), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.skillActivations).toBe(0);
    expect(allowance.usageActivations).toBe(0);
  });

  it("declara el modo explícitamente para que la UI pueda comunicarlo", () => {
    expect(planDailyAllowance(overloaded(), DEFAULT_ACTIVATION_LIMITS).mode).toBe("recovery");
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/daily-budget.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/daily-budget.ts
// Presupuesto diario en TRES unidades distintas (spec 2.2): "palabra nueva" e
// "item nuevo" no son lo mismo, y colapsarlas fue lo que dejaba pasar diez
// palabras nuevas por encima de cuarenta repasos atrasados.

import { estimateItemsSeconds } from "./cost-estimate";
import { backlogSeconds, resolveMode, DEFAULT_RECOVERY_POLICY, type RecoveryPolicy } from "./recovery-mode";
import type {
  ActivationCandidate, ActivationLimits, DailyAllowance, DailyPlanningInput,
} from "./planning-types";

/**
 * Cuantas habilidades activa de facto introducir una palabra. `meaning` se
 * activa al introducirla, asi que el minimo es 1 (invariante 27).
 */
const SKILL_ACTIVATIONS_PER_NEW_WORD = 1;

export function planDailyAllowance(
  input: DailyPlanningInput,
  limits: ActivationLimits,
  policy: RecoveryPolicy = DEFAULT_RECOVERY_POLICY,
): DailyAllowance {
  const { byModality } = input.estimatedSeconds;

  const mandatorySeconds = estimateItemsSeconds(
    [
      ...input.mandatory.learning,
      ...input.mandatory.overdue,
      ...input.mandatory.dueToday,
      ...input.mandatory.provisionalDue,
    ],
    byModality,
  );

  const backlog = backlogSeconds(input.mandatory, byModality);
  const mode = resolveMode(backlog, input.dailyBudgetSeconds, input.previousMode, policy);

  if (mode === "recovery") {
    // Cero de todo lo negociable (spec 2.3). Lo obligatorio sigue planificado:
    // el modo acota la sesion, no cancela los repasos.
    return {
      newWords: 0, skillActivations: 0, usageActivations: 0,
      plannedSeconds: mandatorySeconds, mode,
    };
  }

  let remaining = input.dailyBudgetSeconds - mandatorySeconds;

  // Tramo 4: activaciones de habilidad base.
  const skillActivations = fitActivations(
    input.candidates.baseSkillActivations,
    remaining,
    byModality,
    Math.max(0, limits.maxSkillActivationsPerSession - input.consumed.skillActivations),
    limits.maxPerSkillPerSession,
  );
  remaining -= skillActivations.seconds;

  // Tramo 5: activaciones de usage.
  const usageActivations = fitActivations(
    input.candidates.usageActivations,
    remaining,
    byModality,
    Math.max(0, limits.maxUsageActivationsPerSession - input.consumed.usageActivations),
    limits.maxPerSkillPerSession,
  );
  remaining -= usageActivations.seconds;

  // Tramo 6: palabras nuevas, solo con lo que sobre. El coste de una palabra
  // incluye su introduccion Y la activacion de `meaning` que dispara.
  const perNewWord = input.estimatedSeconds.newWordIntroduction
    + byModality.recognition * SKILL_ACTIVATIONS_PER_NEW_WORD;
  const affordableWords = perNewWord > 0 ? Math.floor(remaining / perNewWord) : 0;
  const newWords = Math.max(0, Math.min(input.candidates.newWords.length, affordableWords));
  const newWordSeconds = newWords * perNewWord;

  return {
    newWords,
    // Invariante 27: cada palabra nueva consume al menos una activacion.
    skillActivations: skillActivations.count + newWords * SKILL_ACTIVATIONS_PER_NEW_WORD,
    usageActivations: usageActivations.count,
    plannedSeconds: mandatorySeconds
      + skillActivations.seconds + usageActivations.seconds + newWordSeconds,
    mode,
  };
}

/**
 * Cuantos candidatos caben en `remaining`, respetando el tope de sesion y el
 * maximo de una activacion nueva por habilidad.
 */
function fitActivations(
  candidates: ActivationCandidate[],
  remaining: number,
  byModality: DailyPlanningInput["estimatedSeconds"]["byModality"],
  sessionCap: number,
  perSkillCap: number,
): { count: number; seconds: number } {
  const perSkill = new Map<string, number>();
  let count = 0;
  let seconds = 0;

  for (const candidate of candidates) {
    if (count >= sessionCap) break;
    const used = perSkill.get(candidate.skill) ?? 0;
    if (used >= perSkillCap) continue;

    const cost = byModality[candidate.modality];
    if (seconds + cost > remaining) break;

    seconds += cost;
    count += 1;
    perSkill.set(candidate.skill, used + 1);
  }

  return { count, seconds };
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/daily-budget.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Verificar el tamaño**

Run: `wc -l lib/essential-words/daily-budget.ts`
Expected: <250.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/daily-budget.ts lib/essential-words/__tests__/daily-budget.test.ts
git commit -m "feat(essential-words): planDailyAllowance con tres presupuestos y gating real"
```

### Task 4.5: Cola de seis tramos

**Files:**
- Create: `lib/essential-words/skill-queue.ts`
- Test: `lib/essential-words/__tests__/skill-queue.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
// lib/essential-words/__tests__/skill-queue.test.ts
import { describe, it, expect } from "vitest";
import { buildSkillQueue } from "../skill-queue";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import type { ActivationCandidate, DailyAllowance, PlannedItem } from "../planning-types";

const item = (
  over: Partial<PlannedItem> = {},
): PlannedItem => ({
  itemId: crypto.randomUUID(), wordId: "c1k:x", skill: "meaning",
  modality: "recognition", dueAt: "2026-08-01T00:00:00.000Z", ...over,
});

const allowance = (over: Partial<DailyAllowance> = {}): DailyAllowance => ({
  newWords: 2, skillActivations: 2, usageActivations: 1,
  plannedSeconds: 0, mode: "normal", ...over,
});

describe("buildSkillQueue — orden de los seis tramos", () => {
  it("learning va primero, antes que atrasados", () => {
    const learning = item({ skill: "production" });
    const overdue = item({ skill: "meaning" });
    const queue = buildSkillQueue({
      mandatory: { learning: [learning], overdue: [overdue], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      allowance: allowance(),
    });
    expect(queue[0].itemId).toBe(learning.itemId);
  });

  it("los atrasados van antes que los que vencen hoy", () => {
    const overdue = item();
    const dueToday = item();
    const queue = buildSkillQueue({
      mandatory: { learning: [], overdue: [overdue], dueToday: [dueToday], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      allowance: allowance(),
    });
    expect(queue.map((i) => i.itemId)).toEqual([overdue.itemId, dueToday.itemId]);
  });

  it("las activaciones de habilidad base ocupan el tramo 4, antes que usage y nuevas", () => {
    const activation: ActivationCandidate = {
      itemId: "c1k:on#listening", wordId: "c1k:on", skill: "listening", modality: "listening",
    };
    const usage: ActivationCandidate = {
      itemId: "c1k:on#usage:depend-on", wordId: "c1k:on", skill: "usage", modality: "production",
    };
    const queue = buildSkillQueue({
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [activation], usageActivations: [usage],
        newWords: [{ wordId: "c1k:new", rank: 1 }],
      },
      allowance: allowance({ newWords: 1, skillActivations: 1, usageActivations: 1 }),
    });
    const ids = queue.map((i) => i.itemId);
    expect(ids.indexOf("c1k:on#listening")).toBeLessThan(ids.indexOf("c1k:on#usage:depend-on"));
  });
});

describe("buildSkillQueue — prioridad dentro de los atrasados", () => {
  it("ordena por recuperabilidad ascendente, no por frecuencia", () => {
    const urgent = item({ itemId: "urgent", retrievability: 0.30 });
    const relaxed = item({ itemId: "relaxed", retrievability: 0.85 });
    const queue = buildSkillQueue({
      mandatory: { learning: [], overdue: [relaxed, urgent], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      allowance: allowance(),
    });
    expect(queue.map((i) => i.itemId)).toEqual(["urgent", "relaxed"]);
  });

  it("los provisionales, sin recuperabilidad, se ordenan por antigüedad de vencimiento", () => {
    const older = item({ itemId: "older", dueAt: "2026-07-01T00:00:00.000Z" });
    const newer = item({ itemId: "newer", dueAt: "2026-08-01T00:00:00.000Z" });
    const queue = buildSkillQueue({
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [newer, older] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      allowance: allowance(),
    });
    expect(queue.map((i) => i.itemId)).toEqual(["older", "newer"]);
  });
});

describe("buildSkillQueue — respeta el allowance", () => {
  it("no mete más activaciones de las concedidas (invariante 11)", () => {
    const candidates = Array.from({ length: 10 }, (_, i): ActivationCandidate => ({
      itemId: `c1k:w${i}#listening`, wordId: `c1k:w${i}`, skill: "listening", modality: "listening",
    }));
    const queue = buildSkillQueue({
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: candidates, usageActivations: [], newWords: [] },
      allowance: allowance({ skillActivations: 2, newWords: 0, usageActivations: 0 }),
    });
    expect(queue).toHaveLength(2);
  });

  it("en modo recuperación la cola son solo obligatorios", () => {
    const queue = buildSkillQueue({
      mandatory: { learning: [item()], overdue: [item()], dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [{
          itemId: "a", wordId: "c1k:x", skill: "listening", modality: "listening",
        }],
        usageActivations: [], newWords: [{ wordId: "c1k:new", rank: 1 }],
      },
      allowance: allowance({ newWords: 0, skillActivations: 0, usageActivations: 0, mode: "recovery" }),
    });
    expect(queue).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Ejecutar — debe fallar**

Run: `pnpm test lib/essential-words/__tests__/skill-queue.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

```ts
// lib/essential-words/skill-queue.ts
// Cola de SEIS tramos (spec 2.1). El tramo 4 faltaba en el diseño anterior:
// habia sitio para usage y palabras nuevas, pero no para un `listening` que
// existe con schedule "none" y espera activacion, asi que la politica de
// activacion no tenia ejecutor.

import type {
  ActivationCandidate, DailyAllowance, DailyPlanningInput, PlannedItem,
} from "./planning-types";

export interface SkillQueueInput {
  mandatory: DailyPlanningInput["mandatory"];
  candidates: DailyPlanningInput["candidates"];
  allowance: DailyAllowance;
}

/**
 * Menor recuperabilidad primero: es lo que esta a punto de olvidarse. El
 * modelo anterior ordenaba por `entry.rank`, que es frecuencia lexica, no
 * urgencia de repaso.
 */
function byUrgency(a: PlannedItem, b: PlannedItem): number {
  if (a.retrievability !== undefined && b.retrievability !== undefined) {
    return a.retrievability - b.retrievability;
  }
  // Los provisionales no tienen recuperabilidad FSRS: se ordenan por
  // antiguedad de vencimiento.
  return a.dueAt.localeCompare(b.dueAt);
}

function activationToPlanned(candidate: ActivationCandidate): PlannedItem {
  return {
    itemId: candidate.itemId,
    wordId: candidate.wordId,
    skill: candidate.skill,
    modality: candidate.modality,
    // Una activacion se practica hoy por definicion.
    dueAt: new Date(0).toISOString(),
  };
}

export function buildSkillQueue(input: SkillQueueInput): PlannedItem[] {
  const { mandatory, candidates, allowance } = input;

  return [
    // 1. Learning / Relearning
    ...[...mandatory.learning].sort(byUrgency),
    // 2. Provisionales vencidos y repasos atrasados
    ...[...mandatory.overdue, ...mandatory.provisionalDue].sort(byUrgency),
    // 3. Repasos que vencen hoy
    ...[...mandatory.dueToday].sort(byUrgency),
    // 4. Activaciones de habilidad base
    ...candidates.baseSkillActivations
      .slice(0, allowance.skillActivations)
      .map(activationToPlanned),
    // 5. Activaciones de usage
    ...candidates.usageActivations
      .slice(0, allowance.usageActivations)
      .map(activationToPlanned),
    // 6. Palabras nuevas — solo con el presupuesto que sobre
    ...candidates.newWords
      .slice(0, allowance.newWords)
      .map((word): PlannedItem => ({
        itemId: `${word.wordId}#meaning`,
        wordId: word.wordId,
        skill: "meaning",
        modality: "recognition",
        dueAt: new Date(0).toISOString(),
      })),
  ];
}
```

- [ ] **Step 4: Ejecutar**

Run: `pnpm test lib/essential-words/__tests__/skill-queue.test.ts`
Expected: PASS (7 tests). Nota: el test "no mete más activaciones de las concedidas" cuenta 2 porque `allowance.skillActivations` es 2, aunque `maxPerSkillPerSession` limite las de una MISMA habilidad — el allowance ya viene calculado de 4.4.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/skill-queue.ts lib/essential-words/__tests__/skill-queue.test.ts
git commit -m "feat(essential-words): cola de seis tramos ordenada por urgencia"
```

### Task 4.6: Retirar los tests de caracterización del gating viejo

**Files:**
- Delete: `lib/essential-words/__tests__/queue.characterization.test.ts`
- Create: `lib/essential-words/__tests__/gating-regression.test.ts`

El fichero de la Fase 0 documentaba el bug. Ahora que existe el gating correcto, se sustituye por su contrario. Borrarlo es una decisión, no un descuido: por eso es un paso explícito.

- [ ] **Step 1: Escribir el test de regresión**

```ts
// lib/essential-words/__tests__/gating-regression.test.ts
// Sustituye a queue.characterization.test.ts (Fase 0), que documentaba el
// gating roto. Cada test de aquí es el contrario de uno de allí.

import { describe, it, expect } from "vitest";
import { planDailyAllowance } from "../daily-budget";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import { DEFAULT_ACTIVATION_LIMITS } from "../planning-types";
import { buildSkillQueue } from "../skill-queue";
import type { DailyPlanningInput, PlannedItem } from "../planning-types";

const overdue = (n: number): PlannedItem[] =>
  Array.from({ length: n }, (_, i) => ({
    itemId: `c1k:w${i}#meaning`, wordId: `c1k:w${i}`, skill: "meaning",
    modality: "production", dueAt: "2026-08-01T00:00:00.000Z",
    retrievability: 0.4 + i / 1000,
  }));

const input = (overdueCount: number): DailyPlanningInput => ({
  dailyBudgetSeconds: 900,
  mandatory: { learning: [], overdue: overdue(overdueCount), dueToday: [], provisionalDue: [] },
  candidates: {
    baseSkillActivations: [], usageActivations: [],
    newWords: Array.from({ length: 10 }, (_, i) => ({ wordId: `c1k:new${i}`, rank: i })),
  },
  estimatedSeconds: {
    byModality: DEFAULT_SECONDS_BY_MODALITY, newWordIntroduction: 40,
  },
  consumed: { skillActivations: 0, usageActivations: 0 },
});

describe("el gating ya NO ignora los repasos atrasados", () => {
  it("40 atrasados bloquean las palabras nuevas", () => {
    const allowance = planDailyAllowance(input(40), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.newWords).toBe(0);
  });

  it("sin atrasados sí introduce palabras nuevas", () => {
    const allowance = planDailyAllowance(input(0), DEFAULT_ACTIVATION_LIMITS);
    expect(allowance.newWords).toBeGreaterThan(0);
  });

  it("la deuda alta activa el modo recuperación en vez de acumular en silencio", () => {
    expect(planDailyAllowance(input(100), DEFAULT_ACTIVATION_LIMITS).mode).toBe("recovery");
  });
});

describe("los repasos ya NO se ordenan por frecuencia", () => {
  it("ordena por recuperabilidad ascendente", () => {
    const common: PlannedItem = {
      itemId: "common", wordId: "c1k:common", skill: "meaning",
      modality: "recognition", dueAt: "2026-08-01T00:00:00.000Z", retrievability: 0.9,
    };
    const rare: PlannedItem = {
      itemId: "rare", wordId: "c1k:rare", skill: "meaning",
      modality: "recognition", dueAt: "2026-08-01T00:00:00.000Z", retrievability: 0.2,
    };
    const queue = buildSkillQueue({
      mandatory: { learning: [], overdue: [common, rare], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      allowance: { newWords: 0, skillActivations: 0, usageActivations: 0, plannedSeconds: 0, mode: "normal" },
    });
    // Lo que está a punto de olvidarse va primero, sea frecuente o no.
    expect(queue[0].itemId).toBe("rare");
  });
});
```

- [ ] **Step 2: Ejecutar el nuevo test**

Run: `pnpm test lib/essential-words/__tests__/gating-regression.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 3: Borrar el test de caracterización, ya sustituido**

```bash
git rm lib/essential-words/__tests__/queue.characterization.test.ts
```

- [ ] **Step 4: Verificar la fase completa**

Run: `pnpm test lib/essential-words && pnpm type-check && pnpm lint`
Expected: PASS. `queue.ts` sigue intacto y en uso por la ruta vieja: el flag sigue apagado.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/__tests__/gating-regression.test.ts
git commit -m "test(essential-words): sustituir caracterizacion del gating roto por su regresion

El fichero de la Fase 0 fijaba el bug (10 nuevas por encima de 40 atrasados)
para que corregirlo fuera una decision explicita. Ya existe el gating real,
asi que se retira y se sustituye por los tests contrarios."
```
