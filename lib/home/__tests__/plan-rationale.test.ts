import { describe, it, expect } from "vitest";
import { derivePlanRationale } from "@/lib/home/plan-rationale";
import type { WeakestPhonemeHome } from "@/lib/home/constants";

const weak: WeakestPhonemeHome = {
  ipa: "/iː/",
  accuracy: 40,
  totalAttempts: 20,
  correctAnswers: 8,
  confusableIpa: "/ɪ/",
  label: "long e",
};

describe("derivePlanRationale", () => {
  it("leads with calibration for new learners", () => {
    const r = derivePlanRationale({
      reviewDue: false,
      isNewLearner: true,
      conceptLesson: { title: "Vocales largas" },
      weakestPhoneme: null,
    });
    expect(r?.headline).toMatch(/calibrando/i);
    expect(r?.detail).toContain("Vocales largas");
  });

  it("prioritizes due reviews over the weak sound", () => {
    const r = derivePlanRationale({
      reviewDue: true,
      isNewLearner: false,
      conceptLesson: null,
      weakestPhoneme: weak,
    });
    expect(r?.headline).toMatch(/repaso/i);
    expect(r?.detail).toContain("/iː/");
    expect(r?.detail).toContain("/ɪ/");
  });

  it("frames the plan around the weakest sound when nothing is due", () => {
    const r = derivePlanRationale({
      reviewDue: false,
      isNewLearner: false,
      conceptLesson: { title: "Ritmo" },
      weakestPhoneme: weak,
    });
    expect(r?.headline).toContain("/iː/");
    expect(r?.detail).toContain("Ritmo");
  });

  it("falls back to the concept lesson", () => {
    const r = derivePlanRationale({
      reviewDue: false,
      isNewLearner: false,
      conceptLesson: { title: "Entonación" },
      weakestPhoneme: null,
    });
    expect(r?.headline).toContain("Entonación");
    expect(r?.detail).toBe("");
  });

  it("returns null when there is nothing to explain", () => {
    expect(
      derivePlanRationale({
        reviewDue: false,
        isNewLearner: false,
        conceptLesson: null,
        weakestPhoneme: null,
      }),
    ).toBeNull();
  });
});
