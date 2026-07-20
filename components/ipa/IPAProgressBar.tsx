"use client";

import { Undo2 } from "@/components/icons";

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
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const safeExplored = Number.isFinite(explored)
    ? Math.max(0, Math.min(explored, safeTotal))
    : 0;
  const pct = safeTotal === 0 ? 0 : Math.round((safeExplored / safeTotal) * 100);

  return (
    <div className="ipa-chart__progress">
      <b className="ipa-chart__progress-count">{safeExplored}</b>
      <span>/ {safeTotal} sonidos explorados hoy</span>
      <div
        className="ipa-chart__progress-bar"
        role="progressbar"
        aria-label="Sonidos explorados hoy"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
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
          disabled={safeExplored === 0}
          className="ipa-chart__progress-reset"
        >
          Reiniciar
        </button>
      )}
    </div>
  );
}
