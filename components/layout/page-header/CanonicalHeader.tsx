// Planned structure:
// <header>
//   kicker?
//   h1 title
//   subtitle?
//   actions? | progress?
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
  const chromeKicker = kicker ?? badge;
  const chromeSubtitle = subtitle ?? description;

  return (
    <header
      role="banner"
      className={cn("page-header", isCompact && "page-header--compact", className)}
    >
      {chromeKicker ? (
        <span className="font-kicker text-fg-muted">{chromeKicker}</span>
      ) : null}
      <div className="flex flex-col gap-layout-stack-tight sm:flex-row sm:items-start sm:justify-between sm:gap-layout-stack-loose">
        <div className="layout-stack-tight min-w-0">
          <h1 className={cn("text-balance text-fg", isCompact ? "text-h3" : "text-h2")}>
            {title}
          </h1>
          {chromeSubtitle ? (
            <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
              {chromeSubtitle}
            </p>
          ) : null}
        </div>
        {!hasProgress && (primaryCta || secondaryCta || actions) ? (
          <div className="flex shrink-0 flex-wrap items-center gap-layout-stack-tight">
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
