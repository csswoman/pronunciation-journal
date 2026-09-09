"use client";

import { Loader2, Mic, ChevronRight } from "@/components/icons";

interface Props {
  isRecording: boolean;
  isAnalyzing: boolean;
  onMicClick: () => void;
  onSkip: () => void;
}

const WAVE_HEIGHTS = [30, 50, 70, 45, 80, 60, 35, 55, 75, 40, 65, 90, 50, 30, 70, 45, 60, 35, 55, 80, 50, 40, 65, 30];

export default function RecordingControls({ isRecording, isAnalyzing, onMicClick, onSkip }: Props) {
  const hint = isAnalyzing
    ? "Analizando pronunciación…"
    : isRecording
    ? "Grabando… pulsa para detener"
    : "Pulsa para grabar";

  const isDisabled = isAnalyzing;

  return (
    <div className="shrink-0 flex flex-col items-center gap-3 pt-4 pb-[var(--layout-section-gap)] relative">
      <style>{`
        @keyframes waveBarPulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.25; }
          50%       { transform: scaleY(1);   opacity: 0.65; }
        }
      `}</style>

      {/* Waveform — estática en reposo, animada solo al grabar */}
      <div
        className="flex items-center justify-center gap-1 h-10 w-full max-w-[280px]"
        aria-hidden="true"
      >
        {WAVE_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`inline-block w-1 rounded-sm origin-center ${isRecording ? "animate-[waveBarPulse_1.4s_ease-in-out_infinite]" : ""}`}
            style={{
              height: isRecording ? `${h}%` : "25%",
              backgroundColor: "var(--primary)",
              opacity: isRecording ? undefined : 0.3,
              animationDelay: isRecording ? `${i * 0.05}s` : undefined,
            }}
          />
        ))}
      </div>

      {/* Record button + skip */}
      <div className="relative flex items-center justify-center w-full">
        <button
          onClick={isDisabled ? undefined : onMicClick}
          disabled={isDisabled}
          aria-label={isAnalyzing ? "Analizando" : isRecording ? "Detener grabación" : "Iniciar grabación"}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 active:scale-95 hover:scale-[1.04] disabled:cursor-default disabled:hover:scale-100 disabled:opacity-70"
          style={{
            backgroundColor: isRecording ? "var(--error)" : "var(--primary)",
            color: "white",
            boxShadow: isRecording
              ? "0 0 0 12px color-mix(in oklch, var(--error) 20%, transparent)"
              : "0 0 0 0 color-mix(in oklch, var(--primary) 25%, transparent)",
          }}
        >
          {isAnalyzing
            ? <Loader2 size={24} className="animate-spin" />
            : <Mic size={26} />
          }
        </button>

        <div className="absolute right-8 group">
          <button
            onClick={onSkip}
            aria-label="Omitir frase"
            className="w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-all duration-150 hover:translate-x-0.5 bg-[var(--btn-regular-bg)] border-[var(--line-divider)] text-[var(--text-tertiary)]"
          >
            <ChevronRight size={16} />
          </button>
          <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-md text-xxs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--tooltip-bg)] text-white/80">
            Omitir
          </div>
        </div>
      </div>

      <p className="text-caption font-medium tracking-wide text-fg-subtle">
        {hint}
      </p>
    </div>
  );
}

