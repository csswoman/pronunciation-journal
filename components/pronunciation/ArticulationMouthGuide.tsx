"use client";

// Planned structure:
// <ArticulationMouthGuide>
//   <Header /> — IPA symbol, name, manner/place, voiced badge
//   <SagittalPanel> → <SagittalDiagram />
//   <FrontalPanel> → <FrontalLipsDiagram />
//   <VisualCue />
// </ArticulationMouthGuide>

import { useMemo } from "react";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { cn } from "@/lib/cn";
import { SagittalDiagram } from "./SagittalDiagram";
import { FrontalLipsDiagram } from "./FrontalLipsDiagram";

interface Props {
  symbolOrIpa: string;
  className?: string;
  compact?: boolean;
}

function jawOpeningLabel(jaw: "narrow" | "medium" | "wide"): string {
  if (jaw === "wide") return "Muy abierta";
  if (jaw === "medium") return "Media";
  return "Estrecha";
}

export function ArticulationMouthGuide({ symbolOrIpa, className, compact = false }: Props) {
  const guide = useMemo(() => getArticulationGuide(symbolOrIpa), [symbolOrIpa]);

  if (!guide) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border-default bg-surface-raised p-4 transition-colors",
        compact && "p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-ipa text-h2 font-bold text-primary">{guide.symbol}</span>
          <div>
            <p className="text-body-sm font-semibold text-fg">{guide.nameEs}</p>
            <p className="font-caption text-fg-muted">{guide.mannerEs} · {guide.placeEs}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-caption text-xs font-semibold",
              guide.vocalCordsVibrate
                ? "bg-warning-soft text-warning border border-warning/30"
                : "bg-surface-sunken text-fg-muted border border-border-subtle",
            )}
          >
            {guide.vocalCordsVibrate ? "⚡ Con voz (sonoro)" : "Sordo (sin voz)"}
          </span>
        </div>
      </div>

      <div className={cn("grid gap-3 pt-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        <div className="flex flex-col items-center justify-between rounded-xl border border-border-subtle bg-surface-sunken p-3">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="font-caption text-xs font-bold uppercase tracking-wider text-fg-muted">
              Perfil: Lengua y Paladar
            </span>
            <span className="font-caption text-[11px] text-primary font-medium">
              Corte lateral
            </span>
          </div>

          <SagittalDiagram guide={guide} />

          <div className="mt-2 w-full flex items-center justify-between pt-1.5 border-t border-border-subtle/50 text-[11px] font-caption text-fg-muted">
            <span>Punto: <strong className="text-fg font-medium">{guide.placeEs}</strong></span>
            <span>{guide.tonguePosition.replace("-", " ")}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between rounded-xl border border-border-subtle bg-surface-sunken p-3">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="font-caption text-xs font-bold uppercase tracking-wider text-fg-muted">
              Frente: Labios y Dientes
            </span>
            <span className="font-caption text-[11px] text-primary font-medium">
              Vista frontal
            </span>
          </div>

          <FrontalLipsDiagram guide={guide} />

          <div className="mt-2 w-full flex items-center justify-between pt-1.5 border-t border-border-subtle/50 text-[11px] font-caption text-fg-muted">
            <span>Forma: <strong className="text-fg font-medium capitalize">{guide.lipShape.replace("-", " ")}</strong></span>
            <span>Apertura: <strong className="text-fg font-medium">{jawOpeningLabel(guide.jawOpening)}</strong></span>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-primary/20 bg-surface-base p-3">
        <p className="font-label text-xs font-semibold text-primary flex items-center gap-1.5 mb-1">
          <span>💡</span>
          <span>Instrucción de colocación</span>
        </p>
        <p className="text-body-sm text-fg text-pretty">
          {guide.visualCueEs}
        </p>
      </div>
    </div>
  );
}
