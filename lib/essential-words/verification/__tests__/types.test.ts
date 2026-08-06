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
