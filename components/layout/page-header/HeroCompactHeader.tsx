/** @deprecated Use PageHeader variant="default" | "compact". Kept for Sound Lab hero-compact until migrated. */
import { ResumeButton, CtaButtons } from "./PageHeaderButtons";
import type { PageHeaderDerived } from "./types";

export function HeroCompactHeader({
  badge,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  hasProgress,
  safeProgress,
  lessonTitle,
  phonemeLabel,
  onContinue,
  className = "",
}: PageHeaderDerived) {
  const words = subtitle?.split(" ") ?? [];
  const accent = words.slice(0, 2).join(" ");
  const tail = words.slice(2).join(" ");

  return (
    <div
      className={["flex flex-col px-3 sm:px-6 lg:px-10", className].join(" ")}
      style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-5)" }}
    >
      <div className="flex items-start justify-between gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          {badge && (
            <span className="text-[var(--font-tiny)] text-[var(--text-tertiary)] uppercase tracking-[0.1em]">
              {badge}
            </span>
          )}
          <h1 className="m-0 text-[var(--font-h2)] text-[var(--text-primary)] leading-[1.25]">
            {title}
            {subtitle && (
              <>
                {", "}
                <span className="text-[var(--primary)]">{accent}</span>
                {tail && <span className="text-[var(--text-primary)]"> {tail}</span>}
              </>
            )}
          </h1>
        </div>

        {hasProgress && onContinue && (
          <div className="shrink-0">
            <ResumeButton onClick={onContinue} />
          </div>
        )}

        {!hasProgress && (primaryCta || secondaryCta) && (
          <div className="flex gap-3 shrink-0">
            <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="full" />
          </div>
        )}
      </div>

      {hasProgress && (
        <div className="flex items-center bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] px-[var(--space-5)] py-[var(--space-4)] gap-[var(--space-4)] overflow-hidden">
          {phonemeLabel && (
            <div className="shrink-0 flex items-center justify-center bg-[var(--primary-soft)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] min-w-16">
              <span className="text-[var(--font-h4)] font-light text-[var(--primary)]">{phonemeLabel}</span>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-[var(--space-1)]">
            <span className="text-[var(--font-tiny)] text-[var(--text-tertiary)] uppercase tracking-[0.1em]">
              Continuing
            </span>
            <div className="flex items-center justify-between gap-[var(--space-3)]">
              <span className="truncate text-[var(--font-body-sm)] font-medium text-[var(--text-primary)]">
                {lessonTitle}
              </span>
              <span className="shrink-0 tabular-nums text-[var(--font-body-sm)] font-semibold text-[var(--primary)]">
                {safeProgress}%
              </span>
            </div>
            <div className="mt-[var(--space-1)] h-1 rounded-full bg-[var(--surface-sunken)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${safeProgress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
