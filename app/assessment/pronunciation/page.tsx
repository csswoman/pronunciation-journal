import PageLayout from "@/components/layout/PageLayout";
import { PronunciationAssessmentClient } from "@/components/pronunciation-assessment/PronunciationAssessmentClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServerUser } from "@/lib/supabase/session";

/**
 * Server shell for the pronunciation diagnostic (plan 067, step 7). Mirrors
 * `app/assessment/page.tsx`'s guest-access policy: an unauthenticated user
 * may still take the diagnostic, so `userId` is allowed to be undefined.
 * Stage chrome lives in the client so the header can match preflight/prompts/results.
 */
export default async function PronunciationAssessmentPage() {
  const user = isSupabaseConfigured() ? await getSupabaseServerUser() : null;

  return (
    <PageLayout archetype="session">
      <PronunciationAssessmentClient userId={user?.id} />
    </PageLayout>
  );
}
