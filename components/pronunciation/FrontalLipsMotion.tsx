"use client";

import { useMemo, useRef } from "react";
import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import {
  getCycleSeconds,
  getLipsEntryScale,
  getMotionTimeline,
  toKeySplines,
  toKeyTimes,
  toPoseValues,
  type MotionSpeed,
  type PoseIndex,
} from "@/lib/pronunciation/articulation-motion";
import { useSmilReplay } from "@/hooks/useSmilReplay";
import { LipShapeContent } from "./FrontalLipsDiagram";

// Planned structure:
// <FrontalLipsMotion>        — svg canvas, captions hidden (they would overlap mid-fade)
//   <LipsLayer pose=0 />     — relaxed mouth
//   <LipsLayer pose=1 />     — sound's posture
//   <LipsLayer pose=2 />     — glide target (diphthongs only)
// </FrontalLipsMotion>

const CENTER = { x: 100, y: 56 };

interface Props {
  guide: PhonemeArticulationGuide;
  speed: MotionSpeed;
  /** Changing it restarts the cycle from rest (e.g. when audio starts). */
  replayKey: number;
}

export function FrontalLipsMotion({ guide, speed, replayKey }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const timeline = getMotionTimeline(guide);
  const dur = `${getCycleSeconds(guide, speed)}s`;

  const layers = useMemo(() => {
    const rest: PhonemeArticulationGuide = { ...guide, lipShape: "neutral", jawOpening: "narrow" };
    const list = [rest, guide];
    if (guide.glide) {
      list.push({ ...guide, lipShape: guide.glide.lipShape, jawOpening: guide.glide.jawOpening });
    }
    return list;
  }, [guide]);

  useSmilReplay(svgRef, [replayKey, dur, guide.symbol]);

  const timing = {
    dur,
    begin: "indefinite",
    repeatCount: "indefinite",
    calcMode: "spline",
    keyTimes: toKeyTimes(timeline),
    keySplines: toKeySplines(timeline),
  } as const;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 120"
      className="h-32 w-full max-w-[190px] overflow-visible select-none [&_text]:hidden"
      role="img"
      aria-label={`Los labios pasan de la posición relajada a la de ${guide.symbol}`}
    >
      {layers.map((layer, index) => {
        const pose = index as PoseIndex;
        const [sx, sy] = getLipsEntryScale(layer.lipShape, layer.jawOpening);
        return (
          <g key={pose} opacity={pose === 1 ? 1 : 0}>
            <animate
              attributeName="opacity"
              values={toPoseValues(timeline, (p) => (p === pose ? 1 : 0))}
              {...timing}
            />
            <g transform={`translate(${CENTER.x} ${CENTER.y})`}>
              <g>
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values={toPoseValues(timeline, (p) => (p === pose ? "1 1" : `${sx} ${sy}`))}
                  {...timing}
                />
                <g transform={`translate(${-CENTER.x} ${-CENTER.y})`}>
                  <LipShapeContent guide={layer} />
                </g>
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
