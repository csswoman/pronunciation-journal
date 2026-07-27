import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/cn";

interface HomePronunciationPromptProps {
  compact?: boolean;
  /** Soft CTA when another setup strip already owns the primary action. */
  demoteCta?: boolean;
}

export default function HomePronunciationPrompt({
  compact = false,
  demoteCta = false,
}: HomePronunciationPromptProps) {
  if (compact) {
    return (
      <section className="home-sidebar-card flex flex-col gap-2" aria-labelledby="pronunciation-prompt-compact-title">
        <span className="font-kicker text-fg-subtle">Diagnóstico oral</span>
        <h2 id="pronunciation-prompt-compact-title" className="font-label text-fg">
          Evalúa tu pronunciación
        </h2>
        <p className="font-body-sm text-fg-muted">
          Graba tu voz para ver qué sonidos necesitas reforzar.
        </p>
        <Link
          href="/assessment/pronunciation"
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Hacer diagnóstico oral
          <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-sunken/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
      aria-labelledby="pronunciation-prompt-title"
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <h2 id="pronunciation-prompt-title" className="font-label font-semibold text-fg">
          Mira cómo suena tu pronunciación
        </h2>
        <p className="font-body-sm max-w-[60ch] text-fg-muted">
          Graba unas frases y te marcamos los sonidos a reforzar.
        </p>
      </div>
      <Link
        href="/assessment/pronunciation"
        className={cn(
          "focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-4 font-label transition-colors",
          demoteCta
            ? "text-fg-muted underline-offset-2 hover:text-fg hover:underline"
            : "bg-primary text-on-primary hover:bg-primary-hover",
        )}
      >
        Hacer diagnóstico oral
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
