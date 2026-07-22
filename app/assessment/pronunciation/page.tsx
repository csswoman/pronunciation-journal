import { getSupabaseServerUser } from "@/lib/supabase/session";
import { PronunciationAssessmentClient } from "@/components/pronunciation-assessment/PronunciationAssessmentClient";

/**
 * Server shell for the pronunciation diagnostic (plan 067, step 7). Mirrors
 * `app/assessment/page.tsx`'s guest-access policy: an unauthenticated user
 * may still take the diagnostic, so `userId` is allowed to be undefined.
 */
export default async function PronunciationAssessmentPage() {
  const user = await getSupabaseServerUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <PronunciationAssessmentClient userId={user?.id} />
    </main>
  );
}
