import PastelCard from "@/components/layout/PastelCard";

// Planned structure:
// <LearnHeroSessionCard>
//   <PastelCard tone="lilac">
//     <div (Content Area)>
//       <div (Badge Row)>
//       <h2 (Title in Bricolage)>
//       <p (Subtitle)>
//       <div (CTA Buttons Row)>
//     <div (Right Stat Cards Column)>
//       <div (Stat Card: Repasar)>
//       <div (Stat Card: Nuevas)>
//   </PastelCard>
// </LearnHeroSessionCard>

interface LearnHeroSessionCardProps {
  dueForReview: number;
  newCardsLimit: number;
  activeDecksCount: number;
  onStartSession: () => void;
  onStartReviewOnly: () => void;
}

export function LearnHeroSessionCard({
  dueForReview,
  newCardsLimit,
  activeDecksCount,
  onStartSession,
  onStartReviewOnly,
}: LearnHeroSessionCardProps) {
  const totalSessionCards = dueForReview + newCardsLimit;
  const estMinutes = Math.max(1, Math.ceil(totalSessionCards * 0.4));

  return (
    <PastelCard
      tone="lilac"
      className="group relative flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 sm:p-7 overflow-hidden rounded-3xl shadow-xs transition-all duration-200"
    >
      <div className="space-y-3 flex-1 min-w-0 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-stone-900 text-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
            SESIÓN DE HOY
          </span>
          <span className="inline-flex items-center rounded-full bg-stone-900/10 text-stone-900 px-3 py-1 text-xs font-semibold">
            unos {estMinutes} min
          </span>
        </div>

        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight leading-snug">
          {totalSessionCards} tarjetas, todo en una sesión
        </h2>

        <p className="text-body-sm text-stone-800/90 font-medium leading-relaxed max-w-xl">
          Primero lo que toca repasar, luego las nuevas. Se mezclan tus {activeDecksCount} mazos activos.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onStartSession}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 text-body-sm font-bold shadow-xs focus-ring transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Empezar sesión</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>

          {dueForReview > 0 ? (
            <button
              type="button"
              onClick={onStartReviewOnly}
              className="inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-stone-900 border border-stone-900/10 px-5 py-3 text-body-sm font-bold shadow-2xs focus-ring transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Solo repasar ({dueForReview})
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 min-w-[200px] z-10">
        <div className="flex-1 bg-white/90 rounded-2xl p-4 flex items-center justify-between gap-4 border border-stone-900/5 shadow-2xs">
          <span className="font-display font-extrabold text-3xl text-stone-900">
            {dueForReview}
          </span>
          <div className="text-right">
            <span className="block text-xs font-bold text-stone-900 leading-tight">para repasar</span>
            <span className="block text-[11px] font-medium text-stone-600 leading-tight">vencen hoy</span>
          </div>
        </div>

        <div className="flex-1 bg-white/90 rounded-2xl p-4 flex items-center justify-between gap-4 border border-stone-900/5 shadow-2xs">
          <span className="font-display font-extrabold text-3xl text-stone-900">
            {newCardsLimit}
          </span>
          <div className="text-right">
            <span className="block text-xs font-bold text-stone-900 leading-tight">nuevas</span>
            <span className="block text-[11px] font-medium text-stone-600 leading-tight">límite diario</span>
          </div>
        </div>
      </div>
    </PastelCard>
  );
}
