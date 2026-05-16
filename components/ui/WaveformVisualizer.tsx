"use client";

// Bar heights for a generic speech waveform shape
const DEFAULT_HEIGHTS = [4, 8, 14, 10, 18, 14, 22, 16, 12, 20, 14, 26, 20, 14, 8, 14, 20, 16, 10, 6, 12, 18, 12, 8, 4];

type WaveformColor = "gradient" | "primary" | "error";

interface Props {
  /** Drives the waveBar animation (speaking / playing back) */
  isActive: boolean;
  /** Drives the wavePulse animation (microphone recording) */
  isRecording?: boolean;
  color?: WaveformColor;
  barHeights?: number[];
  className?: string;
}

function resolveColor(color: WaveformColor, i: number): string {
  if (color === "gradient") return `oklch(0.70 0.15 calc(var(--hue) + ${i * 4}))`;
  if (color === "primary")  return "var(--primary)";
  return "var(--error)";
}

export function WaveformVisualizer({
  isActive,
  isRecording = false,
  color = "gradient",
  barHeights = DEFAULT_HEIGHTS,
  className = "",
}: Props) {
  const animation = isRecording
    ? "wavePulse 1.2s ease-in-out infinite"
    : isActive
    ? "waveBar 0.8s ease-in-out infinite alternate"
    : "none";

  const delay = (i: number) =>
    isActive ? `${(i % 8) * 0.09}s` : `${(i % 5) * 0.15}s`;

  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-hidden>
      {barHeights.map((h, i) => (
        <span
          key={i}
          className="block w-1 rounded-full"
          style={{
            height: `${h}px`,
            backgroundColor: resolveColor(color, i),
            opacity: isActive || isRecording ? 1 : 0.35,
            animation,
            animationDelay: delay(i),
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}
