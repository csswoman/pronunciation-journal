import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { PronunciationAssessmentClient } from "@/components/pronunciation-assessment/PronunciationAssessmentClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServerUser } from "@/lib/supabase/session";

/**
 * Server shell for the pronunciation diagnostic (plan 067, step 7). Mirrors
 * `app/assessment/page.tsx`'s guest-access policy: an unauthenticated user
 * may still take the diagnostic, so `userId` is allowed to be undefined.
 */
export default async function PronunciationAssessmentPage() {
  const user = isSupabaseConfigured() ? await getSupabaseServerUser() : null;

  return (
    <PageLayout>
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 pb-[max(0px,env(safe-area-inset-bottom))]">
        <PageHeader
          variant="compact"
          kicker="Diagnóstico"
          title="Pronunciación"
          subtitle="Unas preguntas cortas para ubicar qué practicar primero."
        />
        <PronunciationAssessmentClient userId={user?.id} />
      </div>
    </PageLayout>
  );
}
