"use client";

import { useEffect, useRef } from "react";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import type { SpeechStatus } from "@/hooks/useSpeechRecognition";
import { evaluateConnectedSpeechTranscript } from "@/lib/pronunciation/connected-speech-evaluation";
import { recordConnectedSpeechAttempt } from "@/lib/sounds/queries";

/**
 * Guarda una sola vez cada intento de voz terminado (frase + transcript).
 * Sin usuario no se persiste nada: el modo invitado sólo practica.
 */
export function useRecordConnectedSpeechVoiceAttempt(
  userId: string | null,
  phrase: ConnectedPhrase,
  status: SpeechStatus,
  transcript: string | undefined,
) {
  const recordedAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "done" || !transcript || !userId) return;

    const attemptKey = `${phrase.id}:${transcript}`;
    if (recordedAttemptRef.current === attemptKey) return;
    recordedAttemptRef.current = attemptKey;

    const { isCorrect } = evaluateConnectedSpeechTranscript(phrase.phrase, transcript);
    void recordConnectedSpeechAttempt(userId, {
      phraseId: phrase.id,
      phrase: phrase.phrase,
      category: phrase.category,
      transcript,
      isCorrect,
      timeMs: 3000,
    }).catch((err) => console.warn("[useRecordConnectedSpeechVoiceAttempt] record error", err));
  }, [status, transcript, userId, phrase]);
}
