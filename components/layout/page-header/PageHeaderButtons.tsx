import { Play } from "lucide-react";
import type { CTAButton } from "./types";

export function CtaButtons({ primaryCta, secondaryCta, rounded = "full" }: { primaryCta?: CTAButton; secondaryCta?: CTAButton; rounded?: "full" | "md"; }) {
  const radius = rounded === "full" ? "var(--radius-full)" : "var(--radius-md)";
  return <>
    {primaryCta && <button type="button" onClick={primaryCta.onClick} className="inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: radius, height: "40px", padding: "0 var(--space-5)", font: "var(--font-body-sm)", fontWeight: 500, border: "none", cursor: "pointer" }}>{primaryCta.icon}{primaryCta.label}</button>}
    {secondaryCta && <button type="button" onClick={secondaryCta.onClick} className="inline-flex items-center gap-2" style={{ background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: radius, height: "40px", padding: "0 var(--space-5)", font: "var(--font-body-sm)", cursor: "pointer" }}>{secondaryCta.icon}{secondaryCta.label}</button>}
  </>;
}

export function ResumeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40"
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
        transition: "background var(--transition-fast)",
      }}
    >
      <Play size={14} aria-hidden />
      Resume Lesson
    </button>
  );
}
