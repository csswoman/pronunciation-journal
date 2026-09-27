import Link from "next/link";
import PastelCard from "@/components/layout/PastelCard";
import { getIllustration } from "@/lib/illustrations/registry";
import type { LessonViewModel } from "@/lib/lexicon/types";

// Planned structure:
// <LexiconTodayPanel>
//   <PastelCard tone="coral">
//     <div (Content Column)>
//       <div (Badge Row: Dark Kicker + Translucent Time Pill)>
//       <h2 (Dark Title in Bricolage)>
//       <p (Dark Description)>
//       <div (Chips Row: White Pills + Dark Text)>
//       <Link (Action CTA)>
//     <div (Illustration Column: Dark Line Art)>
//   </PastelCard>
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

  const kickerBadge = progressUnavailable
    ? "DICCIONARIO EN VIVO"
    : hasReview
    ? "REPASO DE HOY"
    : "RUTA SUGERIDA";

  const estMinutes = Math.max(1, Math.ceil(dueForReview * 0.2));
  const timeBadge = progressUnavailable ? null : `unos ${estMinutes} min`;

  const title = progressUnavailable
    ? "Explora el diccionario mientras cargamos tu progreso"
    : hasReview
    ? `${dueForReview} ${dueForReview === 1 ? "palabra te espera" : "palabras te esperan"}`
    : nextLesson
    ? nextLesson.progress > 0
      ? `Continúa con ${nextLesson.title}`
      : `Empieza con ${nextLesson.title}`
    : "Elige una categoría para empezar";

  const description = progressUnavailable
    ? "Puedes consultar cualquier término o buscar por tema."
    : hasReview
    ? "Las que falles vuelven a tu cola mañana."
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
  const Illustration = getIllustration("domainSpeaking");

  return (
    <PastelCard
      tone="coral"
      className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden p-6 sm:p-7 shadow-xs transition-all duration-200"
      aria-labelledby="words-today-title"
    >
      <div className="space-y-3 flex-1 min-w-0 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-stone-900 text-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
            {kickerBadge}
          </span>
          {timeBadge ? (
            <span className="inline-flex items-center rounded-full bg-stone-900/10 text-stone-900 px-3 py-1 text-xs font-semibold">
              {timeBadge}
            </span>
          ) : null}
        </div>

        <h2 id="words-today-title" className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-body-sm text-stone-800/90 font-medium leading-relaxed max-w-xl">{description}</p>

        {hasReview && visibleChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {visibleChips.map((word) => (
              <span
                key={word}
                className="inline-flex items-center px-3 py-1 rounded-full bg-white/80 border border-stone-900/10 text-xs font-semibold text-stone-900 shadow-2xs"
              >
                {word}
              </span>
            ))}
            {remainingCount > 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 border border-stone-900/10 text-xs font-semibold text-stone-800">
                +{remainingCount}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="pt-2">
          <Link
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-body-sm font-bold shadow-xs focus-ring transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{buttonLabel}</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center md:justify-end min-w-[140px] sm:min-w-[180px] z-0">
        <Illustration className="h-32 sm:h-36 w-auto text-stone-900 object-contain pointer-events-none select-none" />
      </div>
    </PastelCard>
  );
}
