import type { WordStrength } from "@/lib/word-bank/strength";

interface WordStrengthBarsProps {
  strength: WordStrength;
  size?: number;
}

const CONFIG = {
  weak:   { bars: 1, color: "var(--error)" },
  medium: { bars: 2, color: "var(--warning)" },
  strong: { bars: 3, color: "var(--success)" },
} satisfies Record<WordStrength, { bars: number; color: string }>;

export function WordStrengthBars({ strength, size = 14 }: WordStrengthBarsProps) {
  const { bars, color } = CONFIG[strength];
  const barW = Math.round(size * 0.22);
  const gap = Math.round(size * 0.13);
  const heights = [0.45, 0.72, 1.0].map(r => Math.round(r * size));

  return (
    <svg
      width={3 * barW + 2 * gap}
      height={size}
      viewBox={`0 0 ${3 * barW + 2 * gap} ${size}`}
      aria-label={`${strength} word`}
      role="img"
    >
      {[0, 1, 2].map(i => {
        const h = heights[i];
        const x = i * (barW + gap);
        const active = i < bars;
        return (
          <rect
            key={i}
            x={x}
            y={size - h}
            width={barW}
            height={h}
            rx={Math.round(barW * 0.4)}
            fill={active ? color : "var(--border-subtle)"}
          />
        );
      })}
    </svg>
  );
}
