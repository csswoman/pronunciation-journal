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

      {/* 1. Silueta de la cabeza (cráneo, perfil facial y cuello) */}
      <path
        d="M 36,172 C 36,128 38,94 48,64 C 62,32 94,16 132,16 C 154,16 168,26 176,38 C 182,47 183,56 182,62 C 185,67 196,73 198,77 C 200,81 197,85 191,86 C 188,88 186,91 187,94 C 192,97 192,101 184,104 C 188,107 189,112 182,118 C 179,121 180,124 182,127 C 185,131 184,136 179,141 C 168,148 152,154 144,172 Z"
        className="fill-surface-sunken/40 stroke-fg-muted/40"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 2. Trazo continuo del perfil facial y cuello anterior */}
      <path
        d="M 166,28 C 174,38 181,49 182,62 C 185,67 196,73 198,77 C 200,81 197,85 191,86 C 188,88 186,91 187,94 C 192,97 192,101 184,104 C 188,107 189,112 182,118 C 179,121 180,124 182,127 C 185,131 184,136 179,141 C 168,148 152,154 144,172"
        fill="none"
        className="stroke-fg-muted"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Tracto vocal y pared faríngea posterior */}
      <path
        d="M 54,172 L 54,116 C 54,94 62,82 72,74 C 84,65 106,64 122,64 C 148,64 168,76 176,96 L 168,104 C 158,116 148,138 135,138 C 110,138 78,144 68,172 Z"
        className="fill-surface-base stroke-border-subtle"
        strokeWidth="1.2"
      />

      {/* 4. Paladar duro (hueso) */}
      <path
        d="M 176,97 C 164,88 143,74 112,74"
        fill="none"
        className="stroke-fg"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* 5. Velo del paladar y úvula */}
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

      {/* 6. Incisivo superior */}
      <path
        d="M 176,96 L 174,108 L 168,108 L 169,96 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 7. Incisivo inferior */}
      <path
        d="M 170,125 L 168,112 L 162,112 L 164,125 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 8. Lengua del sonido contrastado, como referencia fantasma */}
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

      {/* 9. Cuerpo de la lengua */}
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

        {/* 10. Surco medial: da volumen al dorso */}
        <path
          d="M 74,138 Q 104,128 134,133"
          fill="none"
          className="stroke-primary/25"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />

        {/* 11. Punto de articulación: sólo pulsa si hay contacto real */}
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

      {/* 12. Laringe y cuerdas vocales anatómicas */}
      {guide.vocalCordsVibrate ? (
        <g className={cn(isAnimating && "animate-pulse")}>
          <ellipse
            cx="54"
            cy="156"
            rx="6"
            ry="9"
            className="fill-warning-soft stroke-warning"
            strokeWidth="1.5"
          />
          <path
            d="M 51,152 Q 54,156 51,160 M 57,152 Q 54,156 57,160"
            fill="none"
            className="stroke-warning"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M 44,151 Q 41,156 44,161"
            fill="none"
            className="stroke-warning/80"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M 39,147 Q 35,156 39,165"
            fill="none"
            className="stroke-warning/50"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g opacity="0.4">
          <ellipse
            cx="54"
            cy="156"
            rx="5"
            ry="8"
            className="fill-surface-sunken stroke-border-default"
            strokeWidth="1.2"
          />
          <path
            d="M 52,152 L 52,160 M 56,152 L 56,160"
            fill="none"
            className="stroke-fg-muted"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
