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
      className={[
        "page-header flex flex-col px-[var(--layout-page-inline)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-[var(--layout-stack-loose)]">
        <div className="layout-stack-tight">
          {badge && (
            <span className="font-kicker text-fg-subtle">
              {badge}
            </span>
          )}
          <h1 className="m-0 text-h2 text-balance text-fg">
            {title}
            {subtitle && (
              <>
                {", "}
                <span className="text-primary">{accent}</span>
                {tail && <span className="text-fg"> {tail}</span>}
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
          <div className="flex shrink-0 gap-[var(--layout-stack)]">
            <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="full" />
          </div>
        )}
      </div>

      {hasProgress && (
        <div className="flex items-center gap-[var(--layout-stack-loose)] overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised px-[var(--layout-card-pad)] py-[var(--layout-stack-loose)]">
          {phonemeLabel && (
            <div className="flex min-w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-primary-soft px-[var(--layout-stack)] py-[var(--layout-stack-tight)]">
              <span className="text-h4 font-light text-primary">{phonemeLabel}</span>
            </div>
          )}

          <div className="layout-stack-tight min-w-0 flex-1">
            <span className="font-kicker text-fg-subtle">
              Continuing
            </span>
            <div className="flex items-center justify-between gap-[var(--layout-stack)]">
              <span className="truncate font-body-sm font-medium text-fg">
                {lessonTitle}
              </span>
              <span className="shrink-0 tabular-nums font-body-sm font-semibold text-primary">
                {safeProgress}%
              </span>
            </div>
            <div className="mt-[var(--layout-stack-tight)] h-1 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${safeProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
