import { cn } from "@/lib/cn";
import { CtaButtons, ResumeButton } from "./PageHeaderButtons";
import type { PageHeaderDerived } from "./types";

export function DefaultCompactHeader({ badge, title, subtitle, description, primaryCta, secondaryCta, illustration, variant, hasProgress, safeProgress, lessonTitle, phonemeLabel, onContinue, className = "" }: PageHeaderDerived) {
  const isCompact = variant === "compact";
  return (
    <div
      className={cn(
        "relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-center",
        "gap-layout-section-gap bg-surface-raised border border-border-subtle shadow-md",
        isCompact ? "layout-card-pad-compact" : "layout-card-pad",
        className || "rounded-t-2xl",
      )}
    >
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className="inline-flex items-center mb-5 px-3 py-1 bg-overlay-subtle border border-border-subtle rounded-full">
            <span className="font-kicker text-fg-subtle">{badge}</span>
          </div>
        )}
        <div>
          <span className="block text-h3 text-fg">{title}</span>
          {subtitle && <span className="block text-h3 text-primary">{subtitle}</span>}
        </div>
        {description && <p className="mt-1 text-body-sm text-fg-muted">{description}</p>}
        {hasProgress ? (
          <div className="mt-layout-section-gap layout-stack">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {phonemeLabel && <span className="bg-primary-soft text-primary rounded-full font-kicker px-2 py-0.5">{phonemeLabel}</span>}
                <span className="truncate text-body-sm font-medium text-fg">{lessonTitle}</span>
                <span className="ml-auto shrink-0 tabular-nums font-kicker text-fg-subtle">{safeProgress}%</span>
              </div>
              <div className="h-1 rounded-full bg-overlay-subtle overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${safeProgress}%` }} />
              </div>
            </div>
            {onContinue && <ResumeButton onClick={onContinue} />}
          </div>
        ) : (primaryCta || secondaryCta) && (
          <div className="mt-layout-section-gap flex gap-4 flex-wrap">
            <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="md" />
          </div>
        )}
      </div>
      {illustration && (
        <div className="relative z-10 flex min-h-65 items-center justify-center">
          <div className="relative w-full max-w-105 drop-shadow-xl [&_img]:w-full [&_img]:h-auto [&_svg]:w-full [&_svg]:h-auto">{illustration}</div>
        </div>
      )}
    </div>
  );
}
