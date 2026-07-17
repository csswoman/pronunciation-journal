import { RotateCcw, Sparkles } from "@/components/icons";

export default function SessionComplete({ mastered, batchSize, onMore, onMoreAI, loadingMore }: { mastered: number; batchSize: number; onMore: () => void; onMoreAI: () => void; loadingMore: boolean; }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[color-mix(in_oklch,var(--score-excellent)_15%,transparent)]">
        <RotateCcw size={20} className="text-[var(--score-excellent)]" />
      </div>
      <div>
        <p className="text-base font-semibold mb-1 text-[var(--fg)]">Session complete</p>
        <p className="text-sm text-[var(--text-secondary)]">{batchSize} phrases done · {mastered} mastered total</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        <button
          onClick={onMoreAI}
          disabled={loadingMore}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-60 bg-[var(--primary)] text-[var(--primary-foreground)]"
        >
          {loadingMore ? <><Sparkles size={13} className="animate-pulse" /> Generating…</> : <><Sparkles size={13} /> 5 more with AI</>}
        </button>
        <button
          onClick={onMore}
          disabled={loadingMore}
          className="flex items-center justify-center w-full rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-60 bg-[var(--btn-regular-bg)] text-[var(--text-secondary)]"
        >
          5 more phrases
        </button>
      </div>
    </div>
  );
}
