"use client";

import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";

// Bar heights shaped to /t iː m/:
// t-zone (0-7): sharp attack spike
// iː-zone (8-18): broad sustained plateau
// m-zone (19-24): soft closing taper
const NATIVE_HEIGHTS = [3, 6, 18, 28, 30, 18, 6, 3, 8, 16, 24, 28, 28, 28, 28, 28, 24, 16, 8, 12, 20, 16, 10, 6, 3];

const PHONEME_MARKERS = [
  { label: "t",  xPct: 0.16 },
  { label: "iː", xPct: 0.52 },
  { label: "m",  xPct: 0.86 },
];

interface Props {
  phonemeSegments: string[];
  isRecording: boolean;
  showUserWave: boolean;
}

export default function WaveformZone({ isRecording, showUserWave }: Props) {
  return (
    <div className="flex flex-col gap-space-3 h-full py-space-6">
      <div className="rounded-lg bg-surface-raised p-space-6 flex-1 flex flex-col gap-space-4">

        {/* Phoneme position markers */}
        <div className="relative h-4">
          {PHONEME_MARKERS.map(({ label, xPct }) => (
            <span
              key={label}
              className="absolute -translate-x-1/2 text-tiny text-fg-subtle font-[family-name:var(--font-heading)] tracking-wide"
              style={{ left: `${xPct * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Native reference */}
        <div className="flex flex-col gap-space-1">
          <span className="text-tiny text-fg-subtle uppercase tracking-widest">Native</span>
          <WaveformVisualizer
            isActive={false}
            color="primary"
            barHeights={NATIVE_HEIGHTS}
            className="h-9"
          />
        </div>

        {/* User wave */}
        <div className="flex flex-col gap-space-1">
          <span className="text-tiny text-fg-subtle uppercase tracking-widest">You</span>
          <div
            className="transition-opacity duration-300"
            style={{ opacity: showUserWave ? 1 : 0.2 }}
          >
            <WaveformVisualizer
              isActive={showUserWave && !isRecording}
              isRecording={isRecording}
              color="error"
              barHeights={NATIVE_HEIGHTS}
              className="h-9"
            />
          </div>
        </div>

        {/* Legend */}
        <p className="text-caption text-fg-subtle text-center mt-auto">
          Native (blue) · You (coral)
        </p>
      </div>
    </div>
  );
}
