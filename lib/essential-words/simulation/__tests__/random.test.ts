import { describe, expect, it } from "vitest";
import { seededRandom } from "../random";

describe("seededRandom", () => {
  it("misma semilla produce la misma secuencia", () => {
    const first = seededRandom(42);
    const second = seededRandom(42);

    expect(Array.from({ length: 20 }, () => first.next()))
      .toEqual(Array.from({ length: 20 }, () => second.next()));
  });

  it("semillas distintas divergen", () => {
    expect(seededRandom(1).next()).not.toBe(seededRandom(2).next());
  });

  it("integer es inclusivo y pick solo devuelve valores del conjunto", () => {
    const random = seededRandom(7);
    const integers = Array.from({ length: 200 }, () => random.integer(2, 4));
    const picks = Array.from({ length: 20 }, () => random.pick(["a", "b", "c"]));

    expect(new Set(integers)).toEqual(new Set([2, 3, 4]));
    expect(picks.every((value) => ["a", "b", "c"].includes(value))).toBe(true);
  });

  it("rechaza rangos, probabilidades y selecciones inválidas", () => {
    const random = seededRandom(1);

    expect(() => random.integer(2, 1)).toThrow("inclusive integer range");
    expect(() => random.chance(1.1)).toThrow("between 0 and 1");
    expect(() => random.pick([])).toThrow("pick requires values");
  });
});
