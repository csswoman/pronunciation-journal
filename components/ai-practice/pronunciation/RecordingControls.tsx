"use client";

import { Mic, ChevronRight } from "lucide-react";
import WaveformDisplay from "./WaveformDisplay";

interface Props {
  isRecording: boolean;
  onMicClick: () => void;
  onSkip: () => void;
}

const HINT: Record<"idle" | "recording" | "done", string> = {
  idle:      "Tap to record",
  recording: "Recording… tap to stop",
  done:      "Recording saved — tap to try again",
};

export default function RecordingControls({ isRecording, onMicClick, onSkip }: Props) {
  const hint = isRecording ? HINT.recording : HINT.idle;

  return (
    <div className="shrink-0 pt-3">
      <div className="border-t border-border-default mx-5" />
      <div className="pt-3">
        <WaveformDisplay isRecording={isRecording} />
      </div>

      <div className="relative flex items-center justify-center mt-3">

        {/* Mic — centered */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <span
              className="absolute w-20 h-20 rounded-full animate-ping"
              style={{ backgroundColor: "var(--error)", opacity: 0.15 }}
            />
          )}
          <button
            onClick={onMicClick}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className="relative w-16 h-16 rounded-full flex items-center justify-center border-none cursor-pointer transition-transform active:scale-95"
            style={{
              backgroundColor: isRecording ? "var(--error)" : "var(--primary)",
              boxShadow: isRecording
                ? "0 0 0 8px color-mix(in oklch, var(--error) 15%, transparent)"
                : "0 4px 16px color-mix(in oklch, var(--primary) 40%, transparent)",
            }}
          >
            <Mic size={24} color="white" />
          </button>
        </div>

        {/* Skip — absolutely positioned to the right, with tooltip */}
        <div className="absolute right-8 group">
          <button
            onClick={onSkip}
            aria-label="Skip phrase"
            className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-fg-subtle hover:bg-surface-sunken transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-surface-tooltip text-white/80">
            Skip
          </div>
        </div>

      </div>

      <p className="text-center text-[11px] text-fg-muted mt-2.5">{hint}</p>
    </div>
  );
}
