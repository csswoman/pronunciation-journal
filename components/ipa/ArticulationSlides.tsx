"use client";

// Planned structure:
// <ArticulationTongueSlide />  — sagittal diagram + tongue-only caption + one manner hint
// <ArticulationLipsSlide />    — frontal lips diagram + lips/jaw caption
// <ArticulationStepsSlide />   — numbered how-to steps
// <SlideCaption />             — shared caption + optional hint chip

import { SagittalDiagram } from "@/components/pronunciation/SagittalDiagram";
import { FrontalLipsDiagram } from "@/components/pronunciation/FrontalLipsDiagram";
import { FrontalLipsMotion } from "@/components/pronunciation/FrontalLipsMotion";
import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import type { MotionSpeed } from "@/lib/pronunciation/articulation-motion";
import {
  getLipsCaption,
  getMannerHint,
  getTongueCaption,
} from "@/lib/pronunciation/articulation-copy";

export interface DiagramSlideProps {
  guide: PhonemeArticulationGuide;
  isAnimating: boolean;
  speed: MotionSpeed;
  replayKey: number;
}

function SlideCaption({ title, hint }: { title: string; hint?: string | null }) {
  return (
    <>
      <p className="mt-1 ts-body-lg-strong font-bold text-black">{title}</p>
      {hint && <span className="px-2.5 py-0.5 rounded-full ts-badge text-black/80 bg-black/5">{hint}</span>}
    </>
  );
}

export function ArticulationTongueSlide({ guide, isAnimating, speed, replayKey }: DiagramSlideProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-full animate-fadeIn">
      <SagittalDiagram
        guide={guide}
        isAnimating={false}
        speed={speed}
        motion={isAnimating ? { replayKey } : undefined}
      />
      <SlideCaption title={getTongueCaption(guide)} hint={getMannerHint(guide)} />
    </div>
  );
}

export function ArticulationLipsSlide({ guide, isAnimating, speed, replayKey }: DiagramSlideProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-full animate-fadeIn">
      {isAnimating ? (
        <FrontalLipsMotion guide={guide} speed={speed} replayKey={replayKey} />
      ) : (
        // The diagram's own caption would repeat the one below.
        <div className="w-full flex justify-center [&_text]:hidden">
          <FrontalLipsDiagram guide={guide} isAnimating={false} />
        </div>
      )}
      <SlideCaption title={getLipsCaption(guide)} />
    </div>
  );
}

export function ArticulationStepsSlide({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="flex flex-col gap-2.5 w-full px-2 text-left animate-fadeIn">
      {steps.map((step, idx) => (
        <li key={`${step}-${idx}`} className="flex items-start gap-3">
          <span className="flex shrink-0 items-center justify-center size-6 mt-0.5 rounded-full ts-kicker font-bold text-white bg-black">
            {idx + 1}
          </span>
          <p className="ts-body leading-snug text-black/90">{step}</p>
        </li>
      ))}
    </ol>
  );
}
