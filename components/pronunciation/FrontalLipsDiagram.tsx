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

interface Props {
  guide: PhonemeArticulationGuide;
}

function LipShapeContent({ guide }: Props) {
  switch (guide.lipShape) {
    case "teeth-on-lip":
      return <FrontalLipsTeethOnLip />;
    case "tongue-between-teeth":
      return <FrontalLipsTongueBetweenTeeth />;
    case "rounded":
      return <FrontalLipsRounded guide={guide} />;
    case "spread":
      return <FrontalLipsSpread />;
    case "closed":
      return <FrontalLipsClosed />;
    default:
      return <FrontalLipsNeutral guide={guide} />;
  }
}

export function FrontalLipsDiagram({ guide }: Props) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 180 110"
      className="h-28 w-full max-w-[170px] overflow-visible select-none"
      aria-label={`Forma frontal de los labios para ${guide.symbol}`}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--surface-sunken)" />
          <stop offset="100%" stopColor="var(--surface-base)" />
        </radialGradient>
      </defs>
      <LipShapeContent guide={guide} />
    </svg>
  );
}
