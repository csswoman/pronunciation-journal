import { AlignLeft, ChevronLeft, Layers } from "@/components/icons";
import { cn } from "@/lib/cn";

interface StudyHeaderProps {
  deckName: string;
  progress: number;
  currentIndex: number;
  queueLength: number;
  showTip: boolean;
  onClose: () => void;
  onToggleTip: () => void;
}

export function StudyHeader({
  deckName,
  currentIndex,
  queueLength,
  showTip,
  onClose,
  onToggleTip,
}: StudyHeaderProps) {
  const segments = Math.max(queueLength, 1);

  return (
    <div className="flex items-center justify-between gap-3 pb-4 border-b border-border-subtle select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver"
          className="focus-ring flex size-9 items-center justify-center rounded-full bg-surface-sunken hover:bg-surface-raised border border-border-default text-fg transition-colors shrink-0"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-border-default bg-surface-sunken px-3 py-1.5 shadow-2xs">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Layers size={14} />
          </div>
          <span className="font-heading text-body-sm font-bold text-fg truncate max-w-[160px] sm:max-w-[240px]">
            {deckName}
          </span>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="hidden sm:flex flex-1 items-center gap-1 px-4 max-w-xl">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300",
              i <= currentIndex ? "bg-primary" : "bg-surface-sunken border border-border-subtle/60"
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-sans text-body-sm font-bold text-fg">
          {currentIndex + 1} <span className="font-normal text-fg-muted">de</span> {queueLength}
        </span>

        <button
          type="button"
          onClick={onToggleTip}
          className={cn(
            "focus-ring hidden md:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-sans text-caption font-bold border transition-colors",
            showTip
              ? "bg-surface-raised text-fg border-border-strong"
              : "bg-surface-sunken hover:bg-surface-raised text-fg-muted border-border-default"
          )}
        >
          <AlignLeft size={14} />
          <span>Panel</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-sans text-caption font-bold bg-surface-sunken hover:bg-surface-raised border border-border-default text-fg transition-colors"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
