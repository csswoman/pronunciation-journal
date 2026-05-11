"use client";

import { type ReactNode } from "react";
import { Play } from "lucide-react";
import Button from "@/components/ui/Button";

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
  variant?: "default" | "compact" | "hero-compact";
  progress?: number;
  lessonTitle?: string;
  onContinue?: () => void;
  className?: string;
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
  className = "",
}: PageHeaderProps) {
  const isCompact = variant === "compact";
  const isHeroCompact = variant === "hero-compact";
  const hasProgress = progress !== undefined && lessonTitle && onContinue;
  const safeProgress = hasProgress
    ? Math.max(0, Math.min(100, Math.round(progress!)))
    : 0;

  return (
    <div
      className={[
        "relative overflow-hidden",
        "bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)]",
        className || "rounded-[15px_15px_0_0]",
        isHeroCompact ? "p-5 lg:p-6" : isCompact ? "p-6 lg:p-8" : "p-8 lg:p-12",
        `grid grid-cols-1 lg:grid-cols-2 ${isHeroCompact ? "gap-6" : "gap-10"} items-center`,
      ].join(" ")}
    >
      {/* LEFT */}
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className={`inline-flex items-center gap-2 ${isHeroCompact ? "mb-3 py-1" : "mb-5 py-1.5"} px-3 rounded-full bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] border border-[color-mix(in_oklch,var(--primary)_20%,transparent)]`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            {isHeroCompact ? (
              <span className="font-semibold uppercase text-[var(--primary)]" style={{ fontSize: "var(--font-tiny)", letterSpacing: "0.05em" }}>
                {badge}
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
                {badge}
              </span>
            )}
          </div>
        )}

        <h1
          className="text-fg"
          style={isHeroCompact ? { font: "var(--font-h1)" } : { font: "var(--font-h2)" }}
        >
          <span className="font-semibold">{title}</span>
          {subtitle && (
            <>
              <br />
              <span className="text-[var(--primary)] font-medium">{subtitle}</span>
            </>
          )}
        </h1>

        {description && (
          <p className={`${isHeroCompact ? "mt-2 text-sm" : "mt-4 text-base"} text-fg-muted leading-relaxed`}>
            {description}
          </p>
        )}

        {hasProgress ? (
          <div className={`${isHeroCompact ? "mt-4 space-y-3" : "mt-8 space-y-4"}`}>
            <div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="font-medium text-fg">{lessonTitle}</span>
                <span className="text-fg-muted">{safeProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--line-divider)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>
            <Button
              onClick={onContinue}
              size={isHeroCompact ? "sm" : "lg"}
              className={isHeroCompact
                ? "shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
                : "shadow-[0_12px_30px_color-mix(in_oklch,var(--primary)_30%,transparent)] hover:translate-y-[-1px] transition-all"}
              style={isHeroCompact ? { padding: "var(--space-2) var(--space-4)" } : undefined}
              icon={<Play size={isHeroCompact ? 14 : 16} />}
            >
              Resume Lesson
            </Button>
          </div>
        ) : (
          (primaryCta || secondaryCta) && (
            <div className={`${isHeroCompact ? "mt-4 flex gap-3" : "mt-8 flex gap-4"} flex-wrap`}>
              {primaryCta && (
                <Button
                  onClick={primaryCta.onClick}
                  size={isHeroCompact ? "sm" : "lg"}
                  className={isHeroCompact
                    ? "shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
                    : "shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_35%,transparent)] hover:translate-y-[-1px] transition-all"}
                  style={isHeroCompact ? { padding: "var(--space-2) var(--space-4)" } : undefined}
                  icon={primaryCta.icon}
                >
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  onClick={secondaryCta.onClick}
                  variant="secondary"
                  size={isHeroCompact ? "sm" : "lg"}
                  style={isHeroCompact ? { padding: "var(--space-2) var(--space-4)" } : undefined}
                  icon={secondaryCta.icon}
                >
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {/* RIGHT — illustration */}
      {illustration && (
        <div className={`relative z-10 flex items-center justify-center ${isHeroCompact ? "min-h-[140px] max-h-[200px]" : "min-h-[260px]"}`}>
          <div className={`relative w-full ${isHeroCompact ? "max-w-[220px]" : "max-w-[420px]"} [&_img]:w-full [&_img]:h-auto [&_svg]:w-full [&_svg]:h-auto drop-shadow-xl`}>
            {illustration}
          </div>
        </div>
      )}
    </div>
  );
}
