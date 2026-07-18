import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const phonemeExerciseTypes = [
  [10, "speak_word"],
  [11, "identify"],
  [12, "ax_same_different"],
  [13, "odd_one_out"],
  [14, "abx"],
] as const;

function readMigrationSql() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => fs.readFileSync(path.join(migrationsDir, file), "utf8"))
    .join("\n");
}

describe("phoneme exercise type migrations", () => {
  it("seeds each canonical ID-to-slug pair exactly once", () => {
    const sql = readMigrationSql();

    for (const [id, slug] of phonemeExerciseTypes) {
      const pair = new RegExp(`\\(\\s*${id}\\s*,\\s*'${slug}'\\s*,`, "g");
      expect(sql.match(pair)).toHaveLength(1);
    }
  });
});
