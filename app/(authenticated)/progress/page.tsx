import { getSupabaseServerUser } from "@/lib/supabase/session";
import { getProgressPageData } from "@/lib/progress/queries";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import PageLayout from "@/components/layout/PageLayout";
import { GuestBanner } from "@/components/layout/stats/GuestBanner";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import { HabitHeroCard } from "@/components/progress/HabitHeroCard";
import { SkillsBalanceCard } from "@/components/progress/SkillsBalanceCard";
import { AccuracyGaugeCard } from "@/components/progress/AccuracyGaugeCard";
import { AccumulatedPracticeCard } from "@/components/progress/AccumulatedPracticeCard";
import { WhereToFocusSection } from "@/components/progress/WhereToFocusSection";
import { LevelConceptsProgressCard } from "@/components/progress/LevelConceptsProgressCard";
import { ActivityHistoryCard } from "@/components/progress/ActivityHistoryCard";
import { CanSayNowCard } from "@/components/progress/CanSayNowCard";
import { ImmersionProgressCard } from "@/components/progress/ImmersionProgressCard";
import { buildCanSayNow } from "@/lib/progress/can-say-now";
import type { CefrLevelId } from "@/lib/courses/types";

export default async function ProgressPage() {
  const user = await getSupabaseServerUser();

  if (!user) {
    return (
      <PageLayout
        archetype="dashboard"
        hero={
          <div className="flex flex-col gap-1">
            <span className="font-kicker font-semibold text-xs uppercase tracking-wider text-fg-subtle">
              SEGUIMIENTO
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-fg">
              Progreso
            </h1>
          </div>
        }
      >
        <GuestBanner />
      </PageLayout>
    );
  }

  const data = await getProgressPageData(user.id);
  const isGuest = isAnonymousUser(user);

  const heroHeader = (
    <div className="flex flex-col gap-1 pb-2">
      <span className="font-kicker font-semibold text-xs uppercase tracking-wider text-fg-subtle">
        SEGUIMIENTO
      </span>
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-fg leading-tight">
        Progreso
      </h1>
      <p className="text-sm font-normal text-fg-muted">
        Racha, consistencia y perfil de habilidades a partir de lo que practicas.
      </p>
    </div>
  );

  return (
    <PageLayout archetype="dashboard" hero={heroHeader}>
      <div className="flex flex-col gap-6 sm:gap-8">
        {isGuest ? <GuestSaveProgressBanner variant="emphasized" /> : null}

        {data.dataErrors.length > 0 ? (
          <div
            role="status"
            className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-warning/30 bg-warning-soft/60 px-4 py-3 text-caption text-warning"
          >
            <span className="font-semibold">
              No pudimos cargar algunas secciones ahora mismo, no significa que falte actividad:
            </span>
            <span>{data.dataErrors.join(' · ')}</span>
          </div>
        ) : null}

        {/* 1. Habit Hero Card (Plan Diario, Racha, Consistencia) */}
        <HabitHeroCard
          streak={data.streak}
          dailyCompletion={data.dailyCompletion}
          weeklySummary={data.weeklySummary}
        />

        {/* 2. Skills Balance + Accuracy & Accumulated Practice */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 sm:gap-8 items-stretch">
          <SkillsBalanceCard
            scores={data.fluencyProfile.scores}
            comparisonLabel={data.fluencyProfile.comparisonLabel}
          />

          <div className="flex flex-col gap-6 justify-between">
            <AccuracyGaugeCard stats={data.accuracy} />
            <AccumulatedPracticeCard data={data.projections} />
          </div>
        </div>

        {/* 3. Dónde Enfocar (Sound Lab, Diccionario, Coach) */}
        <WhereToFocusSection
          data={data.skillProfile}
          coach={data.coachInsights}
          learnerLevel={data.learnerLevel}
        />

        {/* 4. Producción oral + Inmersión */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          <CanSayNowCard
            data={buildCanSayNow({ attempts: data.canSayAttempts })}
            latency={data.speechLatency}
          />

          <ImmersionProgressCard data={data.domains.immersion} />
        </div>

        {/* 5. Dominio por Temas + Práctica Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          <LevelConceptsProgressCard
            topics={data.domains.topics}
            completedRoute={data.domains.completedRoute}
            initialLevel={data.learnerLevel.level.toLowerCase() as CefrLevelId}
          />

          <ActivityHistoryCard sessions={data.recentSessions} />
        </div>
      </div>
    </PageLayout>
  );
}
