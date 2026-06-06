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
      className={["flex flex-col", className].join(" ")}
      style={{
        padding: "var(--space-6) var(--space-8) var(--space-5)",
        gap: "var(--space-5)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
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
          <h1
            style={{
              font: "var(--font-h2)",
              color: "var(--text-primary)",
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {title}
            {subtitle && (
              <>
                {", "}
                <span style={{ color: "var(--primary)" }}>{accent}</span>
                {tail && <span style={{ color: "var(--text-primary)" }}> {tail}</span>}
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
          <div className="flex gap-3 shrink-0">
            <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="full" />
          </div>
        )}
      </div>

      {hasProgress && (
        <div
          className="flex items-center"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-subtle)",
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
              <span
                style={{
                  font: "var(--font-h4)",
                  fontWeight: 300,
                  color: "var(--primary)",
                }}
              >
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
                style={{
                  font: "var(--font-body-sm)",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                {lessonTitle}
              </span>
              <span
                className="shrink-0 tabular-nums"
                style={{
                  font: "var(--font-body-sm)",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                {safeProgress}%
              </span>
            </div>
            <div
              style={{
                height: "4px",
                borderRadius: "var(--radius-full)",
                background: "var(--surface-sunken)",
                overflow: "hidden",
                marginTop: "var(--space-1)",
              }}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${safeProgress}%`,
                  borderRadius: "var(--radius-full)",
                  background: "var(--primary)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
