import { Play } from "lucide-react";
import type { CTAButton } from "./types";

export function CtaButtons({ primaryCta, secondaryCta, rounded = "full" }: { primaryCta?: CTAButton; secondaryCta?: CTAButton; rounded?: "full" | "md"; }) {
  const radius = rounded === "full" ? "var(--radius-full)" : "var(--radius-md)";
  return <>
    {primaryCta && <button type="button" onClick={primaryCta.onClick} className="inline-flex items-center gap-2 h-10 px-5 font-medium border-none cursor-pointer bg-[var(--primary)] text-[var(--on-primary)]" style={{ borderRadius: radius, font: "var(--font-body-sm)" }}>{primaryCta.icon}{primaryCta.label}</button>}
    {secondaryCta && <button type="button" onClick={secondaryCta.onClick} className="inline-flex items-center gap-2 h-10 px-5 cursor-pointer border border-[var(--border-subtle)] bg-[var(--surface-sunken)] text-[var(--text-secondary)]" style={{ borderRadius: radius, font: "var(--font-body-sm)" }}>{secondaryCta.icon}{secondaryCta.label}</button>}
  </>;
}

export function ResumeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40"
      style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "var(--radius-md)" }}
    >
      <Play size={14} aria-hidden />
      Resume Lesson
    </button>
  );
}
