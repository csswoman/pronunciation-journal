import { describe, it, expect } from "vitest";
import { exerciseResultMarker } from "../chat/exercise-result-marker";

describe("exerciseResultMarker", () => {
  it("uses the singular for a one-exercise session", () => {
    expect(exerciseResultMarker({ correct: 1, total: 1 })).toBe(
      "Práctica completada · 1 de 1 ejercicio",
    );
  });

  it("uses the plural beyond one exercise", () => {
    expect(exerciseResultMarker({ correct: 2, total: 3 })).toBe(
      "Práctica completada · 2 de 3 ejercicios",
    );
  });
});
