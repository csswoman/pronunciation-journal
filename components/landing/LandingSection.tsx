// Planned structure:
// <LandingSection>          — vertical rhythm + max width for every landing band
//   <LandingSectionHeading> — kicker + title + optional lead
import { cn } from "@/lib/cn";

interface LandingSectionProps {
  children: React.ReactNode;
  id?: string;
  /** Sunken band, used to separate adjacent sections without a hard rule. */
  tone?: "default" | "sunken";
  className?: string;
}

export function LandingSection({
  children,
  id,
  tone = "default",
  className,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "px-[var(--space-5)] py-[var(--space-16)] md:py-[var(--space-20)]",
        tone === "sunken" && "bg-[var(--surface-sunken)]",
        className
      )}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

interface LandingSectionHeadingProps {
  kicker?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}

export function LandingSectionHeading({
  kicker,
  title,
  lead,
  align = "left",
}: LandingSectionHeadingProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-[var(--space-3)]",
        align === "center" && "items-center text-center"
      )}
    >
      {kicker ? (
        <p className="font-[var(--font-kicker)] uppercase tracking-[var(--text-tracking-kicker)] text-[var(--accent-1)]">
          {kicker}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-[length:clamp(1.75rem,1.2rem+2.2vw,2.75rem)] font-[var(--text-weight-h1)]",
          "leading-[var(--text-leading-h1)] tracking-[var(--text-tracking-h1)]",
          "text-[var(--text-primary)] text-balance"
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={cn(
            "max-w-2xl font-[var(--font-body)] text-[var(--text-secondary)] text-pretty",
            align === "center" && "mx-auto"
          )}
        >
          {lead}
        </p>
      ) : null}
    </header>
  );
}
