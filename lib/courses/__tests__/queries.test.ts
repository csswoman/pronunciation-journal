// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from }),
}));

import { db, lessonCompletionKey } from "@/lib/db";
import { hydrateLessonCompletions } from "../queries";

describe("hydrateLessonCompletions", () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
    from.mockReset();
  });

  afterEach(() => db.close());

  it("reconciles remote removals, preserves pending changes, and drops unscoped legacy rows", async () => {
    const pendingKey = lessonCompletionKey("user-1", "a1", "lesson-1");
    await db.completedLessons.add({
      key: pendingKey,
      userId: "user-1",
      courseSlug: "a1",
      lessonSlug: "lesson-1",
      completedAt: "2026-07-20T01:00:00.000Z",
      source: "lesson_completion",
      updatedAt: "2026-07-20T01:00:00.000Z",
    });
    await db.syncOutbox.add({
      table: "lesson_completions",
      operation: "upsert",
      userId: "user-1",
      payload: { user_id: "user-1", course_slug: "a1", lesson_slug: "lesson-1" },
      status: "pending",
      createdAt: "2026-07-20T01:00:00.000Z",
      retryCount: 0,
    });
    await db.completedLessons.add({
      key: lessonCompletionKey("user-1", "a1", "removed-lesson"),
      userId: "user-1",
      courseSlug: "a1",
      lessonSlug: "removed-lesson",
      completedAt: "2026-07-20T01:00:00.000Z",
      updatedAt: "2026-07-20T01:00:00.000Z",
    });
    await db.completedLessons.add({
      key: "a1:legacy-lesson",
      userId: undefined as unknown as string,
      courseSlug: "a1",
      lessonSlug: "legacy-lesson",
      completedAt: "2026-07-20T01:00:00.000Z",
      updatedAt: "2026-07-20T01:00:00.000Z",
    });

    from.mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({
          data: [
            {
              user_id: "user-1",
              course_slug: "a1",
              lesson_slug: "lesson-1",
              completed_at: "2026-07-20T02:00:00.000Z",
              source: "remote",
              updated_at: "2026-07-20T02:00:00.000Z",
            },
            {
              user_id: "user-1",
              course_slug: "a2",
              lesson_slug: "lesson-2",
              completed_at: "2026-07-20T02:00:00.000Z",
              source: "remote",
              updated_at: "2026-07-20T02:00:00.000Z",
            },
          ],
          error: null,
        }),
      }),
    });

    await hydrateLessonCompletions("user-1");

    expect((await db.completedLessons.get(pendingKey))?.completedAt).toBe("2026-07-20T01:00:00.000Z");
    expect(await db.completedLessons.get(lessonCompletionKey("user-1", "a2", "lesson-2"))).toMatchObject({
      userId: "user-1",
      courseSlug: "a2",
      lessonSlug: "lesson-2",
    });
    expect(await db.completedLessons.get(lessonCompletionKey("user-1", "a1", "removed-lesson"))).toBeUndefined();
    expect(await db.completedLessons.get("a1:legacy-lesson")).toBeUndefined();
  });
});
