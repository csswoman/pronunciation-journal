"use client";

// Planned structure:
// <ThemeControls />   — hue slider + reset + light/dark
// <SoundControls />   — enable switch + volume
// <StudyLevelControls /> — CEFR A1–C2

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useOKLCHTheme, type ThemePreference } from "@/hooks/useOKLCHTheme";
import { useUISoundsStore } from "@/lib/stores/uiSoundsStore";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";
import { Check, Laptop, Moon, Sun, Target, Volume2 } from "@/components/icons";
import ContentLevelSelector from "@/components/ui/ContentLevelSelector";
import { DEFAULT_HUE_PRESET, HUE_PRESETS, matchesHuePreset, swatchColor } from "@/lib/theme/hue-presets";

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Auto", icon: Laptop },
];

export function ThemeControls({ className }: { className?: string } = {}) {
  const { hue, setHue, preference, setPreference, mounted } = useOKLCHTheme();
  if (!mounted) return null;

  const activePreset = HUE_PRESETS.find((preset) => matchesHuePreset(hue, preset));

  return (
    <section className={cn("border-t border-border-subtle py-3", className)}>
      <p className="mb-2.5 font-kicker text-fg-muted">Color del tema</p>
      <div className="mb-1.5 flex flex-wrap gap-2">
        {HUE_PRESETS.map((preset) => {
          const isSelected = matchesHuePreset(hue, preset);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => setHue(preset.hue)}
              aria-label={preset.label}
              aria-pressed={isSelected}
              title={preset.label}
              className={cn(
                "focus-ring grid size-8 shrink-0 place-items-center rounded-full transition-transform",
                isSelected ? "outline-2 outline-offset-2 outline-primary" : "hover:scale-110",
              )}
              style={{
                backgroundColor: swatchColor(preset),
                outlineColor: isSelected ? swatchColor(preset) : undefined,
              }}
            >
              {isSelected && (
                <Check size={14} className="text-(--on-swatch)" aria-hidden strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>
      <p className="font-caption text-fg-subtle">
        {activePreset
          ? activePreset === DEFAULT_HUE_PRESET
            ? `${activePreset.label} · predeterminado`
            : activePreset.label
          : "Personalizado"}
      </p>

      <p className="mb-2 mt-3 font-kicker text-fg-muted">Apariencia</p>
      <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-sunken p-1">
        {APPEARANCE_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isSelected = preference === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPreference(value)}
              aria-pressed={isSelected}
              className={cn(
                "focus-ring flex min-h-9 items-center justify-center gap-1.5 rounded-sm font-label transition-colors",
                isSelected
                  ? "bg-surface-raised text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SoundControls({ className }: { className?: string } = {}) {
  const soundPreference = useUISoundsStore((state) => state.soundPreference);
  const setSoundPreference = useUISoundsStore((state) => state.setSoundPreference);
  const volume = useUISoundsStore((state) => state.volume);
  const setVolume = useUISoundsStore((state) => state.setVolume);
  const percent = Math.round(volume * 100);
  const isMuted = soundPreference === "off";

  return (
    <section className={cn("border-t border-border-subtle py-3 space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-kicker text-fg-muted">
          <Volume2 size={15} aria-hidden />
          Sonidos
        </span>
        <div className="flex items-center gap-1 rounded-md bg-surface-sunken p-0.5 text-tiny font-medium">
          {(
            [
              { val: "off", label: "Mute" },
              { val: "exercise", label: "Ejercicios" },
              { val: "all", label: "Todos" },
            ] as const
          ).map(({ val, label }) => {
            const active = soundPreference === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSoundPreference(val)}
                className={cn(
                  "press-feedback rounded px-2 py-0.5 transition-colors",
                  active
                    ? "bg-surface-raised font-semibold text-primary shadow-xs"
                    : "text-fg-subtle hover:text-fg",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className={cn("flex items-center gap-3", isMuted && "opacity-50 pointer-events-none")}>
        <input
          aria-label="Volumen de la app"
          type="range"
          min="0"
          max="100"
          step="5"
          disabled={isMuted}
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
