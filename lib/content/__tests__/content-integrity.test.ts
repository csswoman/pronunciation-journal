// Guards the authored-content invariants that broke silently in the past:
// mini-lesson/lesson slug drift (9 detail pages 404'd), exercises shipped
// without answer keys, and grammar decks orphaned from the course path.

import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";

const ROOT = process.cwd();
const LESSONS_DIR = path.join(ROOT, "public", "lessons");
const MINI_LESSONS_DIR = path.join(ROOT, "public", "mini-lessons");
const GRAMMAR_DECKS_DIR = path.join(ROOT, "public", "grammar-decks");

function jsonSlugs(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => path.basename(f, ".json"));
}

function readJson(dir: string, slug: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), "utf-8"));
}

describe("mini-lessons ⇄ lessons", () => {
  const miniSlugs = jsonSlugs(MINI_LESSONS_DIR);
  const lessonSlugs = jsonSlugs(LESSONS_DIR);

  it("every mini-lesson has a full lesson under the same slug", () => {
    const missing = miniSlugs.filter((s) => !lessonSlugs.includes(s));
    expect(missing).toEqual([]);
  });

  it("every full lesson is reachable from a mini-lesson", () => {
    const orphaned = lessonSlugs.filter((s) => !miniSlugs.includes(s));
    expect(orphaned).toEqual([]);
  });

  it("lesson JSON internal slug matches its filename", () => {
    const drifted = lessonSlugs.filter((s) => readJson(LESSONS_DIR, s).slug !== s);
    expect(drifted).toEqual([]);
  });

  it("mini-lesson hrefs point to their own detail route", () => {
    const wrong = miniSlugs.filter(
      (s) => readJson(MINI_LESSONS_DIR, s).href !== `/mini-lessons/${s}`,
    );
    expect(wrong).toEqual([]);
  });
});

describe("lesson exercises", () => {
  it("every exercise has one answer per item", () => {
    const bad: string[] = [];
    for (const slug of jsonSlugs(LESSONS_DIR)) {
      const lesson = readJson(LESSONS_DIR, slug) as {
        exercises: Array<{ items: string[]; answers?: string[] }>;
      };
      lesson.exercises.forEach((exercise, i) => {
        if (!exercise.answers || exercise.answers.length !== exercise.items.length) {
          bad.push(`${slug}[${i}]`);
        }
      });
    }
    expect(bad).toEqual([]);
  });
});

describe("course path ⇄ grammar decks", () => {
  const deckSlugs = jsonSlugs(GRAMMAR_DECKS_DIR);
  const curriculumSlugs = [
    ...COURSE_PATH_CURRICULUM.levels,
    ...COURSE_PATH_CURRICULUM.electiveTracks,
  ].flatMap((level) =>
    level.units.flatMap((unit) =>
      unit.lessons.flatMap((lesson) => (lesson.slug ? [lesson.slug] : [])),
    ),
  );

  it("every curriculum lesson slug has a grammar deck file", () => {
    const missing = curriculumSlugs.filter((s) => !deckSlugs.includes(s));
    expect(missing).toEqual([]);
  });

  it("every grammar deck is referenced by the curriculum", () => {
    const orphaned = deckSlugs.filter((s) => !curriculumSlugs.includes(s));
    expect(orphaned).toEqual([]);
  });
});
