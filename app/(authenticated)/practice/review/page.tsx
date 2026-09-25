import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { GuestBanner } from "@/components/layout/stats/GuestBanner";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import { ReviewHubClient } from "@/components/practice/review/ReviewHubClient";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import { getReviewHubSummary } from "@/lib/review/server-queries";

export const metadata = { title: "Tu repaso - Review Hub" };

export default async function PracticeReviewPage() {
  const user = await getSupabaseServerUser();

  const summary = user ? await getReviewHubSummary(user.id) : null;

  return (
    <PageLayout archetype="dashboard">
      <PageHeader
        kicker="SEGUIMIENTO"
        title="Tu repaso"
        subtitle="Qué toca hoy, cuándo vuelve cada cosa y qué ya tienes afianzado."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 text-xs font-semibold text-text-strong shadow-2xs transition-colors hover:bg-field"
            >
              Ordenar por retraso
            </button>
            <button
              type="button"
              className="rounded-full border border-border-subtle bg-surface px-3.5 py-1.5 text-xs font-semibold text-text-strong shadow-2xs transition-colors hover:bg-field"
            >
              Solo lo atrasado
            </button>
          </div>
        }
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
