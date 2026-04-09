import { ReactNode } from "react";

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
}

/**
 * PageHeader: Reusable hero/header component with badge, title, CTAs, and optional illustration
 * Variants: 'default' (large, like home) or 'compact' (smaller, for internal pages)
 */
export default function PageHeader({
  badge,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  illustration,
  variant = "default",
}: PageHeaderProps) {
  const isCompact = variant === "compact";

  const headingSize = isCompact
    ? "text-3xl lg:text-4xl"
    : "text-4xl lg:text-[42px]";
  const paddingClass = isCompact ? "p-6 lg:p-8" : "p-8 lg:p-10";
  const gapClass = isCompact ? "gap-6" : "gap-8";

  return (
    <div
      className={`bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)]
        border border-[var(--line-divider)] rounded-3xl
        ${paddingClass} mb-8
        grid grid-cols-1 lg:grid-cols-[1fr_auto] ${gapClass} items-center`}
      style={{
        boxShadow:
          "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)",
      }}
    >
      <div>
        {/* Badge */}
        {badge && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-0.5 rounded-full bg-[var(--primary)]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
              {badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h1
          className={`font-display ${headingSize} leading-tight tracking-tight text-[var(--deep-text)] mb-2`}
        >
          {title}
          {subtitle && (
            <>
              <br />
              <em className="not-italic text-[var(--primary)]">{subtitle}</em>
            </>
          )}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6 max-w-md">
            {description}
          </p>
        )}

        {/* CTAs */}
        {(primaryCta || secondaryCta) && (
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
                {secondaryCta.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Illustration — hidden on mobile */}
      {illustration && (
        <div className="hidden lg:flex items-center justify-center">
          {illustration}
        </div>
      )}
    </div>
  );
}
