"use client";

// Planned structure:
// <ConnectedSpeechMicPanel>
//   <MicToggleButton />
//   <MicStatusTitle />
//   <MicStatusHint | MicErrorMessage />
// </ConnectedSpeechMicPanel>

import { Mic } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { SpeechErrorCode, SpeechStatus } from "@/hooks/useSpeechRecognition";
import { connectedSpeechErrorMessage } from "@/lib/pronunciation/connected-speech-evaluation";
import { SCORING_UNAVAILABLE_SHADOW_ES } from "@/lib/speech/browser-support-message";

interface Props {
  status: SpeechStatus;
  errorCode: SpeechErrorCode | null;
  isSupported: boolean;
  onToggleMic: () => void;
}

const TITLES: Partial<Record<SpeechStatus, string>> = {
  listening: "Escuchando tu voz...",
  processing: "Transcribiendo...",
  error: "No pudimos oírte",
};

export function ConnectedSpeechMicPanel({ status, errorCode, isSupported, onToggleMic }: Props) {
  if (!isSupported) {
    return (
      <p className="m-0 text-body-sm text-ink-muted text-center font-medium">
        {SCORING_UNAVAILABLE_SHADOW_ES}
      </p>
    );
  }

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isError = status === "error";

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <button
        type="button"
        onClick={onToggleMic}
        disabled={isProcessing}
        aria-label={isListening ? "Detener grabación" : "Iniciar grabación de repetición"}
        className={cn(
          "w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer focus-ring disabled:cursor-wait disabled:opacity-60",
          isListening && "ring-4 ring-rose-500 animate-pulse",
        )}
      >
        <Mic size={26} className={isListening ? "text-rose-400" : "text-white"} />
      </button>

      <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-ink tracking-tight mt-3 mb-1">
        {TITLES[status] ?? "Grabar mi repetición"}
      </h3>

      {isError ? (
        <p role="alert" className="text-body-sm text-error font-medium m-0 max-w-xs leading-relaxed">
          {connectedSpeechErrorMessage(errorCode)}
        </p>
      ) : (
        <p aria-live="polite" className="text-body-sm text-ink-muted font-medium m-0 max-w-xs leading-relaxed">
          {isListening
            ? "Pronuncia la frase y toca el micrófono al terminar."
            : isProcessing
              ? "Un momento, estamos convirtiendo tu voz en texto."
              : "Di la frase y te mostramos qué palabras entendimos."}
        </p>
      )}
    </div>
  );
}
