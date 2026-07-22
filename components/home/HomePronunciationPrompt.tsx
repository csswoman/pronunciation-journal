import Link from "next/link";
import { ArrowRight } from "@/components/icons";

interface HomePronunciationPromptProps {
  compact?: boolean;
}

export default function HomePronunciationPrompt({ compact = false }: HomePronunciationPromptProps) {
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
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 font-body-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Hacer diagnóstico oral
          <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
      aria-labelledby="pronunciation-prompt-title"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-kicker text-fg-subtle">Diagnóstico oral</span>
        <h2 id="pronunciation-prompt-title" className="font-title text-fg">
          Descubre cómo suena tu pronunciación hoy
        </h2>
        <p className="font-body-sm max-w-[60ch] text-fg-muted">
          Graba unas frases y recibe un diagnóstico de los sonidos que más te cuestan.
        </p>
      </div>
      <Link
        href="/assessment/pronunciation"
        className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 font-label text-on-primary transition-colors hover:bg-primary-hover"
      >
        Hacer diagnóstico oral
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
