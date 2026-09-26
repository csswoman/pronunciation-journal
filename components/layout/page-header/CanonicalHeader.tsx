// Planned structure:
// <header>
//   kicker?
//   h1 title
//   subtitle?
//   actions? | badge? | progress?
// </header>

import { cn } from "@/lib/cn";
import { CtaButtons } from "./PageHeaderButtons";
import type { PageHeaderDerived } from "./types";

export function CanonicalHeader({
  kicker,
  badge,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  actions,
  variant,
  hasProgress,
  safeProgress,
  lessonTitle,
  phonemeLabel,
  onContinue,
  className = "",
}: PageHeaderDerived) {
  const isCompact = variant === "compact";
  const chromeKicker = kicker;
  const chromeBadge = badge;
  const chromeSubtitle = subtitle ?? description;

  return (
    <header
      role="banner"
      className={cn("page-header", isCompact && "page-header--compact", className)}
    >
      {chromeKicker ? (
        <span className="font-kicker text-fg-muted">{chromeKicker}</span>
      ) : null}
      <div className="flex flex-row items-center justify-between gap-layout-stack-tight sm:items-end sm:gap-layout-stack-loose">
        <div className="layout-stack-tight min-w-0">
          <h1 className={cn("text-balance font-heading font-extrabold text-fg tracking-tight", isCompact ? "text-h3" : "text-h1")}>
            {title}
          </h1>
          {chromeSubtitle ? (
            <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
              {chromeSubtitle}
            </p>
          ) : null}
        </div>
        {!hasProgress && (primaryCta || secondaryCta || actions || chromeBadge) ? (
          <div className="flex shrink-0 flex-wrap items-center gap-layout-stack-tight">
            {chromeBadge && !actions && !primaryCta && !secondaryCta ? (
              <span className="rounded-full border border-border-default bg-surface-raised px-4 py-1.5 font-label text-caption font-semibold text-fg shadow-xs">
                {chromeBadge}
              </span>
            ) : null}
            {actions}
            {(primaryCta || secondaryCta) ? (
              <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="md" />
            ) : null}
          </div>
        ) : null}
      </div>
      {hasProgress ? (
        <div className="layout-stack-tight">
          <div className="flex items-center gap-layout-stack-tight">
            {phonemeLabel ? (
              <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-caption text-fg">
                {phonemeLabel}
              </span>
            ) : null}
            {lessonTitle ? (
              <span className="truncate font-body-sm text-fg">{lessonTitle}</span>
            ) : null}
            <span className="ml-auto font-caption tabular-nums text-fg-muted">
              {safeProgress}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-fg transition-[width] duration-300 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          {onContinue && primaryCta == null ? (
            <CtaButtons
              primaryCta={{ label: "Continuar", onClick: onContinue }}
              rounded="md"
            />
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
