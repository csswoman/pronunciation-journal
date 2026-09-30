// Planned structure:
// <SkillsBalanceHighlights>
//   <HighlightTile "MÁS CONSOLIDADA" />
//   <HighlightTile "A PRIORIZAR EN TU PRÁCTICA" />
// </SkillsBalanceHighlights>
// Falls back to an insufficient-evidence note when no skill has a score.

interface HighlightSkill {
  label: string;
  val: number;
}

interface Props {
  best?: HighlightSkill;
  worst?: HighlightSkill;
}

export function SkillsBalanceHighlights({ best, worst }: Props) {
  if (!best || !worst) {
    return (
      <div className="mt-6 rounded-2xl bg-white/60 p-4 text-center text-sm font-medium text-ink-secondary">
        Necesitas más práctica variada para ver fortalezas y áreas de mejora.
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
      <div className="rounded-2xl bg-white/85 p-4 shadow-xs transition-all hover:bg-white hover:shadow-sm">
        <span className="font-kicker text-xs font-bold uppercase tracking-wider text-ink-secondary block">
          MÁS CONSOLIDADA
        </span>
        <span className="font-display text-base sm:text-lg font-extrabold text-ink mt-0.5 block">
          {best.label} · {best.val} pts
        </span>
      </div>

      <div className="rounded-2xl bg-butter p-4 shadow-xs transition-all hover:brightness-105 hover:shadow-sm">
        <span className="font-kicker text-xs font-bold uppercase tracking-wider text-ink-secondary block">
          A PRIORIZAR EN TU PRÁCTICA
        </span>
        <span className="font-display text-base sm:text-lg font-extrabold text-ink mt-0.5 block">
          {worst.label} · {worst.val} pts
        </span>
      </div>
    </div>
  );
}
