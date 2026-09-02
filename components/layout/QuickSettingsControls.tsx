"use client";

// Planned structure:
// <QuickSettingsAccordion>
//   <AccordionRow> — Apariencia (light/dark/system segmented)
//   <AccordionRow> — Color del tema (hue preset swatches)
//   <AccordionRow> — Sonidos (mute/exercise/all + volume)
// <StudyLevelControls /> — CEFR A1–C2, used in the profile preferences panel

import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { useOKLCHTheme, type ThemePreference } from "@/hooks/useOKLCHTheme";
import { useUISoundsStore } from "@/lib/stores/uiSoundsStore";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";
import { Check, ChevronDown, Laptop, Moon, Palette, Sun, Target, Volume2 } from "@/components/icons";
import ContentLevelSelector from "@/components/ui/ContentLevelSelector";
import { DEFAULT_HUE_PRESET, HUE_PRESETS, matchesHuePreset, swatchColor } from "@/lib/theme/hue-presets";

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Auto", icon: Laptop },
];

const SOUND_OPTIONS = [
  { val: "off", label: "Mute" },
  { val: "exercise", label: "Ejercicios" },
  { val: "all", label: "Todos" },
] as const;

type AccordionSection = "appearance" | "color" | "sound";

function AccordionRow({
  icon: Icon,
  label,
  value,
  open,
  onToggle,
  children,
}: {
  icon: typeof Sun;
  label: string;
  value: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = useId();
  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="focus-ring press-feedback flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
      >
        <span className="flex items-center gap-2.5">
          <Icon size={16} className="text-fg-subtle" aria-hidden />
          <span className="font-label text-caption font-medium text-fg">{label}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-caption text-tiny text-fg-subtle">{value}</span>
          <ChevronDown
            size={15}
            aria-hidden
            className={cn("shrink-0 text-fg-subtle transition-transform duration-150", open && "rotate-180")}
          />
        </span>
      </button>
      {open && (
        <div id={panelId} className="px-3 pb-3 pt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

export function QuickSettingsAccordion({ className }: { className?: string } = {}) {
  const { hue, setHue, preference, setPreference, mounted } = useOKLCHTheme();
  const soundPreference = useUISoundsStore((state) => state.soundPreference);
  const setSoundPreference = useUISoundsStore((state) => state.setSoundPreference);
  const volume = useUISoundsStore((state) => state.volume);
  const setVolume = useUISoundsStore((state) => state.setVolume);
  const [section, setSection] = useState<AccordionSection | null>("appearance");

  if (!mounted) return null;

  const toggle = (next: AccordionSection) => setSection((current) => (current === next ? null : next));

  const appearanceLabel = APPEARANCE_OPTIONS.find((option) => option.value === preference)?.label ?? "Auto";

  const activePreset = HUE_PRESETS.find((preset) => matchesHuePreset(hue, preset));
  const colorValue = activePreset?.label ?? "Personalizado";
  const colorNote = activePreset === DEFAULT_HUE_PRESET ? "Predeterminado" : null;

  const percent = Math.round(volume * 100);
  const isMuted = soundPreference === "off";
  const soundValue = isMuted
    ? "Silenciado"
    : `${soundPreference === "all" ? "Todos" : "Ejercicios"} · ${percent}%`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border-subtle bg-surface-sunken/40",
        className,
      )}
    >
      <AccordionRow
        icon={Sun}
        label="Apariencia"
        value={appearanceLabel}
        open={section === "appearance"}
        onToggle={() => toggle("appearance")}
      >
        <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-sunken p-1">
          {APPEARANCE_OPTIONS.map(({ value, label, icon: OptionIcon }) => {
            const isSelected = preference === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPreference(value)}
                aria-pressed={isSelected}
                className={cn(
                  "focus-ring flex min-h-8 flex-col items-center justify-center gap-1 rounded-sm font-label text-caption transition-colors",
                  isSelected
                    ? "bg-surface-raised text-fg font-semibold shadow-xs"
                    : "text-fg-subtle hover:text-fg",
                )}
              >
                <OptionIcon size={15} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </AccordionRow>

      <AccordionRow
        icon={Palette}
        label="Color del tema"
        value={colorValue}
        open={section === "color"}
        onToggle={() => toggle("color")}
      >
        {colorNote && (
          <p className="mb-2 text-right font-caption text-tiny text-primary font-semibold">{colorNote}</p>
        )}
        <div className="grid grid-cols-3 justify-items-center gap-2 rounded-lg border border-border-subtle bg-surface-sunken/60 p-2">
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
                  isSelected
                    ? "outline-2 outline-offset-2 outline-primary scale-105"
                    : "hover:scale-110 opacity-85 hover:opacity-100",
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
      </AccordionRow>

      <AccordionRow
        icon={Volume2}
        label="Sonidos"
        value={soundValue}
        open={section === "sound"}
        onToggle={() => toggle("sound")}
      >
        <div className="flex items-center gap-1 rounded-md bg-surface-sunken p-0.5 text-tiny font-medium">
          {SOUND_OPTIONS.map(({ val, label }) => {
            const active = soundPreference === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setSoundPreference(val)}
                className={cn(
                  "press-feedback flex-1 rounded px-2 py-1 transition-colors",
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
        <div
          className={cn(
            "mt-2.5 flex items-center gap-3 transition-opacity duration-150",
            isMuted ? "opacity-35 pointer-events-none" : "opacity-100",
          )}
        >
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
          <span className="w-9 text-right text-tiny tabular-nums text-fg-subtle font-mono">{percent}%</span>
        </div>
      </AccordionRow>
    </div>
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
