"use client";

import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import type { VoiceState } from "@/hooks/useAIVoice";

interface Props {
  voiceEnabled: boolean;
  voiceState: VoiceState;
  onToggleVoice: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

const STATE_LABEL: Record<VoiceState, string> = {
  idle:         "Tap to speak",
  recording:    "Recording… tap to stop",
  transcribing: "Transcribing…",
  speaking:     "Tutor speaking…",
};

export default function VoiceToggle({
  voiceEnabled,
  voiceState,
  onToggleVoice,
  onStartListening,
  onStopListening,
}: Props) {
  const isRecording    = voiceState === "recording";
  const isBusy         = voiceState === "transcribing" || voiceState === "speaking";

  return (
    <div className="flex items-center gap-2">
      {/* Mode toggle */}
      <button
        onClick={onToggleVoice}
        title={voiceEnabled ? "Disable voice mode" : "Enable voice mode"}
        className="rounded-full p-2 transition-colors"
        style={{
          backgroundColor: voiceEnabled ? "var(--primary)" : "var(--btn-regular-bg)",
          color: voiceEnabled ? "var(--primary-fg, #fff)" : "var(--text-secondary)",
        }}
      >
        <Volume2 className="w-4 h-4" />
      </button>

      {/* Push-to-talk button — only visible when voice is on */}
      {voiceEnabled && (
        <button
          disabled={isBusy}
          onMouseDown={onStartListening}
          onMouseUp={onStopListening}
          onTouchStart={onStartListening}
          onTouchEnd={onStopListening}
          onClick={isRecording ? onStopListening : undefined}
          title={STATE_LABEL[voiceState]}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all select-none"
          style={{
            backgroundColor: isRecording
              ? "#ef4444"
              : isBusy
              ? "var(--btn-regular-bg)"
              : "var(--primary)",
            color: isBusy ? "var(--text-tertiary)" : "var(--primary-fg, #fff)",
            cursor: isBusy ? "not-allowed" : "pointer",
            animation: isRecording ? "pulse 1.5s ease-in-out infinite" : undefined,
          }}
        >
          {voiceState === "transcribing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          <span>{STATE_LABEL[voiceState]}</span>
        </button>
      )}
    </div>
  );
}
