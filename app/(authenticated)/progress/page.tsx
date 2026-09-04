import Link from "next/link";
import { getSupabaseServerUser } from "@/lib/supabase/session";
import { getProgressPageData } from "@/lib/progress/queries";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { GuestBanner } from "@/components/layout/stats/GuestBanner";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import { StreakCard } from "@/components/progress/StreakCard";
import { DailyCompletionRate } from "@/components/progress/DailyCompletionRate";
import { AccuracyTrend } from "@/components/progress/AccuracyTrend";
import { FluencyRadarCard } from "@/components/progress/FluencyRadarCard";
import { CanSayNowCard } from "@/components/progress/CanSayNowCard";
import { SkillProfileCard } from "@/components/progress/SkillProfileCard";
import { ThisWeekCard } from "@/components/progress/ThisWeekCard";
import { ActivityHistoryCard } from "@/components/progress/ActivityHistoryCard";
import { ProgressProjectionCards } from "@/components/progress/ProgressProjectionCards";
import { LevelConceptsProgressCard } from "@/components/progress/LevelConceptsProgressCard";
import { buildCanSayNow } from "@/lib/progress/can-say-now";

const progressHeader = (
  <PageHeader
    kicker="Seguimiento"
    title="Progreso"
    subtitle="Racha, consistencia y perfil de habilidades a partir de lo que practicas."
  />
);

export default async function ProgressPage() {
  const user = await getSupabaseServerUser();

  if (!user) {
    return (
      <PageLayout archetype="dashboard" hero={progressHeader}>
        <GuestBanner />
      </PageLayout>
    );
  }

  const data = await getProgressPageData(user.id);
  const isGuest = isAnonymousUser(user);

  return (
    <PageLayout archetype="dashboard" hero={progressHeader}>
      <div className="flex flex-col gap-[var(--layout-section-gap)]">
        {isGuest ? <GuestSaveProgressBanner variant="emphasized" /> : null}

        {/* Action bar / status */}
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-kicker font-semibold text-fg-subtle">Plan diario</span>
            <p className="text-body-sm font-medium text-fg">
              {data.streak.completedToday
                ? "Plan diario completado hoy. Puedes seguir practicando para acelerar tu avance."
                : "Aún no has iniciado tu plan de hoy. Dedica unos minutos para mantener tu racha activa."}
            </p>
          </div>
          <Link href="/daily" className="w-full sm:w-auto shrink-0">
            <Button variant="primary" size="lg" fullWidth className="sm:w-auto">
              {data.streak.completedToday ? "Continuar practicando" : "Iniciar plan de hoy"}
            </Button>
          </Link>
        </div>

        {/* Hábito: racha · consistencia · esta semana */}
        <section className="flex flex-col gap-3" aria-label="Hábito y consistencia">
          <div className="flex flex-col gap-0.5">
            <span className="font-kicker font-semibold text-fg-subtle">Hábito</span>
            <h2 className="text-base font-semibold text-fg">Consistencia y racha</h2>
          </div>
          <div className="dashboard-grid-3">
            <StreakCard streak={data.streak} />
            <DailyCompletionRate stats={data.dailyCompletion} />
            <ThisWeekCard stats={data.weeklySummary} />
          </div>
        </section>

        {/* Calidad y balance de skills */}
        <section className="flex flex-col gap-3" aria-label="Calidad y balance de habilidades">
          <div className="flex flex-col gap-0.5">
            <span className="font-kicker font-semibold text-fg-subtle">Habilidades</span>
            <h2 className="text-base font-semibold text-fg">Calidad y balance</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
            <AccuracyTrend stats={data.accuracy} />
            <FluencyRadarCard
              scores={data.fluencyProfile.scores}
              comparisonLabel={data.fluencyProfile.comparisonLabel}
            />
          </div>
        </section>

        {/* Detalle por dominio */}
        <SkillProfileCard data={data.skillProfile} coach={data.coachInsights} />

        {/* Gramática por temas */}
        <LevelConceptsProgressCard />

        {/* Producción oral demostrada */}
        <CanSayNowCard
          data={buildCanSayNow({ attempts: data.canSayAttempts })}
          latency={data.speechLatency}
        />

        {/* Práctica vs dominio + historial */}
        <ProgressProjectionCards data={data.projections} />
        <ActivityHistoryCard sessions={data.recentSessions} />
      </div>
    </PageLayout>
  );
}
