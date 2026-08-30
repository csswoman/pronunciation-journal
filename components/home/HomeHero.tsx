"use client";

// Planned structure:
// <HomeHero>
//   <HeroHeader> (greeting + steps/time summary)
//   <HeroAction> (compact primary CTA button)
//   <HeroProgress> (5-segment discrete progress bar)
// </HomeHero>

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isPermanentUser } from "@/lib/auth/is-anonymous";
import { PlanSegmentProgress } from "@/components/home/PlanSegmentProgress";
import type { DailyStepStatus } from "@/hooks/useDailyPlan";
import type { PrimaryAction } from "@/lib/home/primary-action";
import { cn } from "@/lib/cn";

interface HomeHeroProps {
  primaryAction: PrimaryAction;
  stepIds?: string[];
  completedCount?: number;
  getStepStatus?: (stepId: string) => DailyStepStatus;
  totalMinutes?: number;
  isNewLearner?: boolean;
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

const DEFAULT_SEGMENT_IDS = ["step-1", "step-2", "step-3", "step-4", "step-5"];

export default function HomeHero({
  primaryAction,
  stepIds,
  completedCount = 0,
  getStepStatus,
  totalMinutes,
  isNewLearner = false,
}: HomeHeroProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const fullName = preferences?.full_name || metadataName || user?.email?.split("@")[0] || null;
  const userName = isPermanentUser(user) && fullName ? fullName.split(" ")[0] : null;

  const greeting = getGreeting();
  const title = userName ? `${greeting}, ${userName}` : greeting;

  const resolvedStepIds = stepIds && stepIds.length > 0 ? stepIds : DEFAULT_SEGMENT_IDS;
  const totalSteps = resolvedStepIds.length;

  const defaultStepStatus = (id: string): DailyStepStatus => {
    if (getStepStatus) return getStepStatus(id);
    return "pending";
  };

  let subtitle = "Tu plan de hoy es el camino más corto";
  if (totalSteps > 0 && !isNewLearner) {
    const timeText = totalMinutes && totalMinutes > 0 ? ` · ${totalMinutes} min` : " · 20 min";
    subtitle = `${totalSteps} ${totalSteps === 1 ? "paso" : "pasos"}${timeText}`;
  }

  const isPrimary = primaryAction.variant === "primary";

  return (
    <section
      aria-label="Resumen de hoy"
      className="flex flex-col gap-4 rounded-xl border border-border-default bg-daily-card p-4 sm:p-5 shadow-sm motion-reduce:shadow-none"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-h3 font-bold text-fg">{title}</h1>
          <p className="font-body-sm text-fg-muted">{subtitle}</p>
        </div>

        <Link
          href={primaryAction.href}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-xl px-4 py-2 text-center font-label text-body-sm font-semibold transition-colors sm:self-auto",
            isPrimary
              ? "bg-cta-bg text-cta-fg hover:bg-cta-bg-hover"
              : "border border-border-default bg-surface-raised text-fg hover:bg-surface-sunken",
          )}
        >
          <span>{primaryAction.label}</span>
        </Link>
      </div>

      <div className="w-full pt-1">
        <PlanSegmentProgress
          stepIds={resolvedStepIds}
          completedCount={completedCount}
          getStepStatus={defaultStepStatus}
        />
      </div>
    </section>
  );
}
