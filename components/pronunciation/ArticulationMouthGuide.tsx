"use client";

import { useState, useMemo } from "react";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import type { TonguePosition } from "@/lib/pronunciation/articulation-guide-data";
import type { ContrastDimension } from "@/lib/pronunciation/articulation-contrast";
import { cn } from "@/lib/cn";
import { Lightbulb, Pause, Play, Sparkles, Timer } from "@/components/icons";
import { SagittalDiagram } from "./SagittalDiagram";
import { FrontalLipsDiagram } from "./FrontalLipsDiagram";

// Planned structure:
// <ArticulationMouthGuide>
//   <GuideHeader />          — symbol, name, voicing badge
//   <AnimationControls />    — only when uncontrolled
//   <DiagramPanel x2 />      — sagittal + frontal
//   <ArticulationTip />
// </ArticulationMouthGuide>
interface Props {
  symbolOrIpa: string;
  className?: string;
  compact?: boolean;
  /** When provided, the parent owns playback and the local controls are hidden. */
  isAnimating?: boolean;
  speed?: "normal" | "slow";
  /** Articulatory dimensions to visually flag as the contrast difference. */
  highlight?: ReadonlySet<ContrastDimension>;
  /** Hides the placement instruction when the parent renders it once for both sounds. */
  hideCue?: boolean;
  /** Tongue position of the contrasting sound, drawn as a dashed reference outline. */
  referencePosition?: TonguePosition;
}

function jawOpeningLabel(jaw: "narrow" | "medium" | "wide"): string {
  if (jaw === "wide") return "Muy abierta";
  if (jaw === "medium") return "Media";
  return "Estrecha";
}

const EMPTY_HIGHLIGHT: ReadonlySet<ContrastDimension> = new Set<ContrastDimension>();

