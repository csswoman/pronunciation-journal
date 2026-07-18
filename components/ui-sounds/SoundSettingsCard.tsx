"use client";

// Planned structure:
// <SoundSettingsCard>
//   <SoundEnableToggle />   — enable/disable app sounds
//   <SoundVolumeSlider />   — 0–100% loudness, previews on change
// </SoundSettingsCard>

import { useUISoundsStore } from "@/lib/stores/uiSoundsStore";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { cn } from "@/lib/cn";

function SoundEnableToggle() {
  const soundEnabled = useUISoundsStore((s) => s.soundEnabled);
  const setSoundEnabled = useUISoundsStore((s) => s.setSoundEnabled);

  const handleToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playUiCue("correct");
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-fg">Sonidos de la app</p>
        <p className="text-xs text-fg-muted">Feedback de aciertos, errores y toques.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        aria-label="Activar sonidos de la app"
        onClick={handleToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          soundEnabled ? "bg-[var(--primary)]" : "bg-[var(--bg-tertiary)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[var(--on-primary)] shadow transition-transform",
            soundEnabled && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function SoundVolumeSlider() {
  const soundEnabled = useUISoundsStore((s) => s.soundEnabled);
  const volume = useUISoundsStore((s) => s.volume);
  const setVolume = useUISoundsStore((s) => s.setVolume);

  const percent = Math.round(volume * 100);

  return (
    <div className={cn("space-y-2", !soundEnabled && "opacity-50")}>
      <div className="flex items-center justify-between">
        <label htmlFor="sound-volume" className="text-sm font-medium text-fg">
          Volumen
        </label>
        <span className="text-xs font-semibold tabular-nums text-fg-muted">{percent}%</span>
      </div>
      <input
        id="sound-volume"
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={!soundEnabled}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        onPointerUp={() => soundEnabled && playUiCue("correct")}
        onKeyUp={() => soundEnabled && playUiCue("correct")}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  );
}

/** Device-level sound preferences (enable + volume), persisted locally. */
export default function SoundSettingsCard() {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072M19.07 4.93a10 10 0 010 14.14M6.343 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2.343l4.243 4.243A1 1 0 0012 18.586V5.414a1 1 0 00-1.414-.707L6.343 9z"
          />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest text-fg-subtle">Sonido</span>
      </div>
      <SoundEnableToggle />
      <div className="border-t border-[var(--border)] pt-4">
        <SoundVolumeSlider />
      </div>
    </div>
  );
}
