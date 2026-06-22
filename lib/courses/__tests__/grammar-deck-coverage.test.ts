import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GrammarStudyDeckSchema } from "@/lib/courses/grammar-deck/schema";
import { COURSE_PATH_CURRICULUM } from "../curriculum";

const decksDir = path.join(process.cwd(), "public", "grammar-decks");

describe("essential curriculum deck coverage", () => {
  const essentialLessons = COURSE_PATH_CURRICULUM.levels.flatMap((level) =>
    level.units
      .filter((unit) => !unit.isOptionalSection)
      .flatMap((unit) => unit.lessons)
      .filter((lesson) => lesson.slug),
  );

  it.each(essentialLessons)("$id has a valid authored deck", (lesson) => {
    const filePath = path.join(decksDir, `${lesson.slug}.json`);

    expect(fs.existsSync(filePath), `${lesson.title} uses the fallback deck`).toBe(true);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    expect(GrammarStudyDeckSchema.safeParse(raw).success, `${lesson.title} has an invalid deck`).toBe(true);
  });
});
