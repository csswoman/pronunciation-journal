"use client";

import { Mic, ChevronRight } from "lucide-react";

interface Props {
  isRecording: boolean;
  onMicClick: () => void;
  onSkip: () => void;
}

const WAVE_HEIGHTS = [30, 50, 70, 45, 80, 60, 35, 55, 75, 40, 65, 90, 50, 30, 70, 45, 60, 35, 55, 80, 50, 40, 65, 30];

export default function RecordingControls({ isRecording, onMicClick, onSkip }: Props) {
  const hint = isRecording ? "Recording… tap to stop" : "Tap to record";

  return (
    <div className="shrink-0 flex flex-col items-center gap-3 pt-4 pb-6 relative">
      <style>{`
        @keyframes waveBarPulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.25; }
          50%       { transform: scaleY(1);   opacity: 0.65; }
        }
        @keyframes waveBarIdle {
          0%, 100% { transform: scaleY(0.35); opacity: 0.35; }
          50%       { transform: scaleY(0.8);  opacity: 0.5; }
        }
      `}</style>

      {/* Waveform */}
      <div
        className="flex items-center justify-center gap-[3px]"
        style={{ height: 40, width: "100%", maxWidth: 280 }}
        aria-hidden="true"
      >
        {WAVE_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className="inline-block rounded-sm"
            style={{
              width: 3,
              height: `${h}%`,
              backgroundColor: "var(--primary)",
              transformOrigin: "center",
              animation: isRecording
                ? `waveBarPulse 1.4s ease-in-out ${i * 0.05}s infinite`
                : `waveBarIdle 1.8s ease-in-out ${i * 0.06}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Record button + skip */}
      <div className="relative flex items-center justify-center w-full">
        <button
          onClick={onMicClick}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 active:scale-95 hover:scale-[1.04]"
          style={{
            backgroundColor: isRecording ? "var(--error)" : "var(--primary)",
            color: "white",
            boxShadow: isRecording
              ? "0 0 0 12px color-mix(in oklch, var(--error) 20%, transparent)"
              : "0 0 0 0 color-mix(in oklch, var(--primary) 25%, transparent)",
          }}
        >
          <Mic size={26} />
        </button>

        <div className="absolute right-8 group">
          <button
            onClick={onSkip}
            aria-label="Skip phrase"
            className="w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-all duration-150 hover:translate-x-0.5"
            style={{
              backgroundColor: "var(--btn-regular-bg)",
              borderColor: "var(--line-divider)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronRight size={16} />
          </button>
          <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-surface-tooltip text-white/80">
            Skip
          </div>
        </div>
      </div>

      <p className="text-[13px] font-medium tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        {hint}
      </p>
    </div>
  );
}
