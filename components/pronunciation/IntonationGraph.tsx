"use client";

import { useMemo } from "react";
import type { PitchPoint, TargetPitchPoint } from "@/lib/speech/pitch-detector";
import { cn } from "@/lib/cn";

interface Props {
  targetCurve: TargetPitchPoint[];
  userPitchPoints?: PitchPoint[];
  isRecording?: boolean;
  className?: string;
}

const WIDTH = 600;
const HEIGHT = 240;
const PADDING = { top: 30, right: 40, bottom: 50, left: 55 };

export function IntonationGraph({
  targetCurve,
  userPitchPoints = [],
  isRecording = false,
  className,
}: Props) {
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  // Semitone range to render on Y axis
  const minSemitone = -6;
  const maxSemitone = 6;

  const getY = (semitone: number) => {
    const clamped = Math.max(minSemitone, Math.min(maxSemitone, semitone));
    const normalized = (clamped - minSemitone) / (maxSemitone - minSemitone);
    return PADDING.top + chartHeight * (1 - normalized);
  };

  const getX = (timePct: number) => {
    return PADDING.left + chartWidth * Math.max(0, Math.min(1, timePct));
  };

  // Build target smooth SVG curve path
  const targetPath = useMemo(() => {
    if (targetCurve.length === 0) return "";
    let d = `M ${getX(targetCurve[0].timePct)},${getY(targetCurve[0].semitones)}`;

    for (let i = 1; i < targetCurve.length; i++) {
      const prev = targetCurve[i - 1];
      const curr = targetCurve[i];
      const xPrev = getX(prev.timePct);
      const yPrev = getY(prev.semitones);
      const xCurr = getX(curr.timePct);
      const yCurr = getY(curr.semitones);

      const cpX1 = xPrev + (xCurr - xPrev) / 2;
      const cpX2 = xPrev + (xCurr - xPrev) / 2;
      d += ` C ${cpX1},${yPrev} ${cpX2},${yCurr} ${xCurr},${yCurr}`;
    }
    return d;
  }, [targetCurve, chartWidth, chartHeight]);

  // Build user pitch curve path from recorded pitch points
  const userPath = useMemo(() => {
    if (userPitchPoints.length < 2) return "";
    const totalDuration = userPitchPoints[userPitchPoints.length - 1].timeMs || 1;

    let d = "";
    for (let i = 0; i < userPitchPoints.length; i++) {
      const p = userPitchPoints[i];
      const timePct = Math.min(1, p.timeMs / totalDuration);
      const x = getX(timePct);
      const y = getY(p.semitones);

      if (i === 0) {
        d += `M ${x},${y}`;
      } else {
        d += ` L ${x},${y}`;
      }
    }
    return d;
  }, [userPitchPoints, chartWidth, chartHeight]);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border border-border-default bg-surface-raised p-4 shadow-sm",
        className,
      )}
    >
      {/* Legend & Recording Status */}
      <div className="flex items-center justify-between gap-3 pb-2 text-xs font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-full bg-border-strong border border-dashed border-fg-muted" />
            <span className="font-caption text-fg-muted">Curva objetivo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-full bg-primary" />
            <span className="font-caption text-primary font-semibold">Tu tono de voz</span>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-1.5 text-error animate-pulse font-caption font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            Escuchando tu entonación…
          </div>
        )}
      </div>

      {/* SVG Canvas Chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto max-h-64 select-none"
          aria-label="Gráfica de entonación y curva melódica"
        >
          {/* Horizontal Grid lines & Pitch Labels */}
          {[-4, 0, 4].map((semi) => {
            const y = getY(semi);
            const label = semi > 0 ? `+${semi} st (Alto)` : semi === 0 ? "0 st (Medio)" : `${semi} st (Bajo)`;
            return (
              <g key={semi}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={WIDTH - PADDING.right}
                  y2={y}
                  className={cn(
                    "stroke-border-subtle",
                    semi === 0 ? "stroke-border-default stroke-dasharray-none" : "stroke-dashed",
                  )}
                  strokeWidth={semi === 0 ? "1.5" : "1"}
                  strokeDasharray={semi === 0 ? undefined : "4 4"}
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-fg-muted font-mono text-[10px]"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Target Pitch Curve (Dashed line with Area) */}
          <path
            d={targetPath}
            fill="none"
            className="stroke-fg-muted/60"
            strokeWidth="3"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />

          {/* Target Word Anchors and Labels */}
          {targetCurve.map((point, index) => {
            const x = getX(point.timePct);
            const y = getY(point.semitones);
            return (
              <g key={index}>
                {/* Vertical guide drop line */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={HEIGHT - PADDING.bottom}
                  className="stroke-border-subtle"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Target Point Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={point.isNuclearStress ? "5.5" : "4"}
                  className={cn(
                    point.isNuclearStress
                      ? "fill-primary stroke-surface-raised"
                      : "fill-fg-muted stroke-surface-raised",
                  )}
                  strokeWidth="2"
                />

                {/* Word Label below timeline */}
                {point.label && (
                  <text
                    x={x}
                    y={HEIGHT - PADDING.bottom + 18}
                    textAnchor="middle"
                    className={cn(
                      "font-sans text-xs",
                      point.isNuclearStress
                        ? "fill-primary font-bold text-[13px]"
                        : "fill-fg font-medium text-[11px]",
                    )}
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* User Recorded Pitch Curve */}
          {userPath && (
            <g className="transition-all duration-200">
              <path
                d={userPath}
                fill="none"
                className="stroke-primary"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* User Pitch Points */}
          {userPitchPoints.map((p, i) => {
            const totalDuration = userPitchPoints[userPitchPoints.length - 1].timeMs || 1;
            const x = getX(p.timeMs / totalDuration);
            const y = getY(p.semitones);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2.5"
                className="fill-primary stroke-surface-raised"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
