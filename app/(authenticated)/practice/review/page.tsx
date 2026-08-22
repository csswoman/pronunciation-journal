import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { GuestBanner } from "@/components/layout/stats/GuestBanner";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import { ReviewHubClient } from "@/components/practice/review/ReviewHubClient";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import { getReviewHubSummary } from "@/lib/review/server-queries";

export const metadata = { title: "Review Hub" };

export default async function PracticeReviewPage() {
  const user = await getSupabaseServerUser();

  const summary = user ? await getReviewHubSummary(user.id) : null;

  return (
    <PageLayout archetype="dashboard">
      <PageHeader
        kicker="Seguimiento"
        title="Review"
        subtitle="Oraciones fallidas, palabras débiles, SRS de vocabulario y sonidos pendientes — en un solo lugar."
      />

      {!user || !summary ? (
        <GuestBanner />
      ) : (
        <div className="flex flex-col gap-4">
          {isAnonymousUser(user) ? (
            <GuestSaveProgressBanner variant="emphasized" />
          ) : null}
          <ReviewHubClient summary={summary} />
        </div>
      )}
    </PageLayout>
  );
}
