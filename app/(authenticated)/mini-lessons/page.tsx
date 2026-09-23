import MiniLessonsBrowser from "@/components/mini-lessons/MiniLessonsBrowser";
import PageLayout from "@/components/layout/PageLayout";
import { getAllMiniLessons } from "@/lib/content/lessons";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import { getEffectiveLearnerLevelServer } from "@/lib/learner-level/server-queries";
import type { CefrLevelId } from "@/lib/courses/types";

export default async function MiniLessonsPage() {
  const [lessons, user] = await Promise.all([getAllMiniLessons(), getSupabaseServerUser()]);
  const learnerLevel: CefrLevelId | null = user
    ? ((await getEffectiveLearnerLevelServer(user.id)).level.toLowerCase() as CefrLevelId)
    : null;

  return (
    <PageLayout archetype="catalog">
      <MiniLessonsBrowser lessons={lessons} learnerLevel={learnerLevel} />
    </PageLayout>
  );
}
