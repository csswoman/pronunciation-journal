import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../../cost-estimate";
import { emptyLoadBreakdown } from "../../planning-load";
import type { DailyPlan, PlannedItem } from "../../planning-types";
import { applyCompletedSession, completePlannedSession } from "../apply-session";
import { PROFILES } from "../profiles";
import { seededRandom } from "../random";
import { createInitialWorld, simulationContext } from "../state";

// Task 8.9f — bug found: completar listening/production "observa" (reprograma)
// meaning como efecto lateral (record-attempt.ts / itemsObservedBy). Eso es
// legítimo cuando meaning NO tiene su propia completion esa sesión. Pero si
// meaning SÍ fue reservado/servido directamente como mandatory en la MISMA
// sesión, la observación lateral de listening/production lo revisa una
// SEGUNDA vez, con la calificación equivocada (la de listening/production),
// pisando el primer resultingSchedule. Es doble aplicación de FSRS al mismo
// item en una sesión — bug de ownership, no política.
const NOW = new Date("2026-08-20T00:00:00.000Z");
const options = {
  days: 180, corpusSize: 1, seed: 42, startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900, targetNewWords: 10,
};

function buildPlan(meaningItem: PlannedItem, listeningItem: PlannedItem): DailyPlan {
  return {
    allowance: {
      newWords: 0, capacitySafeNewWords: 0, baseSkillActivations: 1, usageActivations: 0,
      newWordMeaningActivations: 0, totalSkillActivations: 1, plannedSeconds: 0, mode: "normal",
    },
    mandatorySelected: [meaningItem],
    deferredMandatory: [],
    baseSkillSelected: [listeningItem],
    usageSelected: [],
    newWordsSelected: [],
    placementSelected: [],
    placementDeferred: 0,
    futureReservations: [],
    loadBreakdown: emptyLoadBreakdown(),
  };
}

