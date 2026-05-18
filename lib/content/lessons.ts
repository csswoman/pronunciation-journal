// Server-side loaders for authored static content.
//
// Content lives as one JSON file per slug under public/lessons/ and
// public/mini-lessons/ — outside the JS module graph. These loaders read
// from disk and validate with Zod.
//
// Note: loading is filesystem-based (not HTTP `fetch`) because these run in
// Server Components and during `generateStaticParams` at build time, where no
// HTTP server is available. This mirrors lib/lexicon/categories.ts. Behaviour
// still matches the brief: Zod fails loudly in dev, logs + falls back in prod.
//
// The `fs` import makes this module server-only by construction — importing it
// from a Client Component fails at build time (same as lib/lexicon).

import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  LessonContentSchema,
  MiniLessonSchema,
  type LessonContent,
  type MiniLesson,
} from "./schemas";

const LESSONS_DIR = path.join(process.cwd(), "public", "lessons");
const MINI_LESSONS_DIR = path.join(process.cwd(), "public", "mini-lessons");

function readJson(dir: string, slug: string): unknown | null {
  const filePath = path.join(dir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function listSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => path.basename(f, ".json"));
}

/**
 * Validates `data` against `schema`. In dev, a validation failure throws
 * loudly so bad content is caught immediately. In prod, it is logged and
 * `null` is returned so the app degrades gracefully instead of crashing.
 */
function validate<T>(schema: z.ZodType<T>, data: unknown, label: string): T | null {
  if (data === null) return null;

  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const message = `[content] Zod validation failed for ${label}:\n${z.prettifyError(result.error)}`;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(message);
  }
  console.error(message);
  return null;
}

/** Full lesson detail (sections, examples, exercises, quiz) for a slug. */
export async function getLessonBySlug(slug: string): Promise<LessonContent | null> {
  return validate(LessonContentSchema, readJson(LESSONS_DIR, slug), `lesson "${slug}"`);
}

/** Mini-lesson card metadata + short body for a slug. */
export async function getMiniLessonBySlug(slug: string): Promise<MiniLesson | null> {
  return validate(MiniLessonSchema, readJson(MINI_LESSONS_DIR, slug), `mini-lesson "${slug}"`);
}

/** Every lesson slug — for `generateStaticParams` and listings. */
export async function getAllLessonSlugs(): Promise<string[]> {
  return listSlugs(MINI_LESSONS_DIR);
}

/** All mini-lessons, ordered by `id` (basic → advanced). */
export async function getAllMiniLessons(): Promise<MiniLesson[]> {
  const lessons = listSlugs(MINI_LESSONS_DIR)
    .map((slug) => validate(MiniLessonSchema, readJson(MINI_LESSONS_DIR, slug), `mini-lesson "${slug}"`))
    .filter((l): l is MiniLesson => l !== null);

  return lessons.sort((a, b) => a.id - b.id);
}

/** The mini-lesson for today, rotated by day of year. */
export async function getTodaysMiniLesson(): Promise<MiniLesson | null> {
  const lessons = await getAllMiniLessons();
  if (lessons.length === 0) return null;

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const index = ((dayOfYear - 1) % lessons.length + lessons.length) % lessons.length;
  return lessons[index];
}