export function ArticulationMouthGuide({
  symbolOrIpa,
  className,
  compact = false,
  isAnimating: controlledAnimating,
  speed: controlledSpeed,
  highlight = EMPTY_HIGHLIGHT,
  hideCue = false,
  referencePosition,
}: Props) {
  const guide = useMemo(() => getArticulationGuide(symbolOrIpa), [symbolOrIpa]);
  const [localAnimating, setLocalAnimating] = useState(true);
  const [localSpeed, setLocalSpeed] = useState<"normal" | "slow">("normal");

  const isControlled = controlledAnimating !== undefined;
  const isAnimating = isControlled ? controlledAnimating : localAnimating;
  const speed = controlledSpeed ?? localSpeed;

  if (!guide) {
    return null;
  }

  const tongueChanged = highlight.has("tongue");
  const lipsChanged = highlight.has("lips") || highlight.has("jaw");

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-border-default bg-surface-raised p-4 transition-colors",
        compact && "p-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-ipa text-h2 font-bold text-primary whitespace-nowrap">
            {guide.symbol}
          </span>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-fg truncate">{guide.nameEs}</p>
            <p className="font-caption text-fg-muted">{guide.mannerEs}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isControlled && (
            <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken p-0.5">
              <button
                type="button"
                onClick={() => setLocalAnimating((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-caption text-xs transition-colors",
                  isAnimating
                    ? "bg-primary-soft text-primary font-semibold"
                    : "text-fg-muted hover:text-fg",
                )}
                title={isAnimating ? "Pausar animación de boca" : "Reproducir animación de boca"}
                aria-label={isAnimating ? "Pausar animación" : "Reproducir animación"}
              >
                {isAnimating ? <Pause size={12} aria-hidden /> : <Play size={12} aria-hidden />}
                <span>{isAnimating ? "Animando" : "Pausado"}</span>
              </button>

              {isAnimating && (
                <button
                  type="button"
                  onClick={() => setLocalSpeed((prev) => (prev === "normal" ? "slow" : "normal"))}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-caption text-xs transition-colors",
                    speed === "slow"
                      ? "bg-primary text-on-primary font-semibold"
                      : "text-fg-muted hover:text-fg",
                  )}
                  title={speed === "slow" ? "Velocidad lenta activa (0.5x)" : "Cambiar a cámara lenta (0.5x)"}
                  aria-label={speed === "slow" ? "Velocidad lenta 0.5x" : "Velocidad normal 1.0x"}
                >
                  <Timer size={11} aria-hidden />
                  <span>{speed === "slow" ? "0.5x" : "1.0x"}</span>
                </button>
              )}
            </div>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-caption text-xs font-semibold whitespace-nowrap",
              guide.vocalCordsVibrate
                ? "bg-warning-soft text-warning border border-warning/30"
                : "bg-surface-sunken text-fg-muted border border-border-subtle",
              highlight.has("voicing") && "ring-2 ring-primary/40",
            )}
          >
            {guide.vocalCordsVibrate ? (
              <>
                <Sparkles size={12} className="text-warning shrink-0" aria-hidden />
                <span>Con voz (sonoro)</span>
              </>
            ) : (
              <span>Sordo (sin voz)</span>
            )}
          </span>
        </div>
      </div>

      <div className={cn("grid gap-3 pt-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        <div
          className={cn(
            "flex flex-col items-center justify-between rounded-md border bg-surface-sunken p-3 transition-colors",
            tongueChanged ? "border-primary/45" : "border-border-subtle",
          )}
        >
          <div className="w-full flex items-center justify-between mb-1">
            <span className="font-kicker text-fg-subtle">Perfil: lengua y paladar</span>
            {tongueChanged && (
              <span className="font-caption text-[11px] font-semibold text-primary animate-contrast-flag">
                Aquí cambia
              </span>
            )}
          </div>

          <SagittalDiagram
            guide={guide}
            isAnimating={isAnimating}
            speed={speed}
            referencePosition={referencePosition}
          />

          <div className="mt-2 w-full flex items-center justify-between gap-2 pt-1.5 border-t border-border-subtle/50 text-[11px] font-caption text-fg-muted">
            <span className="capitalize">{guide.tonguePosition.replace(/-/g, " ")}</span>
            {referencePosition && referencePosition !== guide.tonguePosition && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <svg width="14" height="4" aria-hidden className="shrink-0">
                  <line
                    x1="0"
                    y1="2"
                    x2="14"
                    y2="2"
                    className="stroke-fg-muted/60"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
                <span>el otro sonido</span>
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col items-center justify-between rounded-md border bg-surface-sunken p-3 transition-colors",
            lipsChanged ? "border-primary/45" : "border-border-subtle",
          )}
        >
          <div className="w-full flex items-center justify-between mb-1">
            <span className="font-kicker text-fg-subtle">Frente: labios y dientes</span>
            {lipsChanged && (
              <span className="font-caption text-[11px] font-semibold text-primary animate-contrast-flag">
                Aquí cambia
              </span>
            )}
          </div>

          <FrontalLipsDiagram guide={guide} isAnimating={isAnimating} speed={speed} />

          <div className="mt-2 w-full flex items-center justify-between pt-1.5 border-t border-border-subtle/50 text-[11px] font-caption text-fg-muted">
            <span className="capitalize">{guide.lipShape.replace(/-/g, " ")}</span>
            <span>Apertura: {jawOpeningLabel(guide.jawOpening)}</span>
          </div>
        </div>
      </div>

      {!hideCue && (
        <div className="mt-3 rounded-md border border-primary/20 bg-surface-base p-3">
          <p className="font-label text-xs font-semibold text-primary flex items-center gap-1.5 mb-1">
            <Lightbulb size={14} className="text-primary shrink-0" aria-hidden />
            <span>Instrucción de colocación</span>
          </p>
          <p className="text-body-sm text-fg text-pretty">{guide.visualCueEs}</p>
        </div>
      )}
    </div>
  );
}
