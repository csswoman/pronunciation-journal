"use client";

import { useId, useMemo } from "react";
import type {
  PhonemeArticulationGuide,
  TonguePosition,
} from "@/lib/pronunciation/articulation-guide-data";
import { getTongueGeometry } from "@/lib/pronunciation/sagittal-tongue-geometry";
import { cn } from "@/lib/cn";

// Planned structure:
// <SagittalDiagram>
//   <defs />               — tongue fill gradient
//   <HeadProfile />        — silhouette + oral cavity
//   <PalateAndTeeth />     — hard palate, velum, incisors
//   <ReferenceTongue />    — dashed outline of the contrasting sound
//   <TongueBody />         — active tongue + contact point
//   <Larynx />             — voicing indicator
// </SagittalDiagram>
interface Props {
  guide: PhonemeArticulationGuide;
  isAnimating?: boolean;
  speed?: "normal" | "slow";
  /** Tongue position of the other sound in a contrast, drawn as a dashed ghost. */
  referencePosition?: TonguePosition;
}

export function SagittalDiagram({
  guide,
  isAnimating = true,
  speed = "normal",
  referencePosition,
}: Props) {
  const gradientId = useId();
  const tongue = useMemo(
    () => getTongueGeometry(guide.tonguePosition),
    [guide.tonguePosition],
  );
  const reference = useMemo(
    () =>
      referencePosition && referencePosition !== guide.tonguePosition
        ? getTongueGeometry(referencePosition)
        : null,
    [referencePosition, guide.tonguePosition],
  );

  return (
    <svg
      viewBox="0 0 240 180"
      className="h-32 w-full max-w-[210px] overflow-visible select-none"
      role="img"
      aria-label={`Corte sagital para ${guide.symbol}: ${tongue.label}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--c-pronunciacion)" stopOpacity="0.38" />
          <stop offset="100%" stopColor="var(--c-pronunciacion)" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      {/* 1. Cavidad oral: volumen de aire del tracto vocal */}
      <path
        d="M 48,168 C 44,128 50,84 88,46 C 118,24 158,30 178,46 C 192,58 196,72 196,86 C 196,96 189,103 183,105 C 186,116 178,136 155,149 C 141,158 136,164 136,170 Z"
        className="fill-surface-base stroke-border-subtle"
        strokeWidth="1.5"
      />

      {/* 2. Silueta facial: frente, nariz, labios y mentón */}
      <path
        d="M 163,33 C 177,43 184,53 187,62 C 189,68 200,76 201,80 C 201,84 191,87 186,89 C 186,94 189,97 189,100 C 186,103 181,104 181,107 C 184,110 186,114 184,119 C 180,128 170,138 152,149 C 142,155 137,163 136,170"
        fill="none"
        className="stroke-fg-muted"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Paladar duro (hueso) */}
      <path
        d="M 176,97 C 164,88 143,74 112,74"
        fill="none"
        className="stroke-fg"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* 4. Velo del paladar y úvula */}
      <path
        d="M 112,74 C 94,75 82,84 76,100 C 74,106 70,112 68,108"
        fill="none"
        className={cn(
          "stroke-fg-muted transition-colors",
          guide.tonguePosition === "back-on-velum" && "stroke-primary",
        )}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 5. Incisivo superior */}
      <path
        d="M 176,96 L 174,108 L 168,108 L 169,96 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 6. Incisivo inferior */}
      <path
        d="M 170,125 L 168,112 L 162,112 L 164,125 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 7. Lengua del sonido contrastado, como referencia fantasma */}
      {reference && (
        <path
          d={reference.path}
          fill="none"
          className="stroke-fg-muted/45"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinejoin="round"
        />
      )}

      {/* 8. Cuerpo de la lengua */}
      <g
        className={cn(
          isAnimating && (speed === "slow" ? "animate-tongue-breathe-slow" : "animate-tongue-breathe"),
        )}
      >
        <path
          d={tongue.path}
          fill={`url(#${gradientId})`}
          className="stroke-primary transition-all duration-500 motion-reduce:transition-none"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* 9. Surco medial: da volumen al dorso */}
        <path
          d="M 74,138 Q 104,128 134,133"
          fill="none"
          className="stroke-primary/25"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />

        {/* 10. Punto de articulación: sólo pulsa si hay contacto real */}
        {tongue.isContact && (
          <circle
            cx={tongue.contactX}
            cy={tongue.contactY}
            r="5.5"
            className="fill-primary animate-ping opacity-70 motion-reduce:animate-none"
          />
        )}
        <circle
          cx={tongue.contactX}
          cy={tongue.contactY}
          r="4"
          className="fill-primary stroke-surface-raised transition-all duration-500 motion-reduce:transition-none"
          strokeWidth="1.5"
        />
      </g>

      {/* 11. Laringe: vibración de las cuerdas vocales */}
      {guide.vocalCordsVibrate ? (
        <g className={cn(isAnimating && "animate-pulse")}>
          <rect
            x="46"
            y="146"
            width="12"
            height="20"
            rx="3"
            className="fill-warning-soft stroke-warning"
            strokeWidth="1.5"
          />
          <path
            d="M 42,151 Q 46,156 42,161"
            fill="none"
            className="stroke-warning"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 38,148 Q 44,156 38,164"
            fill="none"
            className="stroke-warning"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g opacity="0.4">
          <rect
            x="46"
            y="146"
            width="12"
            height="20"
            rx="3"
            className="fill-surface-sunken stroke-border-default"
            strokeWidth="1.2"
          />
        </g>
      )}
    </svg>
  );
}
