"use client";

import { Loader2, Mic, ChevronRight } from "@/components/icons";
import { AI_TRANSCRIPTION_TIMEOUT_MESSAGE } from "@/lib/degradation/messages";
import { PillButton } from "@/components/ui/PillButton";

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

      <div className="rounded-2xl bg-surface-sunken dark:bg-surface-raised border border-border-subtle p-3 @[28rem]:p-4 flex flex-col items-center justify-center gap-2 @[28rem]:gap-3 text-center shadow-xs">
        {/* Visualizador de ondas compacto */}
        <div
          className="flex items-center justify-center gap-1.5 h-4.5 @[28rem]:h-6 w-full max-w-[200px]"
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
            className={`p-2 @[28rem]:p-2.5 rounded-full transition-all duration-300 ${
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
              className={`size-14 @[28rem]:size-16 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 active:scale-95 hover:scale-105 disabled:cursor-default disabled:hover:scale-100 shadow-md ${
                isAnalyzing
                  ? "bg-purple-600 text-white shadow-purple-500/40"
                  : isRecording
                  ? "bg-rose-500 text-white shadow-rose-500/30"
                  : "bg-[var(--mint)] text-emerald-950 dark:bg-[var(--mint)] dark:text-emerald-950 shadow-emerald-500/20"
              }`}
            >
              {isAnalyzing ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <Mic size={24} strokeWidth={2.4} />
              )}
            </button>
          </div>
        </div>

        {/* Textos de estado e instrucciones */}
        <div className="flex flex-col items-center gap-1 my-0.5">
          <p className="text-sm @[28rem]:text-base font-extrabold text-fg tracking-tight">
            {mainTitle}
          </p>
          <p className={errorMessage ? "text-xs @[28rem]:text-sm text-error font-medium" : "text-xs @[28rem]:text-sm font-medium text-fg-muted"} role={errorMessage ? "alert" : undefined}>
            {errorMessage ?? subtitle}
          </p>
        </div>

        {/* Botón CTA principal para avanzar de frase */}
        <div className="pt-1.5">
          <PillButton
            variant="primary"
            size="md"
            onClick={onSkip}
            aria-label="Siguiente frase"
            icon={<ChevronRight size={16} strokeWidth={2.5} />}
            iconPosition="right"
            className="!font-bold !text-sm sm:!text-base px-6 py-2.5 shadow-md active:scale-95 transition-transform"
          >
            Siguiente frase
          </PillButton>
        </div>
      </div>
    </div>
  );
}
