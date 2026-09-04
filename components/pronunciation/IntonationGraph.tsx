"use client";

import { useId, useMemo } from "react";
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

/**
 * Catmull-Rom to Cubic Bézier spline smoothing for organic voice pitch contours.
 */
function buildSmoothSpline(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

export function IntonationGraph({
  targetCurve,
  userPitchPoints = [],
  isRecording = false,
  className,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const gradientId = useId();

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
    const pts = targetCurve.map((pt) => ({
      x: getX(pt.timePct),
      y: getY(pt.semitones),
    }));
    return buildSmoothSpline(pts);
  }, [targetCurve, chartWidth, chartHeight]);

  // Transform user pitch points to 2D coordinates
  const userCoords = useMemo(() => {
    if (userPitchPoints.length < 2) return [];
    const totalDuration = userPitchPoints[userPitchPoints.length - 1].timeMs || 1;
    return userPitchPoints.map((p) => ({
      x: getX(Math.min(1, p.timeMs / totalDuration)),
      y: getY(p.semitones),
    }));
  }, [userPitchPoints, chartWidth, chartHeight]);

  // Build user pitch stroke and area fill paths
  const userPath = useMemo(() => buildSmoothSpline(userCoords), [userCoords]);

  const userAreaPath = useMemo(() => {
    if (userCoords.length < 2 || !userPath) return "";
    const first = userCoords[0];
    const last = userCoords[userCoords.length - 1];
    const baselineY = getY(minSemitone);
    return `${userPath} L ${last.x.toFixed(1)},${baselineY.toFixed(1)} L ${first.x.toFixed(1)},${baselineY.toFixed(1)} Z`;
  }, [userCoords, userPath]);

  // Accessible summary for screen readers
  const accessibleDesc = useMemo(() => {
    if (targetCurve.length === 0) return "Gráfica melódica vacía";
    const start = targetCurve[0]?.semitones ?? 0;
    const end = targetCurve[targetCurve.length - 1]?.semitones ?? 0;
    const trend = end > start ? "ascendente" : end < start ? "descendente" : "plana";
    return `Curva objetivo de entonación ${trend}, desde ${start} semitonos hasta ${end} semitonos en el cierre de la frase.`;
  }, [targetCurve]);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-border-default bg-surface-raised p-4 sm:p-5 shadow-xs transition-colors",
        className,
      )}
    >
      {/* Legend & Recording Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle/50 text-xs font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full border border-dashed border-fg-muted bg-border-strong/50" />
            <span className="font-caption text-fg-muted">Curva objetivo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="font-caption text-primary font-semibold">Tu tono de voz</span>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 text-error font-caption font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-error animate-ping" />
            <span>Escuchando tu entonación…</span>
          </div>
        )}
      </div>

      {/* Empty state guidance */}
      {!userPath && !isRecording && (
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-sunken/80 border border-border-subtle px-3.5 py-1 text-xs text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Pulsa &ldquo;Grabar mi entonación&rdquo; y di la oración al compás</span>
          </div>
        </div>
      )}

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-hidden pt-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto max-h-68 select-none"
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
        >
          <title id={titleId}>Gráfica de entonación y curva melódica</title>
          <desc id={descId}>{accessibleDesc}</desc>

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="85%" stopColor="var(--primary)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Pitch Labels */}
          {[-4, 0, 4].map((semi) => {
            const y = getY(semi);
            const isBase = semi === 0;
            const label = semi > 0 ? `+${semi} st (Agudo)` : isBase ? "0 st (Tono base)" : `${semi} st (Grave)`;
            return (
              <g key={semi}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={WIDTH - PADDING.right}
                  y2={y}
                  className={cn(isBase ? "stroke-border-strong" : "stroke-border-subtle stroke-dashed")}
                  strokeWidth={isBase ? "1.5" : "1"}
                  strokeDasharray={isBase ? undefined : "4 4"}
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className={cn("font-mono text-[10px]", isBase ? "fill-fg font-semibold" : "fill-fg-muted")}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Target Pitch Curve */}
          <path
            d={targetPath}
            fill="none"
            className="stroke-fg-muted/85"
            strokeWidth="3.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />

          {/* Target Word Anchors and Labels */}
          {targetCurve.map((point, index) => {
            const x = getX(point.timePct);
            const y = getY(point.semitones);
            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={HEIGHT - PADDING.bottom}
                  className="stroke-border-subtle"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={point.isNuclearStress ? "6" : "4.5"}
                  className={cn(point.isNuclearStress ? "fill-primary" : "fill-fg-muted", "stroke-surface-raised")}
                  strokeWidth="2.5"
                />
                {point.label && (
                  <text
                    x={x}
                    y={HEIGHT - PADDING.bottom + 20}
                    textAnchor="middle"
                    className={cn(
                      "font-sans select-none",
                      point.isNuclearStress ? "fill-primary font-bold text-[13px]" : "fill-fg font-medium text-[12px]",
                    )}
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* User Recorded Pitch Area Fill */}
          {userAreaPath && (
            <path d={userAreaPath} fill={`url(#${gradientId})`} className="transition-opacity duration-300" />
          )}

          {/* User Recorded Pitch Curve */}
          {userPath && (
            <path
              d={userPath}
              fill="none"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
