"use client";

import { Loader2, Mic, ChevronRight } from "@/components/icons";
import { AI_TRANSCRIPTION_TIMEOUT_MESSAGE } from "@/lib/degradation/messages";

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
  error?: string | null;
  isSupported?: boolean;
  onMicClick: () => void;
  onSkip: () => void;
}

const WAVE_HEIGHTS = [
  35, 55, 75, 45, 85, 65, 40, 60, 80, 50, 70, 95, 70, 50, 80, 60, 40, 65, 85, 45, 75, 55, 35,
];

function recordingMessage(error: string | null | undefined, isSupported: boolean): string | null {
  if (!isSupported) return "Este dispositivo no permite usar el micrófono.";
  if (error === "no-speech") return "No detectamos tu voz. Acércate al micrófono e inténtalo otra vez.";
  if (error === "not-allowed") return "Permite el acceso al micrófono para practicar.";
  if (error === AI_TRANSCRIPTION_TIMEOUT_MESSAGE) return error;
  if (error) return "No pudimos revisar el audio. Inténtalo otra vez.";
  return null;
}

export default function RecordingControls({
  isRecording,
  isAnalyzing,
  error,
  isSupported = true,
  onMicClick,
  onSkip,
}: Props) {
  const errorMessage = recordingMessage(error, isSupported);
  const mainTitle = isAnalyzing
    ? "Analizando tu pronunciación…"
    : isRecording
    ? "Grabando… pulsa para detener"
    : "Pulsa para grabar";

  const subtitle = isAnalyzing
    ? "Evaluando tu audio con la IA..."
    : isRecording
    ? "Escuchando con atención..."
    : "Di la frase completa a tu ritmo.";

  const isDisabled = isAnalyzing || !isSupported;

  return (
    <div className="shrink-0 pt-1 pb-1">
      <style>{`
        @keyframes mintPulse {
          0%, 100% { transform: scaleY(0.35); opacity: 0.4; }
          50%       { transform: scaleY(1);    opacity: 0.95; }
        }
      `}</style>

      <div className="rounded-2xl bg-surface-sunken dark:bg-surface-raised border border-border-subtle p-4 sm:p-5 flex flex-col items-center justify-center gap-3 sm:gap-4 text-center shadow-xs">
        {/* Visualizador de ondas compacto */}
        <div
          className="flex items-center justify-center gap-1.5 h-6 sm:h-7 w-full max-w-[220px]"
          aria-hidden="true"
        >
          {WAVE_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={`inline-block w-1 rounded-full origin-center transition-all duration-200 ${
                isAnalyzing
                  ? "bg-purple-500 animate-[mintPulse_0.8s_ease-in-out_infinite]"
                  : isRecording
                  ? "bg-[var(--mint-deep)] dark:bg-[var(--mint)] animate-[mintPulse_1.2s_ease-in-out_infinite]"
                  : "bg-[var(--mint-deep)] dark:bg-[var(--mint)] opacity-60"
              }`}
              style={{
                height: isRecording || isAnalyzing ? `${h}%` : `${Math.max(25, h * 0.4)}%`,
                animationDelay: isRecording || isAnalyzing ? `${(i * 0.05).toFixed(2)}s` : undefined,
              }}
            />
          ))}
        </div>

        {/* Botón principal de micrófono con halo sutil */}
        <div className="flex items-center justify-center w-full">
          <div
            className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 ${
              isAnalyzing
                ? "bg-purple-500/20 border border-purple-500/40 animate-pulse"
                : "bg-[color-mix(in_oklch,var(--mint)_18%,transparent)] border border-[color-mix(in_oklch,var(--mint)_30%,transparent)]"
            }`}
          >
            <button
              type="button"
              onClick={isDisabled ? undefined : onMicClick}
              disabled={isDisabled}
              aria-label={isAnalyzing ? "Analizando pronunciación" : isRecording ? "Detener grabación" : "Iniciar grabación"}
              className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 active:scale-95 hover:scale-105 disabled:cursor-default disabled:hover:scale-100 shadow-md ${
                isAnalyzing
                  ? "bg-purple-600 text-white shadow-purple-500/40"
                  : isRecording
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : "bg-[var(--mint)] text-emerald-950 dark:bg-[var(--mint)] dark:text-emerald-950 shadow-emerald-500/20"
              }`}
            >
              {isAnalyzing ? (
                <Loader2 size={26} className="animate-spin text-white" />
              ) : (
                <Mic size={26} strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>

        {/* Textos de estado e instrucciones */}
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xs sm:text-sm font-bold text-fg tracking-tight">
            {mainTitle}
          </p>
          <p className={errorMessage ? "text-xs text-error" : "text-xs text-fg-subtle"} role={errorMessage ? "alert" : undefined}>
            {errorMessage ?? subtitle}
          </p>
        </div>

        {/* Botón explícito para cambiar de frase */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={onSkip}
            aria-label="Siguiente frase"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-fg-muted hover:text-fg bg-surface-raised border border-border-subtle hover:bg-surface-sunken transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <span>Siguiente frase</span>
            <ChevronRight size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
