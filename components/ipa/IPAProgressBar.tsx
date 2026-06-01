"use client";

import { Undo2 } from "lucide-react";

export default function IPAProgressBar({
  explored,
  total,
  onReset,
  undoAvailable = false,
  onUndo,
}: {
  explored: number;
  total: number;
  onReset: () => void;
  undoAvailable?: boolean;
  onUndo?: () => void;
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((explored / total) * 100));

  return (
    <div className="ipa-chart__progress">
      <b className="ipa-chart__progress-count">{explored}</b>
      <span>/ {total} sonidos explorados hoy</span>
      <div className="ipa-chart__progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className="ipa-chart__progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums">{pct}%</span>

      {undoAvailable && onUndo ? (
        <button type="button" onClick={onUndo} className="ipa-chart__progress-undo">
          <Undo2 size={12} aria-hidden />
          Deshacer
        </button>
      ) : (
        <button
          type="button"
          onClick={onReset}
          disabled={explored === 0}
          className="ipa-chart__progress-reset"
        >
          Reiniciar
        </button>
      )}
    </div>
  );
}
