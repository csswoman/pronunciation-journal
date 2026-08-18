"use client";

import { useId, useMemo } from "react";
import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { getTongueGeometry } from "@/lib/pronunciation/sagittal-tongue-geometry";
import { cn } from "@/lib/cn";

// Planned structure:
// <SagittalDiagram>
//   <defs /> — vocal tract gradient
//   <HeadSilhouette />
//   <PalateAndTeeth />
//   <TongueBody />
//   <VocalCords />
//   <ContactGlow />
// </SagittalDiagram>

interface Props {
  guide: PhonemeArticulationGuide;
}

export function SagittalDiagram({ guide }: Props) {
  const gradientId = useId();
  const tongueGeometry = useMemo(
    () => getTongueGeometry(guide.tonguePosition),
    [guide.tonguePosition],
  );

  return (
    <svg
      viewBox="0 0 220 165"
      className="h-32 w-full max-w-[210px] overflow-visible select-none"
      aria-label={`Diagrama de articulación para ${guide.symbol}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--surface-sunken)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--surface-base)" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <path
        d="M 28,155 L 28,95 C 28,38 65,18 125,18 C 158,18 178,28 190,50 L 178,60 C 168,48 152,38 125,38 C 82,38 58,55 58,95 L 58,155 Z"
        className="fill-surface-base stroke-border-subtle"
        strokeWidth="1.5"
      />

      <path
        d="M 188,48 C 196,55 204,65 198,72 C 192,76 182,75 178,74 L 174,78 C 172,82 176,86 172,92 C 168,96 158,96 156,105 C 154,115 162,126 162,135 C 162,150 145,155 130,155"
        fill="none"
        className="stroke-border-strong"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M 152,52 C 132,48 105,48 88,52"
        fill="none"
        className="stroke-fg"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <path
        d="M 88,52 C 78,54 70,64 68,76 C 67,82 64,84 62,80"
        fill="none"
        className={cn(
          "stroke-fg-muted transition-colors",
          guide.tonguePosition === "back-on-velum" && "stroke-primary",
        )}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M 152,52 L 156,72 L 149,72 L 146,52 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
      />

      <path
        d="M 148,102 L 152,82 L 145,82 L 142,102 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
      />

      <path
        d={tongueGeometry.path}
        className="fill-primary/30 stroke-primary transition-all duration-300 motion-reduce:transition-none"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M 65,120 Q 95,95 125,85"
        fill="none"
        className="stroke-primary/40"
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />

      {guide.vocalCordsVibrate ? (
        <g className="animate-pulse">
          <rect x="20" y="125" width="14" height="24" rx="4" className="fill-warning-soft stroke-warning" strokeWidth="1.5" />
          <path d="M 16,132 Q 22,137 16,142" fill="none" className="stroke-warning" strokeWidth="2" strokeLinecap="round" />
          <path d="M 12,128 Q 20,137 12,146" fill="none" className="stroke-warning" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ) : (
        <g opacity="0.4">
          <rect x="20" y="125" width="14" height="24" rx="4" className="fill-surface-sunken stroke-border-default" strokeWidth="1" />
        </g>
      )}

      <circle
        cx={tongueGeometry.contactX}
        cy={tongueGeometry.contactY}
        r="5"
        className="fill-primary animate-ping opacity-75 motion-reduce:animate-none"
      />
      <circle
        cx={tongueGeometry.contactX}
        cy={tongueGeometry.contactY}
        r="4"
        className="fill-primary stroke-surface-raised"
        strokeWidth="1.5"
      />

      <text
        x={tongueGeometry.contactX > 110 ? tongueGeometry.contactX - 10 : tongueGeometry.contactX + 10}
        y={tongueGeometry.contactY > 80 ? tongueGeometry.contactY + 16 : tongueGeometry.contactY - 10}
        textAnchor={tongueGeometry.contactX > 110 ? "end" : "start"}
        className="fill-primary font-mono text-[9px] font-bold"
      >
        {tongueGeometry.label}
      </text>
    </svg>
  );
}
