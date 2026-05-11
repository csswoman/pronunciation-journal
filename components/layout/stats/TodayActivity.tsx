import { ArrowRight } from "lucide-react";
import type { DailyProgress } from "@/lib/types";

function MetricRow({ label, value, colored }: { label: string; value: string; colored?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--line-divider)" }}>
      <span className="text-sm text-fg-muted">{label}</span>
      <span className="text-sm font-bold" style={{ color: colored ? "var(--primary)" : "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

interface Props {
  todayProgress: DailyProgress | null | undefined;
}

export function TodayActivity({ todayProgress }: Props) {
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalAttempts = todayProgress?.totalAttempts ?? 0;
  const correctAttempts = todayProgress?.correctAttempts ?? 0;
  const accuracy = todayProgress?.averageAccuracy ?? 0;
  const xp = todayProgress?.xp ?? 0;
  const words = todayProgress?.wordsStudied ?? [];
  const incorrect = totalAttempts - correctAttempts;

  const donutRadius = 44;
  const donutCirc = 2 * Math.PI * donutRadius;
  const donutFill = donutCirc * Math.min(accuracy / 100, 1);

  const isEmpty = totalAttempts === 0;

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-fg">Today&apos;s activity</p>
          <p className="text-xs mt-0.5 text-fg-muted">{todayLabel}</p>
        </div>
      </div>

      {isEmpty ? (
        <div className="mt-5 flex flex-col items-center justify-center py-8 text-center gap-2">
          <svg width={72} height={72} viewBox="0 0 108 108" className="-rotate-90 opacity-30">
            <circle cx={54} cy={54} r={donutRadius} fill="none" stroke="var(--line-divider)" strokeWidth={10} />
          </svg>
          <p className="text-sm font-semibold -mt-14 text-fg-muted">
            No activity yet
          </p>
          <p className="text-xs text-fg-subtle">
            Complete a lesson or phoneme exercise to track today's progress.
          </p>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-6">
          {/* Donut */}
          <div className="relative shrink-0">
            <svg width={108} height={108} viewBox="0 0 108 108" className="-rotate-90">
              <circle cx={54} cy={54} r={donutRadius} fill="none" stroke="var(--line-divider)" strokeWidth={10} />
              <circle
                cx={54} cy={54} r={donutRadius} fill="none"
                stroke="var(--primary)" strokeWidth={10}
                strokeDasharray={`${donutFill} ${donutCirc - donutFill}`}
                strokeLinecap="round"
                className="animate-progress-ring"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-fg">{totalAttempts}</span>
              <span className="text-tiny font-semibold text-fg-muted">Attempts</span>
              <span className="text-tiny text-fg-subtle">{accuracy}% acc</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex-1">
            <MetricRow label="Correct" value={String(correctAttempts)} colored />
            <MetricRow label="Incorrect" value={String(incorrect)} />
            <MetricRow label="XP Earned" value={`+${xp}`} colored />
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-sm text-fg-muted">Words Studied</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-fg">{words.length}</span>
                {words.length > 0 && (
                  <span style={{ color: "var(--primary)" }}>
                    <ArrowRight size={14} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word chips */}
      {words.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {words.map((word, i) => (
            <span
              key={word}
              className="rounded-full px-3 py-1.5 text-xs font-medium animate-fadeIn"
              style={{
                animationDelay: `${i * 60}ms`,
                background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                color: "var(--text-primary)",
                border: "1px solid color-mix(in oklch, var(--primary) 12%, var(--line-divider))",
              }}
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

