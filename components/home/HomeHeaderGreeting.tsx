import { CalendarDays } from "lucide-react";

interface HomeHeaderGreetingProps {
  userName: string;
  dateLabel: string;
  exercisesReady?: number;
  improvedPhoneme?: string | null;
  improvementPct?: number | null;
  hideSubtitle?: boolean;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeHeaderGreeting({
  userName,
  dateLabel,
  exercisesReady,
  improvedPhoneme,
  improvementPct,
  hideSubtitle = false,
}: HomeHeaderGreetingProps) {
  const greeting = getTimeGreeting();

  const subtitle = (() => {
    if (exercisesReady && improvedPhoneme && improvementPct) {
      return `You have ${exercisesReady} exercises ready. Your /${improvedPhoneme}/ accuracy improved ${improvementPct}% this week.`;
    }
    if (exercisesReady) {
      return `You have ${exercisesReady} exercises ready for today.`;
    }
    return "You're all caught up for today.";
  })();

  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
        <CalendarDays size={11} />
        {dateLabel}
      </p>
      <h1
        className="text-3xl font-light leading-tight tracking-tight"
        style={{ fontFamily: "var(--font-editorial), serif", fontOpticalSizing: "auto" } as React.CSSProperties}
      >
        {greeting},{" "}
        <em className="not-italic font-light text-[var(--primary)]">{userName}</em>
      </h1>
      {!hideSubtitle ? (
        <p className="text-sm text-[var(--text-secondary)] leading-snug max-w-xs">{subtitle}</p>
      ) : null}
    </div>
  );
}