describe("Task 8.9f — meaning no se revisa dos veces en la misma sesión (fix ownership)", () => {
  it("una scheduled-review de meaning y una activación base de listening en la misma sesión sólo generan UN srsEvent para meaning", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = {
      kind: "fsrs", dueAt: NOW.toISOString(), stability: 10, difficulty: 5, state: "Review",
    };
    word.meaning.lastReview = "2026-08-10T00:00:00.000Z";

    const meaningItem: PlannedItem = {
      itemId: word.meaning.id, wordId: word.wordId, skill: "meaning", modality: "recognition", dueAt: NOW.toISOString(),
    };
    const listeningItem: PlannedItem = {
      itemId: word.listening.id, wordId: word.wordId, skill: "listening", modality: "listening", dueAt: "",
    };
    const plan = buildPlan(meaningItem, listeningItem);
    const completions = completePlannedSession(
      [meaningItem, listeningItem],
      PROFILES.steady,
      DEFAULT_SECONDS_BY_MODALITY,
      900,
      seededRandom(42),
      {
        now: NOW,
        resolveItem: (item) => (item.itemId === word.meaning.id ? word.meaning : word.listening),
      },
    );

    applyCompletedSession(world, plan, completions, simulationContext(NOW, 42, { value: 0 }), "session-double");

    const meaningEvents = world.srsEvents.filter((event) => event.learningItemId === word.meaning.id);
    expect(meaningEvents).toHaveLength(1);
    // El único evento de meaning debe partir del schedule ORIGINAL (no de un
    // resultingSchedule intermedio ya pisado por la observación de listening).
    expect(meaningEvents[0].priorSchedule).toMatchObject({ dueAt: NOW.toISOString() });

    const listeningEvents = world.srsEvents.filter((event) => event.learningItemId === word.listening.id);
    expect(listeningEvents).toHaveLength(1);
  });

  it("sin completion directa de meaning, la observación de listening SÍ sigue reprogramando meaning (política legítima intacta)", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = {
      kind: "fsrs", dueAt: "2026-09-05T00:00:00.000Z", stability: 10, difficulty: 5, state: "Review",
    };
    word.meaning.lastReview = "2026-08-10T00:00:00.000Z";

    const listeningItem: PlannedItem = {
      itemId: word.listening.id, wordId: word.wordId, skill: "listening", modality: "listening", dueAt: "",
    };
    const plan: DailyPlan = {
      allowance: {
        newWords: 0, capacitySafeNewWords: 0, baseSkillActivations: 1, usageActivations: 0,
        newWordMeaningActivations: 0, totalSkillActivations: 1, plannedSeconds: 0, mode: "normal",
      },
      mandatorySelected: [],
      deferredMandatory: [],
      baseSkillSelected: [listeningItem],
      usageSelected: [],
      newWordsSelected: [],
      placementSelected: [],
      placementDeferred: 0,
      futureReservations: [],
      loadBreakdown: emptyLoadBreakdown(),
    };
    const completions = completePlannedSession(
      [listeningItem],
      PROFILES.steady,
      DEFAULT_SECONDS_BY_MODALITY,
      900,
      seededRandom(42),
      { now: NOW, resolveItem: () => word.listening },
    );

    applyCompletedSession(world, plan, completions, simulationContext(NOW, 42, { value: 0 }), "session-observe-only");

    const meaningEvents = world.srsEvents.filter((event) => event.learningItemId === word.meaning.id);
    expect(meaningEvents).toHaveLength(1);
  });

  it("dos siblings distintos (listening + production) completados en la MISMA sesión sólo generan UN srsEvent para meaning, no dos", () => {
    // Ninguno de los dos siblings es "meaning" en sí, así que el fix por
    // `directlyCompletedItemIds` no aplica aquí: ambos observan meaning como
    // efecto lateral. Si `word` se relee de `world.words` entre iteraciones
    // del loop de `applyCompletedSession`, la segunda observación parte del
    // resultingSchedule YA actualizado por la primera — doble aplicación de
    // FSRS a meaning en una sesión con dos calificaciones distintas.
    const world = createInitialWorld(options, PROFILES.steady);
    const word = [...world.words.values()][0];
    word.introducedAt = options.startAt;
    word.meaning.schedule = {
      kind: "fsrs", dueAt: "2026-09-05T00:00:00.000Z", stability: 10, difficulty: 5, state: "Review",
    };
    word.meaning.lastReview = "2026-08-10T00:00:00.000Z";
    // listening ya tiene FSRS y está due hoy (scheduled-review); production
    // sigue "none" (candidato de activación base) — mismo día, mismo mundo.
    word.listening.schedule = {
      kind: "fsrs", dueAt: NOW.toISOString(), stability: 8, difficulty: 5, state: "Review",
    };
    word.listening.lastReview = "2026-08-10T00:00:00.000Z";

    const listeningItem: PlannedItem = {
      itemId: word.listening.id, wordId: word.wordId, skill: "listening", modality: "listening", dueAt: NOW.toISOString(),
    };
    const productionItem: PlannedItem = {
      itemId: word.production.id, wordId: word.wordId, skill: "production", modality: "production", dueAt: "",
    };
    const plan: DailyPlan = {
      allowance: {
        newWords: 0, capacitySafeNewWords: 0, baseSkillActivations: 1, usageActivations: 0,
        newWordMeaningActivations: 0, totalSkillActivations: 1, plannedSeconds: 0, mode: "normal",
      },
      mandatorySelected: [listeningItem],
      deferredMandatory: [],
      baseSkillSelected: [productionItem],
      usageSelected: [],
      newWordsSelected: [],
      placementSelected: [],
      placementDeferred: 0,
      futureReservations: [],
      loadBreakdown: emptyLoadBreakdown(),
    };
    const completions = completePlannedSession(
      [listeningItem, productionItem],
      PROFILES.steady,
      DEFAULT_SECONDS_BY_MODALITY,
      900,
      seededRandom(42),
      {
        now: NOW,
        resolveItem: (item) => (item.itemId === word.listening.id ? word.listening : word.production),
      },
    );

    applyCompletedSession(world, plan, completions, simulationContext(NOW, 42, { value: 0 }), "session-two-siblings");

    const meaningEvents = world.srsEvents.filter((event) => event.learningItemId === word.meaning.id);
    expect(meaningEvents).toHaveLength(1);
  });
});
