import { describe, expect, it } from "vitest";
import { searchCurriculum } from "../curriculumSearch";

describe("searchCurriculum", () => {
  it("returns empty array for empty or blank query", () => {
    expect(searchCurriculum("")).toEqual([]);
    expect(searchCurriculum("   ")).toEqual([]);
  });

  it("finds lessons by title or keyword ignoring case and diacritics", () => {
    const results = searchCurriculum("habitos");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toMatch(/hábitos|rutinas/i);
    expect(results[0].type).toBe("lesson");
    expect(results[0].href).toMatch(/\/courses\/study\/\d+\?level=/);
  });

  it("finds lessons for 'to be'", () => {
    const results = searchCurriculum("to be");
    expect(results.length).toBeGreaterThan(0);
    const tobeLesson = results.find((r) => r.title.toLowerCase().includes("to be"));
    expect(tobeLesson).toBeDefined();
  });

  it("finds real life scenarios", () => {
    const results = searchCurriculum("restaurante");
    expect(results.length).toBeGreaterThan(0);
    const scenario = results.find((r) => r.type === "scenario");
    expect(scenario).toBeDefined();
    expect(scenario?.title).toBe("En el restaurante");
  });

  it("respects the limit parameter", () => {
    const results = searchCurriculum("a", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});
