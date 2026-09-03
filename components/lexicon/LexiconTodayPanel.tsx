import Link from "next/link";
import type { LessonViewModel } from "@/lib/lexicon/types";

// Subcomponent structure:
// <LexiconTodayPanel>
//   <section (Hero Card Container)>
//     <div (Copy & Chips Area)>
//       <span (Kicker Badge)>
//       <h2 (Hero Title)>
//       <p (Hero Description)>
//       <div (Word Chips)>
//     </div>
//     <div (Hero Action CTA)>
//       <Link (Primary Action Button)>
//     </div>
//   </section>
// </LexiconTodayPanel>

interface LexiconTodayPanelProps {
  dueForReview: number;
  nextLesson: LessonViewModel | null;
  dueWordLabels?: string[];
  progressUnavailable?: boolean;
}

export function LexiconTodayPanel({
  dueForReview,
  nextLesson,
  dueWordLabels = [],
  progressUnavailable = false,
}: LexiconTodayPanelProps) {
  const hasReview = dueForReview > 0;
  if (!hasReview && !nextLesson && !progressUnavailable) return null;

  const href = progressUnavailable
    ? "/words"
    : hasReview
    ? "/practice/review"
    : nextLesson
    ? `/words/${nextLesson.id}/practice`
    : "/words";

  const kickerText = progressUnavailable
    ? "DICCIONARIO EN VIVO"
    : hasReview
    ? "REPASO DIARIO PENDIENTE"
    : "RUTA SUGERIDA";

  const title = progressUnavailable
    ? "Explora el diccionario mientras cargamos tu progreso"
    : hasReview
    ? `${dueForReview} ${dueForReview === 1 ? "palabra te espera" : "palabras te esperan"} hoy`
    : nextLesson
    ? nextLesson.progress > 0
      ? `Continúa con ${nextLesson.title}`
      : `Empieza con ${nextLesson.title}`
    : "Elige una categoría para empezar";

  const estMinutes = Math.max(1, Math.ceil(dueForReview * 0.2));
  const description = progressUnavailable
    ? "Puedes consultar cualquier término o buscar por tema."
    : hasReview
    ? `Unos ${estMinutes} ${estMinutes === 1 ? "minuto" : "minutos"}. Las que falles vuelven a tu cola mañana.`
    : nextLesson
    ? `${nextLesson.wordsCompleted} de ${nextLesson.totalWords} palabras dominadas en esta categoría.`
    : "Explora el léxico por categorías.";

  const buttonLabel = progressUnavailable
    ? "Abrir diccionario"
    : hasReview
    ? "Repasar ahora"
    : "Empezar ruta";

  const visibleChips = dueWordLabels.slice(0, 4);
  const remainingCount = Math.max(0, dueForReview - visibleChips.length);

  return (
    <section
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 sm:p-7 shadow-xs hover:border-border-strong transition-all duration-200"
      aria-labelledby="words-today-title"
    >
      <div className="space-y-2 flex-1 min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft/80 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
          <span className="font-kicker text-[11px] uppercase tracking-wider">{kickerText}</span>
        </div>

        <h2 id="words-today-title" className="text-h3 font-bold text-fg tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-body-sm text-fg-muted leading-relaxed max-w-2xl">{description}</p>

        {hasReview && visibleChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-caption text-fg-subtle font-medium mr-1">Términos:</span>
            {visibleChips.map((word) => (
              <span
                key={word}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-sunken border border-border-subtle text-caption text-fg-muted font-medium"
              >
                {word}
              </span>
            ))}
            {remainingCount > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-sunken border border-dashed border-border-subtle text-caption text-fg-subtle">
                +{remainingCount} más
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 flex items-center">
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cta-bg text-cta-fg px-5 py-2.5 text-body-sm font-semibold hover:bg-cta-bg-hover active:scale-[0.98] transition-all shadow-xs focus-ring"
        >
          <span>{buttonLabel}</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </section>
  );
}

