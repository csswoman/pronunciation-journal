"use client";

import { cn } from "@/lib/cn";
import { Pause, Play, Timer } from "@/components/icons";

// Sub-components: play/pause toggle, speed toggle
interface Props {
  isAnimating: boolean;
  onToggleAnimating: () => void;
  speed: "normal" | "slow";
  onToggleSpeed: () => void;
}

/** Single playback control shared by both sounds of a contrast, so the two
 *  mouth diagrams always move in sync. */
export function ContrastControlBar({
  isAnimating,
  onToggleAnimating,
  speed,
  onToggleSpeed,
}: Props) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken p-0.5">
      <button
        type="button"
        onClick={onToggleAnimating}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-caption text-xs transition-colors",
          isAnimating
            ? "bg-primary-soft text-primary font-semibold"
            : "text-fg-muted hover:text-fg",
        )}
        aria-pressed={isAnimating}
        aria-label={isAnimating ? "Pausar ambas animaciones" : "Reproducir ambas animaciones"}
      >
        {isAnimating ? <Pause size={12} aria-hidden /> : <Play size={12} aria-hidden />}
        <span>{isAnimating ? "Animando" : "Pausado"}</span>
      </button>

      <button
        type="button"
        onClick={onToggleSpeed}
        disabled={!isAnimating}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-2 py-1 font-caption text-xs transition-colors",
          speed === "slow"
            ? "bg-primary text-on-primary font-semibold"
            : "text-fg-muted hover:text-fg",
          !isAnimating && "opacity-40 cursor-not-allowed",
        )}
        aria-label={speed === "slow" ? "Cámara lenta activa" : "Activar cámara lenta"}
      >
        <Timer size={11} aria-hidden />
        <span>{speed === "slow" ? "0.5x" : "1.0x"}</span>
      </button>
    </div>
  );
}
