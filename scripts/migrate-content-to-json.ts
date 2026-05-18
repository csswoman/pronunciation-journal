/**
 * One-off migration: converts the literal content arrays in
 * lib/lesson-content.ts and lib/mini-lessons.ts into one JSON file per slug
 * under public/lessons/ and public/mini-lessons/.
 *
 * Run once with:
 *   npx tsx scripts/migrate-content-to-json.ts
 *
 * Each item is validated against its Zod schema BEFORE anything is written.
 * If any item fails, the script aborts without touching the filesystem.
 *
 * After a successful run, lib/lesson-content.ts and lib/mini-lessons.ts are
 * deleted — this script is not expected to run again.
 */
import fs from "fs";
import path from "path";
import { z } from "zod";
import { miniLessons } from "../lib/mini-lessons";
import { lessonContent } from "../lib/lesson-content";
import { LessonContentSchema, MiniLessonSchema } from "../lib/content/schemas";

const ROOT = process.cwd();
const LESSONS_DIR = path.join(ROOT, "public", "lessons");
const MINI_LESSONS_DIR = path.join(ROOT, "public", "mini-lessons");

function migrate<T extends { slug: string }>(
  label: string,
  dir: string,
  items: T[],
  schema: z.ZodType<T>,
): number {
  // Validate everything first — abort before writing if anything is invalid.
  for (const item of items) {
    const result = schema.safeParse(item);
    if (!result.success) {
      console.error(`✗ ${label} "${item.slug}" failed Zod validation:`);
      console.error(z.prettifyError(result.error));
      process.exit(1);
    }
  }

  fs.mkdirSync(dir, { recursive: true });
  for (const item of items) {
    const file = path.join(dir, `${item.slug}.json`);
    fs.writeFileSync(file, JSON.stringify(item, null, 2) + "\n", "utf-8");
  }
  console.log(`✓ ${label}: wrote ${items.length} files → ${path.relative(ROOT, dir)}/`);
  return items.length;
}

function main() {
  console.log("Migrating authored content to JSON…\n");

  const mini = migrate("mini-lessons", MINI_LESSONS_DIR, miniLessons, MiniLessonSchema);
  const lessons = migrate("lessons", LESSONS_DIR, lessonContent, LessonContentSchema);

  // Sanity check: every mini-lesson should have matching lesson content.
  const lessonSlugs = new Set(lessonContent.map((l) => l.slug));
  const orphans = miniLessons.filter((m) => !lessonSlugs.has(m.slug)).map((m) => m.slug);
  if (orphans.length > 0) {
    console.warn(`\n⚠ mini-lessons without matching lesson content: ${orphans.join(", ")}`);
  }

  console.log(`\nDone. ${mini} mini-lessons + ${lessons} lessons migrated.`);
}

main();
