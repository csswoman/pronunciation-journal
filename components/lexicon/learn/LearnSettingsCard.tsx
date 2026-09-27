import { useState } from "react";

// Planned structure:
// <LearnSettingsCard>
//   <div (Card Container)>
//     <span (Header Kicker)>
//     <div (Setting Row: Nuevas por día + Stepper)>
//       <button (-)>
//       <span (Number Value)>
//       <button (+)>
//   </div>
// </LearnSettingsCard>

interface LearnSettingsCardProps {
  initialNewCardsPerDay?: number;
  onChangeNewCardsPerDay?: (val: number) => void;
}

export function LearnSettingsCard({
  initialNewCardsPerDay = 5,
  onChangeNewCardsPerDay,
}: LearnSettingsCardProps) {
  const [val, setVal] = useState(initialNewCardsPerDay);

  const handleDecrease = () => {
    const next = Math.max(1, val - 1);
    setVal(next);
    onChangeNewCardsPerDay?.(next);
  };

  const handleIncrease = () => {
    const next = Math.min(20, val + 1);
    setVal(next);
    onChangeNewCardsPerDay?.(next);
  };

  return (
    <div className="rounded-2xl bg-surface-raised border border-border-subtle/80 p-5 shadow-2xs space-y-3">
      <h4 className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
        AJUSTES
      </h4>

      <div className="flex items-center justify-between gap-4 pt-1">
        <span className="text-body-sm font-bold text-fg">
          Nuevas por día
        </span>

        <div className="flex items-center gap-2 select-none">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={val <= 1}
            aria-label="Disminuir tarjetas nuevas por día"
            className="h-8 w-8 rounded-full border border-border-subtle/80 bg-surface-raised hover:bg-surface-sunken flex items-center justify-center font-bold text-fg disabled:opacity-40 transition-all focus-ring text-body-sm"
          >
            -
          </button>

          <span className="font-mono font-bold text-body text-fg px-1 min-w-[20px] text-center">
            {val}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={val >= 20}
            aria-label="Aumentar tarjetas nuevas por día"
            className="h-8 w-8 rounded-full border border-border-subtle/80 bg-surface-raised hover:bg-surface-sunken flex items-center justify-center font-bold text-fg disabled:opacity-40 transition-all focus-ring text-body-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
