import { describe, expect, it } from "vitest";
import { COURSE_PATH_CURRICULUM } from "../curriculum";
import { patternsForLevel, uniqueDeckSlugsForLevel } from "../grammar-patterns";
import { essentialDeckSlugs } from "../level-curriculum-order";

function coreSlugs(level: "a1" | "a2" | "b1" | "b2" | "c1"): string[] {
  const entry = COURSE_PATH_CURRICULUM.levels.find((l) => l.id === level);
  return (
    entry?.units
      .filter((u) => !u.isOptionalSection)
      .flatMap((u) => u.lessons.map((lesson) => lesson.slug).filter(Boolean) as string[]) ?? []
  );
}

describe("A1–C1 curriculum order", () => {
  it.each(["a1", "a2", "b1", "b2", "c1"] as const)(
    "keeps essential %s decks in pedagogical pattern order",
    (level) => {
      const ordered = essentialDeckSlugs(level);
      const patternSlugs = uniqueDeckSlugsForLevel(level);
      let lastIndex = -1;
      for (const slug of patternSlugs) {
        const index = ordered.indexOf(slug);
        expect(index, `${slug} missing from ${level} essential path`).toBeGreaterThanOrEqual(0);
        expect(index, `${slug} out of pattern order in ${level}`).toBeGreaterThan(lastIndex);
        lastIndex = index;
      }
    },
  );

  it("starts A1 with onboarding before pronombres sujeto", () => {
    const slugs = coreSlugs("a1");
    expect(slugs.indexOf("a1-estrategias-aprender-ingles")).toBe(0);
    expect(slugs.indexOf("a1-ingles-principiantes")).toBe(1);
    expect(slugs.indexOf("a1-pronombres-sujeto")).toBe(2);
  });

  it("places A1 sentence parts after possessives and before present simple", () => {
    const slugs = coreSlugs("a1");
    expect(slugs.indexOf("a1-construccion-oraciones")).toBeGreaterThan(slugs.indexOf("a1-posesivos"));
    expect(slugs.indexOf("a1-presente-simple")).toBeGreaterThan(slugs.indexOf("a1-construccion-oraciones"));
  });

  it("starts A2 with pasado to be before past simple deck", () => {
    const slugs = coreSlugs("a2");
    expect(slugs.indexOf("a2-pasado-to-be")).toBe(0);
    expect(slugs.indexOf("a2-experiencias-pasadas-planes")).toBe(1);
  });

  it("covers every authored pattern deck slug in the essential path", () => {
    for (const level of ["a1", "a2", "b1", "b2", "c1"] as const) {
      const patternDecks = new Set(uniqueDeckSlugsForLevel(level));
      const essential = new Set(coreSlugs(level));
      for (const slug of patternDecks) {
        expect(essential.has(slug), `${level} missing ${slug}`).toBe(true);
      }
    }
  });

  it("lists pattern titles per level in grammar-patterns registry", () => {
    expect(patternsForLevel("a1")).toHaveLength(28);
    expect(patternsForLevel("a2")).toHaveLength(28);
    expect(patternsForLevel("b1")).toHaveLength(29);
    expect(patternsForLevel("b2")).toHaveLength(25);
    expect(patternsForLevel("c1")).toHaveLength(28);
  });

  it("starts B1 with articulos superlativos before comparativos", () => {
    const slugs = coreSlugs("b1");
    expect(slugs.indexOf("b1-articulos-superlativos-cero")).toBe(0);
    expect(slugs.indexOf("b1-modificadores-comparativos")).toBe(1);
  });

  it("starts B2 with conversational prefix before pattern spine", () => {
    const slugs = coreSlugs("b2");
    expect(slugs.indexOf("b2-ingles-practico-conversacional")).toBe(0);
    expect(slugs.indexOf("b2-conectores-avanzados")).toBeGreaterThan(
      slugs.indexOf("b2-pasado-perfecto-frases-adverbiales"),
    );
  });

  it("starts C1 with cohesion before comparativos dobles", () => {
    const slugs = coreSlugs("c1");
    expect(slugs.indexOf("c1-cohesion-discurso")).toBe(0);
    expect(slugs.indexOf("c1-comparativos-dobles")).toBe(1);
  });

  it.each(["a1", "a2", "b1", "b2", "c1"] as const)(
    "gives every %s lesson a thematic reading group",
    (level) => {
      const entry = COURSE_PATH_CURRICULUM.levels.find((item) => item.id === level);
      const lessons = entry?.units.flatMap((unit) => unit.lessons) ?? [];

      expect(lessons.every((lesson) => Boolean(lesson.group))).toBe(true);
      expect(new Set(lessons.map((lesson) => lesson.group)).size).toBeGreaterThan(1);
    },
  );

});
