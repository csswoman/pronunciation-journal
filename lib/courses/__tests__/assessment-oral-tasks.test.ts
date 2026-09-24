import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findAssessmentOralTask, getAssessmentOralTasks, scoreAssessmentOralTranscript } from "../assessment-oral-tasks";

describe("assessment oral pilot tasks", () => {
  it("accepts both required A1 facts and rejects altered or incomplete details", () => {
    const task = getAssessmentOralTasks("a1").find((item) => item.id === "a1-home-lima-park");
    expect(task).toBeDefined();
    if (!task) return;

    expect(scoreAssessmentOralTranscript(task.id, "Ana lives in Lima. There's a park near her home."))
      .toBe(true);
    expect(scoreAssessmentOralTranscript(task.id, "Ana lives in Quito. There is a park near her home."))
      .toBe(false);
    expect(scoreAssessmentOralTranscript(task.id, "Ana lives in Lima. The park is near her home."))
      .toBe(false);
  });

  it("requires the A2 day, future plan, activity, and added detail", () => {
    const task = findAssessmentOralTask("a2-saturday-museum");
    expect(task).toBeDefined();
    if (!task) return;

    expect(scoreAssessmentOralTranscript(
      task.id,
      "On Saturday, Alex is going to visit the museum and see the new exhibition.",
    )).toBe(true);
    expect(scoreAssessmentOralTranscript(
      task.id,
      "On Saturday, Alex will visit the museum and see the new exhibition.",
    )).toBe(true);
    expect(scoreAssessmentOralTranscript(
      task.id,
      "On Saturday, Alex visits the museum and sees the new exhibition.",
    )).toBe(false);
    expect(scoreAssessmentOralTranscript(task.id, "Alex is going to visit the museum on Saturday."))
      .toBe(false);
  });

  it("does not score an unknown task id", () => {
    expect(findAssessmentOralTask("a2-saturday-invented")).toBeNull();
    expect(scoreAssessmentOralTranscript("a2-saturday-invented", "I will speak on Saturday."))
      .toBe(false);
  });
});
