"use client";

import { type ReactNode } from "react";
import { Play } from "lucide-react";

interface CTAButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface PageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
  illustration?: ReactNode;
  variant?: "default" | "compact";
  // Progress bar (practice page)
  progress?: number;
  lessonTitle?: string;
  onContinue?: () => void;
}

export default function PageHeader({
  badge,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  illustration,
  variant = "default",
  progress,
  lessonTitle,
  onContinue,
}: PageHeaderProps) {
  const isCompact = variant === "compact";
  const headingSize = isCompact ? "text-3xl lg:text-4xl" : "text-4xl lg:text-[42px]";
  const paddingClass = isCompact ? "p-6 lg:p-8" : "p-8 lg:p-10";
  const gapClass = isCompact ? "gap-6" : "gap-8";
  const hasProgress = progress !== undefined && lessonTitle && onContinue;
  const safeProgress = hasProgress ? Math.max(0, Math.min(100, Math.round(progress!))) : 0;

  return (
    <div
      className={`bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)]
        rounded-[15px_15px_0_0]
        ${paddingClass}
        grid grid-cols-1 lg:grid-cols-[1fr_auto] ${gapClass} items-center`}
      style={{ boxShadow: "none", border: 0 }}
    >
      <div>
        {badge && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-0.5 rounded-full bg-[var(--primary)]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
              {badge}
            </span>
          </div>
        )}

        <h1 className={`font-display ${headingSize} leading-tight tracking-tight text-[var(--deep-text)] mb-2`}>
          {title}
          {subtitle && (
            <>
              <br />
              <em className="not-italic text-[var(--primary)]">{subtitle}</em>
            </>
          )}
        </h1>

        {description && (
          <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6 max-w-md">
            {description}
          </p>
        )}

        {hasProgress ? (
          <div className="mt-6 max-w-xl space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-[var(--deep-text)]">{lessonTitle}</span>
                <span className="text-[var(--text-tertiary)]">-</span>
                <span className="text-[var(--text-secondary)]">{safeProgress}% complete</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line-divider)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500 ease-out"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--accent-text)] shadow-[0_12px_30px_color-mix(in_oklch,var(--primary)_28%,transparent)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            >
              <Play size={16} className="fill-current" />
              Resume Lesson
            </button>
          </div>
        ) : (
          (primaryCta || secondaryCta) && (
            <div className="flex items-center gap-3 flex-wrap">
              {primaryCta && (
                <button
                  onClick={primaryCta.onClick}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                    text-sm font-semibold
                    bg-[var(--primary)] text-[var(--accent-text)]
                    hover:opacity-90 hover:-translate-y-px
                    shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_30%,transparent)]
                    transition-all duration-200"
                >
                  {primaryCta.icon}
                  {primaryCta.label}
                </button>
              )}
              {secondaryCta && (
                <button
                  onClick={secondaryCta.onClick}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
                    text-sm font-medium
                    bg-[var(--card-bg)] text-[var(--deep-text)]
                    border border-[var(--line-color)]
                    hover:bg-[var(--btn-plain-bg-hover)] hover:text-[var(--primary)]
                    transition-all duration-200"
                >
                  {secondaryCta.icon}
                  {secondaryCta.label}
                </button>
              )}
            </div>
          )
        )}
      </div>

      {illustration && (
        <div className="hidden lg:flex items-center justify-center">
          {illustration}
        </div>
      )}
    </div>
  );
}
