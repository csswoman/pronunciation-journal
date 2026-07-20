import { db, lessonCompletionKey, type CompletedCourseLesson } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RemoteLessonCompletion = {
  user_id: string;
  course_slug: string;
  lesson_slug: string;
  completed_at: string;
  source: string | null;
  updated_at: string;
};

function toLocalRow(row: RemoteLessonCompletion): CompletedCourseLesson {
  return {
    key: lessonCompletionKey(row.user_id, row.course_slug, row.lesson_slug),
    userId: row.user_id,
    courseSlug: row.course_slug,
    lessonSlug: row.lesson_slug,
    completedAt: row.completed_at,
    source: row.source ?? "remote",
    updatedAt: row.updated_at,
  };
}

/** Refreshes the user-scoped completion mirror without clobbering pending local changes. */
export async function hydrateLessonCompletions(userId: string): Promise<void> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("lesson_completions")
    .select("user_id, course_slug, lesson_slug, completed_at, source, updated_at")
    .eq("user_id", userId);

  if (error) throw error;

  const pendingRows = (await db.syncOutbox.toArray())
    .filter((entry) => entry.table === "lesson_completions");
  const pendingKeys = new Set(
    pendingRows.map((entry) => {
      const payload = entry.payload;
      const match = entry.matchKey;
      const courseSlug = (payload.course_slug ?? match?.course_slug) as string | undefined;
      const lessonSlug = (payload.lesson_slug ?? match?.lesson_slug) as string | undefined;
      const pendingUserId = (payload.user_id ?? match?.user_id) as string | undefined;
      return pendingUserId && courseSlug && lessonSlug
        ? lessonCompletionKey(pendingUserId, courseSlug, lessonSlug)
        : null;
    }).filter((key): key is string => Boolean(key)),
  );

  const rows = ((data ?? []) as RemoteLessonCompletion[])
    .map(toLocalRow)
    .filter((row) => !pendingKeys.has(row.key));

  const remoteKeys = new Set(rows.map((row) => row.key));
  await db.transaction("rw", db.completedLessons, async () => {
    const localRows = await db.completedLessons.toArray();
    const staleKeys = localRows
      .filter((row) => {
        // Records from the pre-user schema cannot be attributed safely. Once a
        // user has authenticated, discard them instead of leaking progress.
        if (!row.userId) return true;
        return row.userId === userId && !pendingKeys.has(row.key) && !remoteKeys.has(row.key);
      })
      .map((row) => row.key);

    if (staleKeys.length > 0) await db.completedLessons.bulkDelete(staleKeys);
    if (rows.length > 0) await db.completedLessons.bulkPut(rows);
  });
}
