"use client";

import { Loader2, Mic, ChevronRight } from "@/components/icons";

// Planned structure:
// <RecordingControls>
//   <ConsoleContainer>
//     <AudioWaveformVisualizer />
//     <MicAndSkipControlsRow>
//       <MicButtonWithHalo />
//       <SkipButton />
//     </MicAndSkipControlsRow>
//     <InstructionText />
//   </ConsoleContainer>
// </RecordingControls>

interface Props {
  isRecording: boolean;
  isAnalyzing: boolean;
  onMicClick: () => void;
  onSkip: () => void;
}

const WAVE_HEIGHTS = [
  35, 55, 75, 45, 85, 65, 40, 60, 80, 50, 70, 95, 70, 50, 80, 60, 40, 65, 85, 45, 75, 55, 35,
];

export default function RecordingControls({ isRecording, isAnalyzing, onMicClick, onSkip }: Props) {
  const mainTitle = isAnalyzing
    ? "Analizando pronunciación…"
    : isRecording
    ? "Grabando… pulsa para detener"
    : "Pulsa para grabar";

  const subtitle = isRecording
    ? "Escuchando con atención..."
    : "Di la frase completa a tu ritmo.";

  const isDisabled = isAnalyzing;

  return (
    <div className="shrink-0 pt-3 pb-3">
      <style>{`
        @keyframes mintPulse {
          0%, 100% { transform: scaleY(0.35); opacity: 0.4; }
          50%       { transform: scaleY(1);    opacity: 0.95; }
        }
      `}</style>

      <div className="rounded-3xl bg-surface-sunken dark:bg-surface-raised border border-border-subtle p-6 sm:p-8 flex flex-col items-center justify-center gap-4 sm:gap-5 text-center shadow-md">
        {/* Visualizador de ondas en verde menta con aire amplio */}
        <div
          className="flex items-center justify-center gap-1.5 h-9 sm:h-10 w-full max-w-[280px]"
          aria-hidden="true"
        >
          {WAVE_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={`inline-block w-1 rounded-full origin-center transition-all duration-200 bg-[var(--mint-deep)] dark:bg-[var(--mint)] ${
                isRecording ? "animate-[mintPulse_1.2s_ease-in-out_infinite]" : ""
              }`}
              style={{
                height: isRecording ? `${h}%` : `${Math.max(25, h * 0.45)}%`,
                opacity: isRecording ? undefined : 0.65,
                animationDelay: isRecording ? `${(i * 0.05).toFixed(2)}s` : undefined,
              }}
            />
          ))}
        </div>

        {/* Fila de botón de grabación con halo y botón omitir */}
        <div className="relative flex items-center justify-center w-full my-1">
          {/* Botón principal de micrófono con halo generoso */}
          <div className="p-3 sm:p-3.5 rounded-full bg-[color-mix(in_oklch,var(--mint)_18%,transparent)] border border-[color-mix(in_oklch,var(--mint)_30%,transparent)] transition-transform">
            <button
              type="button"
              onClick={isDisabled ? undefined : onMicClick}
              disabled={isDisabled}
              aria-label={isAnalyzing ? "Analizando" : isRecording ? "Detener grabación" : "Iniciar grabación"}
              className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 active:scale-95 hover:scale-105 disabled:cursor-default disabled:hover:scale-100 disabled:opacity-70 shadow-lg ${
                isRecording
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : "bg-[var(--mint)] text-emerald-950 dark:bg-[var(--mint)] dark:text-emerald-950 shadow-emerald-500/20"
              }`}
            >
              {isAnalyzing ? (
                <Loader2 size={28} className="animate-spin text-emerald-950" />
              ) : (
                <Mic size={30} strokeWidth={2.4} />
              )}
            </button>
          </div>

          {/* Botón Omitir / Siguiente a la derecha */}
          <div className="absolute right-3 sm:right-8 group">
            <button
              type="button"
              onClick={onSkip}
              aria-label="Omitir frase"
              className="w-11 h-11 rounded-full flex items-center justify-center border border-border-subtle bg-surface-raised/70 hover:bg-surface-raised text-fg-muted hover:text-fg cursor-pointer transition-all duration-150 hover:translate-x-0.5 shadow-2xs"
            >
              <ChevronRight size={20} strokeWidth={2.2} />
            </button>
            <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-2.5 py-1 rounded-md text-xxs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-surface-tooltip text-white">
              Omitir
            </div>
          </div>
        </div>

        {/* Textos de estado e instrucciones */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm sm:text-base font-bold text-fg tracking-tight">
            {mainTitle}
          </p>
          <p className="text-xs sm:text-sm text-fg-subtle">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
