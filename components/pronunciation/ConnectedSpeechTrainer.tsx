"use client";

// Planned structure:
// <ConnectedSpeechTrainer>
//   <ConnectedSpeechCategoryPills />
//   <ConnectedSpeechPhraseCard />
// </ConnectedSpeechTrainer>

import { useState, useCallback, useEffect, useRef } from "react";
import { CONNECTED_SPEECH_DATA } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { recordConnectedSpeechAttempt } from "@/lib/sounds/queries";
import { useAuthOptional } from "@/components/auth/AuthProvider";
import {
  ConnectedSpeechCategoryPills,
  ConnectedSpeechPhraseCard,
  firstIndexForCategory,
} from "./ConnectedSpeechParts";
import { AcousticUnpackingCard } from "./AcousticUnpackingCard";
import Button from "@/components/ui/Button";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/cn";

export function ConnectedSpeechTrainer() {
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trainerMode, setTrainerMode] = useState<"unpacking" | "production">("production");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const recordedAttemptRef = useRef<string | null>(null);

  const currentPhrase = CONNECTED_SPEECH_DATA[selectedIndex] ?? CONNECTED_SPEECH_DATA[0];

  const {
    status,
    result: speechResult,
    userAudioUrl,
    isSupported,
    start,
    stop,
    reset,
  } = useSpeechRecognition();

  useEffect(() => {
    cancelSpeech();
    setIsPlayingAudio(false);
    setIsPlayingSlow(false);
    setIsSaved(false);
    recordedAttemptRef.current = null;
    reset();
  }, [selectedIndex, reset]);

  useEffect(() => {
    if (status === "done" && speechResult?.transcript && user?.id) {
      const attemptKey = `${currentPhrase.id}:${speechResult.transcript}`;
      if (recordedAttemptRef.current === attemptKey) return;
      recordedAttemptRef.current = attemptKey;

      const cleanUser = speechResult.transcript.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const cleanExpected = currentPhrase.phrase.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      const isCorrect = cleanUser === cleanExpected || cleanUser.includes(cleanExpected);

      void recordConnectedSpeechAttempt(user.id, {
        phraseId: currentPhrase.id,
        phrase: currentPhrase.phrase,
        category: currentPhrase.category,
        transcript: speechResult.transcript,
        isCorrect,
        timeMs: 3000,
      })
        .then(() => setIsSaved(true))
        .catch((err) => console.warn("[ConnectedSpeechTrainer] record error", err));
    }
  }, [status, speechResult, user?.id, currentPhrase]);

  const handlePlayConnected = useCallback(() => {
    cancelSpeech();
    setIsPlayingAudio(true);
    speakText(currentPhrase.phrase, {
      rate: 1.0,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  }, [currentPhrase.phrase]);

  const handlePlaySlow = useCallback(() => {
    cancelSpeech();
    setIsPlayingSlow(true);
    speakText(currentPhrase.phrase, {
      rate: 0.65,
      onEnd: () => setIsPlayingSlow(false),
      onError: () => setIsPlayingSlow(false),
    });
  }, [currentPhrase.phrase]);

  const isListening = status === "listening";
  const isDone = status === "done";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Mode Selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-default pb-3">
        <button
          type="button"
          onClick={() => setTrainerMode("unpacking")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-colors focus-ring cursor-pointer",
            trainerMode === "unpacking"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-fg-muted hover:bg-surface-raised hover:text-fg",
          )}
        >
          🎧 Desempaquetado Auditivo (Oído)
        </button>
        <button
          type="button"
          onClick={() => setTrainerMode("production")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-body-sm font-semibold transition-colors focus-ring cursor-pointer",
            trainerMode === "production"
              ? "bg-primary text-on-primary shadow-xs"
              : "text-fg-muted hover:bg-surface-raised hover:text-fg",
          )}
        >
          🎤 Producción Oral (Voz)
        </button>
      </div>

      <ConnectedSpeechCategoryPills
        activeCategory={activeCategory}
        onSelect={(categoryId) => {
          setActiveCategory(categoryId);
          const firstMatch = firstIndexForCategory(categoryId);
          if (firstMatch >= 0) setSelectedIndex(firstMatch);
        }}
      />

      {trainerMode === "unpacking" ? (
        <div className="flex flex-col gap-4">
          <AcousticUnpackingCard
            phrase={currentPhrase}
            isSaved={isSaved}
            onComplete={(correct) => {
              if (user?.id) {
                void recordConnectedSpeechAttempt(user.id, {
                  phraseId: currentPhrase.id,
                  phrase: currentPhrase.phrase,
                  category: currentPhrase.category,
                  transcript: correct ? currentPhrase.phrase : "unpack_error",
                  isCorrect: correct,
                  timeMs: 2500,
                })
                  .then(() => setIsSaved(true))
                  .catch((err) => console.warn("[ConnectedSpeechTrainer] record error", err));
              }
            }}
          />

          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedIndex((prev) => (prev + 1) % CONNECTED_SPEECH_DATA.length);
              }}
              className="flex items-center gap-1.5"
            >
              <span>Siguiente frase</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <ConnectedSpeechPhraseCard
          phrase={currentPhrase}
          isPlayingAudio={isPlayingAudio}
          isPlayingSlow={isPlayingSlow}
          isListening={isListening}
          isDone={isDone}
          isSupported={isSupported}
          transcript={speechResult?.transcript}
          userAudioUrl={userAudioUrl}
          isSaved={isSaved}
          onPlaySlow={handlePlaySlow}
          onPlayConnected={handlePlayConnected}
          onToggleMic={isListening ? stop : start}
          onNext={() => {
            setSelectedIndex((prev) => (prev + 1) % CONNECTED_SPEECH_DATA.length);
          }}
        />
      )}
    </div>
  );
}
