import Link from "next/link";
import { ArrowRight } from "@/components/icons";

interface HomePlacementPromptProps {
  compact?: boolean;
}

export default function HomePlacementPrompt({ compact = false }: HomePlacementPromptProps) {
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
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 font-body-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Hacer prueba de nivel
          <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-[var(--layout-stack-loose)] layout-card-pad rounded-xl border border-border-subtle bg-surface-raised sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="placement-prompt-title"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-kicker text-fg-subtle">Ajusta tu ruta</span>
        <h2 id="placement-prompt-title" className="font-title text-fg">
          Haz que el plan empiece desde tu nivel
        </h2>
        <p className="font-body-sm max-w-[60ch] text-fg-muted">
          Dinos qué temas conoces y compruébalos con unas preguntas.
        </p>
      </div>
      <Link
        href="/assessment"
        className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 font-label text-on-primary transition-colors hover:bg-primary-hover"
      >
        Hacer prueba de nivel
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
