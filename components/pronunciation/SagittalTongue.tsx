"use client";

import { useMemo, useRef } from "react";
import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import {
  getCycleSeconds,
  getMotionTimeline,
  getTonguePoses,
  toKeySplines,
  toKeyTimes,
  toPoseValues,
  type MotionSpeed,
} from "@/lib/pronunciation/articulation-motion";
import { getTongueGeometry, type TongueGeometry } from "@/lib/pronunciation/sagittal-tongue-geometry";
import { useSmilReplay } from "@/hooks/useSmilReplay";
import { cn } from "@/lib/cn";

// Planned structure:
// <SagittalTongueStatic />  — tongue at its posture, optional idle "breathing"
// <SagittalTongueMotion />  — tongue morphs rest → posture (→ glide) → rest
//   <TonguePath />          — outline + <animate d>
//   <ContactDot />          — articulation point + <animate cx/cy>

const DORSUM_GROOVE = "M 74,138 Q 104,128 134,133";

interface StaticProps {
  tongue: TongueGeometry;
  gradientId: string;
  isAnimating: boolean;
  speed: MotionSpeed;
}

export function SagittalTongueStatic({ tongue, gradientId, isAnimating, speed }: StaticProps) {
  return (
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
      <path d={DORSUM_GROOVE} fill="none" className="stroke-primary/25" strokeWidth="1.5" strokeDasharray="2 3" />
      {/* Punto de articulación: sólo pulsa si hay contacto real */}
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
  );
}

interface MotionProps {
  guide: PhonemeArticulationGuide;
  gradientId: string;
  speed: MotionSpeed;
  /** Changing it restarts the cycle from rest (e.g. when audio starts). */
  replayKey: number;
}

export function SagittalTongueMotion({ guide, gradientId, speed, replayKey }: MotionProps) {
  const groupRef = useRef<SVGGElement>(null);
  const timeline = getMotionTimeline(guide);
  const shapes = useMemo(() => getTonguePoses(guide).map(getTongueGeometry), [guide]);
  const dur = `${getCycleSeconds(guide, speed)}s`;
  const timing = {
    dur,
    begin: "indefinite",
    repeatCount: "indefinite",
    calcMode: "spline",
    keyTimes: toKeyTimes(timeline),
    keySplines: toKeySplines(timeline),
  } as const;

  useSmilReplay(groupRef, [replayKey, dur, guide.symbol]);

  // The resting frame is the static fallback before SMIL starts (and in jsdom).
  const target = shapes[1];
  return (
    <g ref={groupRef}>
      <path
        d={target.path}
        fill={`url(#${gradientId})`}
        className="stroke-primary"
        strokeWidth="2.8"
        strokeLinejoin="round"
      >
        <animate attributeName="d" values={toPoseValues(timeline, (p) => shapes[p].path)} {...timing} />
      </path>
      <path d={DORSUM_GROOVE} fill="none" className="stroke-primary/25" strokeWidth="1.5" strokeDasharray="2 3" />
      <circle
        cx={target.contactX}
        cy={target.contactY}
        r="4"
        className="fill-primary stroke-surface-raised"
        strokeWidth="1.5"
      >
        <animate attributeName="cx" values={toPoseValues(timeline, (p) => shapes[p].contactX)} {...timing} />
        <animate attributeName="cy" values={toPoseValues(timeline, (p) => shapes[p].contactY)} {...timing} />
      </circle>
    </g>
  );
}
