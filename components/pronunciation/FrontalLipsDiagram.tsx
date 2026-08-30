"use client";

import { useId } from "react";
import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import {
  FrontalLipsClosed,
  FrontalLipsNeutral,
  FrontalLipsRounded,
  FrontalLipsSpread,
  FrontalLipsTeethOnLip,
  FrontalLipsTongueBetweenTeeth,
} from "./FrontalLipsShapes";

// Planned structure:
// <FrontalLipsDiagram>
//   <defs />
//   <FrontalLipsTeethOnLip | … | FrontalLipsNeutral />
// </FrontalLipsDiagram>

import { cn } from "@/lib/cn";

interface Props {
  guide: PhonemeArticulationGuide;
  isAnimating?: boolean;
  speed?: "normal" | "slow";
}

function LipShapeContent({ guide }: { guide: PhonemeArticulationGuide }) {
  switch (guide.lipShape) {
    case "teeth-on-lip":
      return <FrontalLipsTeethOnLip />;
    case "tongue-between-teeth":
      return <FrontalLipsTongueBetweenTeeth />;
    case "rounded":
      return <FrontalLipsRounded guide={guide} />;
    case "spread":
      return <FrontalLipsSpread guide={guide} />;
    case "closed":
      return <FrontalLipsClosed />;
    default:
      return <FrontalLipsNeutral guide={guide} />;
  }
}

// Sub-components: FrontalLipsDiagram SVG canvas, radialGradient defs, LipShapeContent router
export function FrontalLipsDiagram({ guide, isAnimating = true, speed = "normal" }: Props) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 200 120"
      className="h-32 w-full max-w-[190px] overflow-visible select-none"
      aria-label={`Forma frontal de los labios para ${guide.symbol}`}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--surface-sunken)" />
          <stop offset="100%" stopColor="var(--surface-base)" />
        </radialGradient>
      </defs>
      <g
        className={cn(
          isAnimating && (speed === "slow" ? "animate-mouth-breathe-slow" : "animate-mouth-breathe"),
        )}
      >
        <LipShapeContent guide={guide} />
      </g>
    </svg>
  );
}
