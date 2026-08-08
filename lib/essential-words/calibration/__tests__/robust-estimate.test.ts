import { describe, expect, it } from "vitest";
import {
  filterMadOutliers,
  median,
  percentile,
} from "../robust-estimate";

describe("robust-estimate", () => {
  it("mediana de array vacío es undefined", () => {
    expect(median([])).toBeUndefined();
  });

  it("mediana de una sola muestra es esa muestra", () => {
    expect(median([42])).toBe(42);
  });

  it("mediana con todos iguales", () => {
    expect(median([5, 5, 5, 5])).toBe(5);
  });

  it("mediana par e impar", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("percentile p75 definido", () => {
    expect(percentile([1, 2, 3, 4], 75)).toBe(3.25);
    expect(percentile([], 75)).toBeUndefined();
  });

  it("N: outlier extremo no desplaza drásticamente tras MAD", () => {
    const values = [10, 11, 12, 10, 11, 12, 10, 11, 12, 1_000_000];
    const filtered = filterMadOutliers(values, 3);
    expect(filtered).not.toContain(1_000_000);
    expect(median(filtered)).toBe(11);
  });

  it("MAD = 0 conserva todos los valores", () => {
    expect(filterMadOutliers([7, 7, 7], 3)).toEqual([7, 7, 7]);
  });

  it("rechaza NaN e Infinity", () => {
    expect(filterMadOutliers([1, Number.NaN, 2, Number.POSITIVE_INFINITY], 3))
      .toEqual([1, 2]);
  });
});
