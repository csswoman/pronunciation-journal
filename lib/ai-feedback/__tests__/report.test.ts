import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportWrongFeedback } from "../report";
import { db } from "@/lib/db";
import { enqueue } from "@/lib/sync/sync-manager";
import { retractPracticeErrorRecurrence } from "@/lib/practice/error-recurrence-sync";

vi.mock("@/lib/db", () => ({
  db: {
    aiFeedbackReports: {
      put: vi.fn().mockResolvedValue(undefined),
    },
    learningState: {},
    syncOutbox: {},
    transaction: vi.fn(
      async (_mode: string, _tables: unknown[], callback: () => Promise<unknown>) => callback(),
    ),
  },
}));

vi.mock("@/lib/sync/sync-manager", () => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/practice/error-recurrence-sync", () => ({
  retractPracticeErrorRecurrence: vi.fn().mockResolvedValue(undefined),
}));

describe("reportWrongFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves report to Dexie, enqueues insert in outbox, and retracts pattern for coach_correction", async () => {
    const result = await reportWrongFeedback({
      userId: "user-1",
      feature: "coach_correction",
      input: { text: "I have go there yesterday" },
      output: { corrected: "I went there yesterday", rule: "Past simple" },
      errorPattern: "tense_present_for_past",
      comment: "  Actually I wanted to say something else  ",
    });

    expect(db.aiFeedbackReports.put).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        feature: "coach_correction",
        errorPattern: "tense_present_for_past",
        comment: "Actually I wanted to say something else",
      }),
    );

    expect(enqueue).toHaveBeenCalledWith(
      "user-1",
      "ai_feedback_reports",
      "insert",
      expect.objectContaining({
        user_id: "user-1",
        feature: "coach_correction",
        error_pattern: "tense_present_for_past",
        comment: "Actually I wanted to say something else",
      }),
      expect.objectContaining({ id: result.id }),
    );

    expect(retractPracticeErrorRecurrence).toHaveBeenCalledWith(
      "user-1",
      "tense_present_for_past",
      expect.any(Number),
    );
    expect(db.transaction).toHaveBeenCalledWith(
      "rw",
      expect.arrayContaining([db.aiFeedbackReports, db.learningState, db.syncOutbox]),
      expect.any(Function),
    );
  });

  it("retracts error pattern for production_grade", async () => {
    await reportWrongFeedback({
      userId: "user-2",
      feature: "production_grade",
      input: "He go home",
      output: { correct: false },
      errorPattern: "subject_verb_agreement",
    });

    expect(retractPracticeErrorRecurrence).toHaveBeenCalledWith(
      "user-2",
      "subject_verb_agreement",
      expect.any(Number),
    );
  });

  it("does NOT retract error pattern for journal_correction", async () => {
    await reportWrongFeedback({
      userId: "user-3",
      feature: "journal_correction",
      input: { entry: "My day was good" },
      output: { errors: [] },
      errorPattern: "article_use",
    });

    expect(db.aiFeedbackReports.put).toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalled();
    expect(retractPracticeErrorRecurrence).not.toHaveBeenCalled();
  });

  it("truncates input snapshots exceeding 2000 characters", async () => {
    const hugeInput = "a".repeat(3000);
    const result = await reportWrongFeedback({
      userId: "user-4",
      feature: "coach_correction",
      input: hugeInput,
      output: "short output",
    });

    expect(typeof result.inputSnapshot).toBe("string");
    expect((result.inputSnapshot as string).length).toBe(2000);
  });

  it("truncates comments exceeding 300 characters", async () => {
    const hugeComment = "c".repeat(400);
    const result = await reportWrongFeedback({
      userId: "user-5",
      feature: "coach_correction",
      input: "test",
      output: "test",
      comment: hugeComment,
    });

    expect(result.comment?.length).toBe(300);
  });

  it("rejects guest identities before writing local or outbox data", async () => {
    await expect(
      reportWrongFeedback({
        userId: "guest",
        feature: "coach_correction",
        input: "I has a question",
        output: "I have a question",
      }),
    ).rejects.toThrow(/authenticated user/i);

    expect(db.transaction).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });
});
