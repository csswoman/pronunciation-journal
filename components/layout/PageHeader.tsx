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
  variant?: "default" | "compact" | "hero-compact";
  progress?: number;
  lessonTitle?: string;
  phonemeLabel?: string;
  decorativeText?: string;
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
  phonemeLabel,
  onContinue,
  className = "",
}: PageHeaderProps) {
  const isHeroCompact = variant === "hero-compact";
  const isCompact = variant === "compact";
  const hasProgress = progress !== undefined && lessonTitle && onContinue;
  const safeProgress = hasProgress
    ? Math.max(0, Math.min(100, Math.round(progress!)))
    : 0;

  /* ── hero-compact: full-width banner ── */
  if (isHeroCompact) {
    const subtitleWords = subtitle?.split(" ") ?? [];
    const accentPart = subtitleWords.slice(0, 2).join(" ");
    const tailPart = subtitleWords.slice(2).join(" ");

    return (
      <div
        className={["flex flex-col", className].join(" ")}
        style={{
          padding: "var(--space-6) var(--space-8) var(--space-5)",
          gap: "var(--space-5)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Row 1: badge + large title | resume button */}
        <div className="flex items-start justify-between" style={{ gap: "var(--space-6)" }}>
          <div className="flex flex-col" style={{ gap: "var(--space-1)" }}>
            {badge && (
              <span
                style={{
                  font: "var(--font-tiny)",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {badge}
              </span>
            )}
            <h1 style={{ font: "var(--font-h2)", color: "var(--text-primary)", lineHeight: 1.25, margin: 0 }}>
              {title}
              {subtitle && (
                <>
                  {", "}
                  <span style={{ color: "var(--primary)" }}>{accentPart}</span>
                  {tailPart && <span style={{ color: "var(--text-primary)" }}> {tailPart}</span>}
                </>
              )}
            </h1>
          </div>

          {hasProgress && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="shrink-0 inline-flex items-center"
              style={{
                gap: "var(--space-2)",
                background: "var(--primary)",
                color: "var(--on-primary)",
                borderRadius: "var(--radius-full)",
                height: "40px",
                padding: "0 var(--space-5)",
                font: "var(--font-body-sm)",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: `background var(--transition-fast)`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}
            >
              <Play size={14} />
              Resume Lesson
            </button>
          )}

          {!hasProgress && (primaryCta || secondaryCta) && (
            <div className="flex gap-3 shrink-0">
              {primaryCta && (
                <button
                  type="button"
                  onClick={primaryCta.onClick}
                  className="inline-flex items-center gap-2"
                  style={{
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                    borderRadius: "var(--radius-full)",
                    height: "40px",
                    padding: "0 var(--space-5)",
                    font: "var(--font-body-sm)",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {primaryCta.icon}
                  {primaryCta.label}
                </button>
              )}
              {secondaryCta && (
                <button
                  type="button"
                  onClick={secondaryCta.onClick}
                  className="inline-flex items-center gap-2"
                  style={{
                    background: "var(--surface-sunken)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-full)",
                    height: "40px",
                    padding: "0 var(--space-5)",
                    font: "var(--font-body-sm)",
                    cursor: "pointer",
                  }}
                >
                  {secondaryCta.icon}
                  {secondaryCta.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Row 2: active lesson card with left accent border */}
        {hasProgress && (
          <div
            className="flex items-center"
            style={{
              position: "relative",
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              borderLeft: "3px solid var(--primary)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-4) var(--space-5)",
              gap: "var(--space-4)",
              overflow: "hidden",
            }}
          >
            {phonemeLabel && (
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  background: "var(--primary-soft)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2) var(--space-3)",
                  minWidth: "64px",
                }}
              >
                <span style={{ font: "var(--font-h4)", fontWeight: 300, color: "var(--primary)" }}>
                  {phonemeLabel}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col" style={{ gap: "var(--space-1)" }}>
              <span
                style={{
                  font: "var(--font-tiny)",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Continuing
              </span>
              <div className="flex items-center justify-between" style={{ gap: "var(--space-3)" }}>
                <span
                  className="truncate"
                  style={{ font: "var(--font-body-sm)", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  {lessonTitle}
                </span>
                <span
                  className="shrink-0 tabular-nums"
                  style={{ font: "var(--font-body-sm)", fontWeight: 600, color: "var(--primary)" }}
                >
                  {safeProgress}%
                </span>
              </div>
              <div style={{ height: "4px", borderRadius: "var(--radius-full)", background: "var(--surface-sunken)", overflow: "hidden", marginTop: "var(--space-1)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${safeProgress}%`, borderRadius: "var(--radius-full)", background: "var(--primary)" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── default / compact: original stacked layout ── */
  return (
    <div
      className={[
        "relative overflow-hidden",
        "grid grid-cols-1 lg:grid-cols-2 items-center",
        isCompact ? "gap-8 p-6 lg:p-8" : "gap-10 p-8 lg:p-12",
        className || "rounded-[15px_15px_0_0]",
      ].join(" ")}
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* LEFT */}
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div
            className="inline-flex items-center mb-5 px-3 py-1"
            style={{
              background: "var(--overlay-subtle)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <span
              style={{
                font: "var(--font-tiny)",
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {badge}
            </span>
          </div>
        )}

        <div>
          <span className="block" style={{ font: "var(--font-h3)", color: "var(--text-primary)" }}>
            {title}
          </span>
          {subtitle && (
            <span className="block" style={{ font: "var(--font-h3)", color: "var(--primary)" }}>
              {subtitle}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1" style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}

        {hasProgress ? (
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {phonemeLabel && (
                  <span
                    style={{
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                      borderRadius: "var(--radius-full)",
                      font: "var(--font-tiny)",
                      padding: "2px 8px",
                    }}
                  >
                    {phonemeLabel}
                  </span>
                )}
                <span
                  className="truncate"
                  style={{ font: "var(--font-body-sm)", fontWeight: 500, color: "var(--text-primary)" }}
                >
                  {lessonTitle}
                </span>
                <span
                  className="ml-auto shrink-0 tabular-nums"
                  style={{ font: "var(--font-tiny)", color: "var(--text-tertiary)" }}
                >
                  {safeProgress}%
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--overlay-subtle)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${safeProgress}%`, borderRadius: "var(--radius-full)", background: "var(--primary)" }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
                borderRadius: "var(--radius-md)",
                height: "40px",
                padding: "0 var(--space-5)",
                font: "var(--font-body-sm)",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: `background var(--transition-fast)`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}
            >
              <Play size={14} />
              Resume Lesson
            </button>
          </div>
        ) : (
          (primaryCta || secondaryCta) && (
            <div className="mt-8 flex gap-4 flex-wrap">
              {primaryCta && (
                <button
                  type="button"
                  onClick={primaryCta.onClick}
                  className="inline-flex items-center gap-2"
                  style={{
                    background: "var(--primary)",
                    color: "var(--on-primary)",
                    borderRadius: "var(--radius-md)",
                    height: "40px",
                    padding: "0 var(--space-5)",
                    font: "var(--font-body-sm)",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {primaryCta.icon}
                  {primaryCta.label}
                </button>
              )}
              {secondaryCta && (
                <button
                  type="button"
                  onClick={secondaryCta.onClick}
                  className="inline-flex items-center gap-2"
                  style={{
                    background: "var(--surface-sunken)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    height: "40px",
                    padding: "0 var(--space-5)",
                    font: "var(--font-body-sm)",
                    cursor: "pointer",
                  }}
                >
                  {secondaryCta.icon}
                  {secondaryCta.label}
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* RIGHT — illustration */}
      {illustration && (
        <div className="relative z-10 flex items-center justify-center" style={{ minHeight: "260px" }}>
          <div
            className="relative w-full [&_img]:w-full [&_img]:h-auto [&_svg]:w-full [&_svg]:h-auto drop-shadow-xl"
            style={{ maxWidth: "420px" }}
          >
            {illustration}
          </div>
        </div>
      )}
    </div>
  );
}
