"use client";

import type { DiphthongGlide } from "./data";

/**
 * Vowel-trapezoid mini diagram (IPA chart shape) with an animated glide arrow
 * for a diphthong. Coordinates in `glide` are normalized 0..1 (see data.ts).
 */
export default function VowelTrapezoid({
  glide,
  highlighted = false,
}: {
  glide: DiphthongGlide;
  highlighted?: boolean;
}) {
  // ViewBox coords. The trapezoid leans inward at the bottom (open vowels).
  const W = 200;
  const H = 110;
  const padX = 8;
  const padY = 6;

  // Trapezoid corners
  const topLeft = { x: padX, y: padY };
  const topRight = { x: W - padX, y: padY };
  const bottomLeft = { x: padX + 36, y: H - padY };
  const bottomRight = { x: W - padX - 14, y: H - padY };

  // Map normalized glide coords (0..1) to the trapezoid box.
  // Use the top/bottom widths to lerp the x bounds at each y row.
  const project = (nx: number, ny: number) => {
    const leftX = topLeft.x + (bottomLeft.x - topLeft.x) * ny;
    const rightX = topRight.x + (bottomRight.x - topRight.x) * ny;
    const y = topLeft.y + (H - padY - topLeft.y) * ny;
    const x = leftX + (rightX - leftX) * nx;
    return { x, y };
  };

  const start = project(glide.start.x, glide.start.y);
  const end = project(glide.end.x, glide.end.y);

  const strokeColor = highlighted ? "var(--primary)" : "var(--text-secondary)";
  const trapezoidStroke = highlighted
    ? "var(--primary)"
    : "var(--border-default)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Vowel trapezoid showing diphthong glide"
    >
      <polygon
        points={`${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`}
        fill="none"
        stroke={trapezoidStroke}
        strokeWidth={1}
        opacity={highlighted ? 0.5 : 0.4}
      />

      {/* Glide line + endpoints */}
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Start: hollow circle */}
      <circle
        cx={start.x}
        cy={start.y}
        r={3}
        fill="var(--card-bg)"
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      {/* End: filled dot */}
      <circle cx={end.x} cy={end.y} r={3} fill={strokeColor} />
    </svg>
  );
}
