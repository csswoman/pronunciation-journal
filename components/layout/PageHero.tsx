import { ReactNode } from "react";

interface CtaPrimary {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface CtaSecondary {
  label: string;
  onClick: () => void;
}

interface PageHeroProps {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  primaryCta: CtaPrimary;
  secondaryCta?: CtaSecondary;
  illustration?: ReactNode;
  extraContent?: ReactNode;
}

export default function PageHero({
  eyebrow,
  title,
  titleAccent,
  description,
  primaryCta,
  secondaryCta,
  illustration,
  extraContent,
}: PageHeroProps) {
  return (
    <div
      className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)]
        border border-[var(--line-divider)] rounded-3xl
        p-8 lg:p-10 mb-8
        grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center"
      style={{ boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)" }}
    >
      <div>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-5 h-0.5 rounded-full bg-[var(--primary)]" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
            {eyebrow}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl lg:text-[42px] leading-tight tracking-tight text-[var(--deep-text)] mb-3">
          {title}
          <br />
          <em className="not-italic text-[var(--primary)]">{titleAccent}</em>
        </h1>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-md">
          {description}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
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

        {/* Extra slot */}
        {extraContent && <div className="mt-5">{extraContent}</div>}
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
