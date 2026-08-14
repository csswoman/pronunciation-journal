"use client";

// Planned structure:
// <ThemeControls />   — hue slider + reset + light/dark
// <SoundControls />   — enable switch + volume
// <StudyLevelControls /> — CEFR A1–C2

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { useUISoundsStore } from "@/lib/stores/uiSoundsStore";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";
import { Moon, RotateCcw, Sun, Target, Volume2 } from "@/components/icons";
import ContentLevelSelector from "@/components/ui/ContentLevelSelector";

export function ThemeControls({ className }: { className?: string } = {}) {
  const { hue, setHue, resetHue, mode, toggleMode, mounted } = useOKLCHTheme();
  if (!mounted) return null;

  return (
    <section className={cn("border-t border-border-subtle py-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-kicker text-fg-muted">Tema</p>
        <span className="text-tiny tabular-nums text-fg-subtle" aria-hidden>
          {hue}°
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          aria-label="Color del tema"
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={(event) => setHue(Number(event.target.value))}
          className="color-selection-slider min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={resetHue}
          aria-label="Restablecer color del tema"
          className="focus-ring grid size-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-sunken"
        >
          <RotateCcw size={15} aria-hidden />
        </button>
        <button
          type="button"
          onClick={toggleMode}
          aria-label={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="focus-ring grid size-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-sunken"
        >
          {mode === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        </button>
      </div>
    </section>
  );
}

export function SoundControls({ className }: { className?: string } = {}) {
  const enabled = useUISoundsStore((state) => state.soundEnabled);
  const volume = useUISoundsStore((state) => state.volume);
  const setEnabled = useUISoundsStore((state) => state.setSoundEnabled);
  const setVolume = useUISoundsStore((state) => state.setVolume);
  const percent = Math.round(volume * 100);

  return (
    <section className={cn("border-t border-border-subtle py-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-kicker text-fg-muted">
          <Volume2 size={15} aria-hidden />
          Sonidos
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Activar sonidos de la app"
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "focus-ring h-6 w-10 rounded-full p-0.5 transition-colors",
            enabled ? "bg-primary" : "bg-surface-sunken",
          )}
        >
          <span
            className={cn(
              "block size-5 rounded-full bg-surface-raised transition-transform",
              enabled && "translate-x-4",
            )}
          />
        </button>
      </div>
      <div className={cn("flex items-center gap-3", !enabled && "opacity-50")}>
        <input
          aria-label="Volumen de la app"
          type="range"
          min="0"
          max="100"
          step="5"
          disabled={!enabled}
          value={percent}
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
          className="sound-volume-slider min-w-0 flex-1"
          style={{ "--sound-volume": `${percent}%` } as CSSProperties}
        />
        <span className="w-9 text-right text-tiny tabular-nums text-fg-muted">{percent}%</span>
      </div>
    </section>
  );
}

export function StudyLevelControls({
  level,
  onChange,
  className,
  footer,
}: {
  level: CefrLevel;
  onChange: (next: CefrLevel) => void;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <section className={cn("border-t border-border-subtle py-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Target size={15} className="text-fg-subtle" aria-hidden />
        <p className="font-kicker text-fg-muted">Tu nivel</p>
      </div>
      <ContentLevelSelector
        levels={CEFR_LEVELS}
        value={level}
        onChange={onChange}
        ariaLabel="Nivel de estudio"
      />
      {footer}
    </section>
  );
}
