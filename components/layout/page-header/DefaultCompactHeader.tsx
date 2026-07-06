import { CtaButtons, ResumeButton } from "./PageHeaderButtons";
import type { PageHeaderDerived } from "./types";

export function DefaultCompactHeader({ badge, title, subtitle, description, primaryCta, secondaryCta, illustration, variant, hasProgress, safeProgress, lessonTitle, phonemeLabel, onContinue, className = "" }: PageHeaderDerived) {
  const isCompact = variant === "compact";
  return (
    <div
      className={["relative overflow-hidden", "grid grid-cols-1 lg:grid-cols-2 items-center", isCompact ? "gap-8 p-6 lg:p-8" : "gap-10 p-8 lg:p-12", className || "rounded-[15px_15px_0_0]"].join(" ")}
      style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-md)" }}
    >
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className="inline-flex items-center mb-5 px-3 py-1 bg-[var(--overlay-subtle)] border border-[var(--border-subtle)] rounded-full">
            <span className="text-[var(--text-tertiary)] uppercase tracking-[0.08em] text-[var(--font-tiny)]">{badge}</span>
          </div>
        )}
        <div>
          <span className="block text-[var(--text-primary)] text-[var(--font-h3)]">{title}</span>
          {subtitle && <span className="block text-[var(--primary)] text-[var(--font-h3)]">{subtitle}</span>}
        </div>
        {description && <p className="mt-1 text-[var(--text-secondary)] text-[var(--font-body-sm)]">{description}</p>}
        {hasProgress ? (
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {phonemeLabel && <span className="bg-[var(--primary-soft)] text-[var(--primary)] rounded-full text-[var(--font-tiny)] px-2 py-0.5">{phonemeLabel}</span>}
                <span className="truncate text-[var(--font-body-sm)] font-medium text-[var(--text-primary)]">{lessonTitle}</span>
                <span className="ml-auto shrink-0 tabular-nums text-[var(--font-tiny)] text-[var(--text-tertiary)]">{safeProgress}%</span>
              </div>
              <div className="h-1 rounded-full bg-[var(--overlay-subtle)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${safeProgress}%` }} />
              </div>
            </div>
            {onContinue && <ResumeButton onClick={onContinue} />}
          </div>
        ) : (primaryCta || secondaryCta) && (
          <div className="mt-8 flex gap-4 flex-wrap">
            <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="md" />
          </div>
        )}
      </div>
      {illustration && (
        <div className="relative z-10 flex items-center justify-center" style={{ minHeight: "260px" }}>
          <div className="relative w-full max-w-[420px] drop-shadow-xl [&_img]:w-full [&_img]:h-auto [&_svg]:w-full [&_svg]:h-auto">{illustration}</div>
        </div>
      )}
    </div>
  );
}
