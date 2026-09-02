import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { MiniLessonSchema, LessonContentSchema } from "../schemas";

describe("Listening and Weak Forms content validation", () => {
  const miniLessonPath = path.join(
    process.cwd(),
    "public",
    "mini-lessons",
    "better-listening-weak-forms.json"
  );
  const fullLessonPath = path.join(
    process.cwd(),
    "public",
    "lessons",
    "better-listening-weak-forms.json"
  );

  it("validates better-listening-weak-forms mini-lesson schema", () => {
    expect(fs.existsSync(miniLessonPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(miniLessonPath, "utf-8"));
    const result = MiniLessonSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("better-listening-weak-forms");
      expect(result.data.category).toBe("listening");
      expect(result.data.id).toBe(66);
    }
  });

  it("validates better-listening-weak-forms full lesson schema", () => {
    expect(fs.existsSync(fullLessonPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(fullLessonPath, "utf-8"));
    const result = LessonContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe("better-listening-weak-forms");
      expect(result.data.sections.length).toBeGreaterThanOrEqual(5);
      expect(result.data.examples.length).toBeGreaterThanOrEqual(4);
      expect(result.data.quiz.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("validates enriched basic-listening-reductions lesson schema", () => {
    const p = path.join(process.cwd(), "public", "lessons", "basic-listening-reductions.json");
    const content = JSON.parse(fs.readFileSync(p, "utf-8"));
    const result = LessonContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it("validates enriched sentence-stress lesson schema", () => {
    const p = path.join(process.cwd(), "public", "lessons", "sentence-stress.json");
    const content = JSON.parse(fs.readFileSync(p, "utf-8"));
    const result = LessonContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });
});
