import { describe, expect, it } from "vitest";
import {
  answerCorrectly,
  buildPracticeCalendar,
  PROFILES,
} from "../profiles";
import { seededRandom } from "../random";

describe("perfiles de simulación", () => {
  it("steady practica todos los días", () => {
    expect(buildPracticeCalendar(PROFILES.steady, 60, seededRandom(42)))
      .toEqual(Array.from({ length: 60 }, () => true));
  });

  it("intermittent produce días activos e inactivos de forma reproducible", () => {
    const first = buildPracticeCalendar(PROFILES.intermittent, 90, seededRandom(42));
    const second = buildPracticeCalendar(PROFILES.intermittent, 90, seededRandom(42));

    expect(first).toEqual(second);
    expect(first).toContain(true);
    expect(first).toContain(false);
  });

  it("bursty contiene una ausencia continua de al menos diez días", () => {
    const calendar = buildPracticeCalendar(PROFILES.bursty, 42, seededRandom(42));
    const longestIdleRun = calendar.reduce(
      (state, active) => active
        ? { current: 0, longest: state.longest }
        : {
            current: state.current + 1,
            longest: Math.max(state.longest, state.current + 1),
          },
      { current: 0, longest: 0 },
    ).longest;

    expect(longestIdleRun).toBeGreaterThanOrEqual(10);
  });

  it("beginner tiene menor precisión de producción que de reconocimiento", () => {
    expect(PROFILES.beginner.accuracyByModality.production)
      .toBeLessThan(PROFILES.beginner.accuracyByModality.recognition);
  });

  it("advanced habilita colocación con confianza alta", () => {
    expect(PROFILES.advanced.placementConfidence).toBe("high");
  });

  it("misma semilla reproduce calendario y respuestas", () => {
    const run = () => {
      const random = seededRandom(99);
      return {
        calendar: buildPracticeCalendar(PROFILES.advanced, 30, random),
        answers: Array.from({ length: 30 }, () => (
          answerCorrectly(PROFILES.advanced, "production", random)
        )),
      };
    };

    expect(run()).toEqual(run());
  });
});
