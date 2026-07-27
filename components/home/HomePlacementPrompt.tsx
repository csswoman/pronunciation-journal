import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/cn";

interface HomePlacementPromptProps {
  compact?: boolean;
  /** Soft CTA when another setup strip already owns the primary action. */
  demoteCta?: boolean;
}

export default function HomePlacementPrompt({
  compact = false,
  demoteCta = false,
}: HomePlacementPromptProps) {
  if (compact) {
    return (
      <section className="home-sidebar-card flex flex-col gap-2" aria-labelledby="placement-prompt-compact-title">
        <span className="font-kicker text-fg-subtle">Ajusta tu ruta</span>
        <h2 id="placement-prompt-compact-title" className="font-label text-fg">
          Afina tu nivel
        </h2>
        <p className="font-body-sm text-fg-muted">
          Comprueba qué temas ya dominas para ordenar mejor tu plan.
        </p>
        <Link
          href="/assessment"
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Hacer prueba de nivel
          <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-sunken/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
      aria-labelledby="placement-prompt-title"
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <h2 id="placement-prompt-title" className="font-label font-semibold text-fg">
          Empieza el plan desde tu nivel
        </h2>
        <p className="font-body-sm max-w-[60ch] text-fg-muted">
          Unas preguntas cortas para ordenar mejor lo de hoy.
        </p>
      </div>
      <Link
        href="/assessment"
        className={cn(
          "focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-4 font-label transition-colors",
          demoteCta
            ? "text-fg-muted underline-offset-2 hover:text-fg hover:underline"
            : "bg-primary text-on-primary hover:bg-primary-hover",
        )}
      >
        Hacer prueba de nivel
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
