"use client";

// Planned structure:
// <ConnectedSpeechTrainer>
//   <ConnectedSpeechModeSelector />
//   <ConnectedSpeechCategoryPills />
//   <ConnectedSpeechProgress />
//   <AcousticUnpackingCard | ConnectedSpeechPhraseCard>
// </ConnectedSpeechTrainer>

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CONNECTED_SPEECH_DATA } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { recordConnectedSpeechAttempt } from "@/lib/sounds/queries";
import { useAuthOptional } from "@/components/auth/AuthProvider";
import {
  ConnectedSpeechCategoryPills,
  ConnectedSpeechPhraseCard,
} from "./ConnectedSpeechParts";
import { AcousticUnpackingCard } from "./AcousticUnpackingCard";
import Button from "@/components/ui/Button";
import { ArrowRight, ArrowLeft } from "@/components/icons";
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

  const filteredPhrases = useMemo(() => {
    if (activeCategory === "all") return CONNECTED_SPEECH_DATA;
    return CONNECTED_SPEECH_DATA.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const totalPhrases = filteredPhrases.length;
  const safeIndex = selectedIndex >= totalPhrases ? 0 : selectedIndex;
  const currentPhrase = filteredPhrases[safeIndex] ?? CONNECTED_SPEECH_DATA[0];

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
  }, [safeIndex, reset]);

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

  const handleNextPhrase = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalPhrases);
  }, [totalPhrases]);

  const handlePrevPhrase = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + totalPhrases) % totalPhrases);
  }, [totalPhrases]);

  const isListening = status === "listening";
  const isDone = status === "done";

  return (
    <div className="flex flex-col gap-5 w-full py-2">
      {/* Mode Selector - Apple HIG Segmented Control */}
      <div
        role="tablist"
        aria-label="Modalidad de entrenamiento"
        className="inline-flex w-full sm:w-auto p-1 rounded-xl bg-surface-sunken border border-border-subtle gap-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={trainerMode === "unpacking"}
          onClick={() => setTrainerMode("unpacking")}
          className={cn(
            "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg text-body-sm font-semibold transition-all focus-ring cursor-pointer",
            trainerMode === "unpacking"
              ? "bg-surface-raised text-fg shadow-xs border border-border-default"
              : "text-fg-muted hover:text-fg hover:bg-surface-raised/40",
          )}
        >
          <span>🎧 Desempaquetado Auditivo (Oído)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={trainerMode === "production"}
          onClick={() => setTrainerMode("production")}
          className={cn(
            "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg text-body-sm font-semibold transition-all focus-ring cursor-pointer",
            trainerMode === "production"
              ? "bg-surface-raised text-fg shadow-xs border border-border-default"
              : "text-fg-muted hover:text-fg hover:bg-surface-raised/40",
          )}
        >
          <span>🎤 Producción Oral (Voz)</span>
        </button>
      </div>

      <ConnectedSpeechCategoryPills
        activeCategory={activeCategory}
        onSelect={(categoryId) => {
          setActiveCategory(categoryId);
          setSelectedIndex(0);
        }}
      />

      {/* Progress and Counter */}
      <div className="flex items-center justify-between text-caption font-medium text-fg-muted px-1">
        <span>
          Frase <strong className="text-fg font-bold">{safeIndex + 1}</strong> de {totalPhrases}
        </span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {filteredPhrases.slice(0, Math.min(8, totalPhrases)).map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all",
                idx === safeIndex ? "w-5 bg-primary" : "w-1.5 bg-border-default",
              )}
            />
          ))}
        </div>
      </div>

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

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrevPhrase}
              disabled={safeIndex === 0}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span>Anterior</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleNextPhrase}
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
          onNext={handleNextPhrase}
          onPrev={handlePrevPhrase}
          hasPrev={safeIndex > 0}
        />
      )}
    </div>
  );
}

