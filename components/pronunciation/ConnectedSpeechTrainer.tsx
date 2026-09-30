"use client";

// Planned structure:
// <ConnectedSpeechTrainer>
//   <ConnectedSpeechHeaderNav />
//   <TrainerWorkspaceGrid>
//     <LeftColumn: UnpackingCard | VoiceCard />
//     <RightColumn: FeedbackPlaceholder | PedagogicalCard | VoiceChecklist | VoiceFeedback />
//   </TrainerWorkspaceGrid>
//   <ConnectedSpeechFooter />
// </ConnectedSpeechTrainer>

import { useState, useCallback, useEffect, useMemo } from "react";
import { CONNECTED_SPEECH_DATA } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAttemptPlayback } from "@/hooks/useAttemptPlayback";
import { useRecordConnectedSpeechVoiceAttempt } from "@/hooks/useRecordConnectedSpeechVoiceAttempt";
import { recordConnectedSpeechAttempt } from "@/lib/sounds/queries";
import { useAuthOptional } from "@/components/auth/AuthProvider";
import {
  ConnectedSpeechHeaderNav,
  ConnectedSpeechFeedbackPlaceholder,
  getPhraseOptions,
} from "./ConnectedSpeechParts";
import { ConnectedSpeechSetup } from "./ConnectedSpeechSetup";
import { ConnectedSpeechUnpackingCard } from "./ConnectedSpeechUnpackingCard";
import { ConnectedSpeechVoiceCard } from "./ConnectedSpeechVoiceCard";
import { ConnectedSpeechFooter } from "./ConnectedSpeechFooter";
import { ConnectedSpeechPedagogicalCard } from "./ConnectedSpeechPedagogicalCard";
import { ConnectedSpeechVoiceChecklist } from "./ConnectedSpeechVoiceChecklist";
import { ConnectedSpeechVoiceFeedback } from "./ConnectedSpeechVoiceFeedback";

export function ConnectedSpeechTrainer() {
  const auth = useAuthOptional();
  const user = auth?.user ?? null;

  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trainerMode, setTrainerMode] = useState<"unpacking" | "production">("unpacking");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const filteredPhrases = useMemo(() => {
    if (activeCategory === "all") return CONNECTED_SPEECH_DATA;
    return CONNECTED_SPEECH_DATA.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const totalPhrases = filteredPhrases.length;
  const safeIndex = selectedIndex >= totalPhrases ? 0 : selectedIndex;
  const currentPhrase = filteredPhrases[safeIndex] ?? CONNECTED_SPEECH_DATA[0];

  const { status, result: speechResult, userAudioUrl, errorCode, isSupported, start, stop, reset } =
    useSpeechRecognition();
  const { playAttempt, stopAttempt, hasAttempt } = useAttemptPlayback(userAudioUrl);

  useEffect(() => {
    cancelSpeech();
    setIsPlayingAudio(false);
    setIsPlayingSlow(false);
    setSelectedOption(null);
    setIsRevealed(false);
    reset();
  }, [safeIndex, activeCategory, reset]);

  useRecordConnectedSpeechVoiceAttempt(
    user?.id ?? null,
    currentPhrase,
    status,
    speechResult?.transcript,
  );

  const playPhrase = useCallback(
    (rate: number, setPlaying: (playing: boolean) => void) => {
      stopAttempt();
      cancelSpeech();
      setPlaying(true);
      const done = () => setPlaying(false);
      speakText(currentPhrase.phrase, { rate, onEnd: done, onError: done });
    },
    [currentPhrase.phrase, stopAttempt],
  );
  const handlePlayNormal = useCallback(() => playPhrase(1.0, setIsPlayingAudio), [playPhrase]);
  const handlePlaySlow = useCallback(() => playPhrase(0.65, setIsPlayingSlow), [playPhrase]);

  const handlePlayAttempt = useCallback(() => {
    cancelSpeech();
    playAttempt();
  }, [playAttempt]);

  const handleSelectOption = useCallback(
    (optionIdx: number) => {
      if (selectedOption !== null || isRevealed) return;
      setSelectedOption(optionIdx);
      setIsRevealed(true);

      const opts = getPhraseOptions(currentPhrase);
      const chosen = opts[optionIdx];
      if (user?.id && chosen) {
        void recordConnectedSpeechAttempt(user.id, {
          phraseId: currentPhrase.id,
          phrase: currentPhrase.phrase,
          category: currentPhrase.category,
          transcript: chosen.text,
          isCorrect: chosen.isCorrect,
          timeMs: 2500,
        })
          .catch((err) => console.warn("[ConnectedSpeechTrainer] record error", err));
      }
    },
    [selectedOption, isRevealed, currentPhrase, user?.id],
  );

  const handleNextPhrase = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalPhrases);
  }, [totalPhrases]);

  const handlePrevPhrase = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + totalPhrases) % totalPhrases);
  }, [totalPhrases]);

  const handleCheckAnswer = useCallback(() => {
    if (selectedOption === null && !isRevealed) {
      handleSelectOption(0);
    } else {
      handleNextPhrase();
    }
  }, [selectedOption, isRevealed, handleSelectOption, handleNextPhrase]);

  const isListening = status === "listening";
  const isDone = status === "done" && !!speechResult;
  const isAnswered = selectedOption !== null || isRevealed;

  if (!isSessionStarted) {
    return (
      <div className="w-full max-w-7xl mx-auto py-2">
        <ConnectedSpeechSetup
          activeCategory={activeCategory}
          trainerMode={trainerMode}
          phraseCount={totalPhrases}
          onSelectCategory={(catId) => {
            setActiveCategory(catId);
            setSelectedIndex(0);
          }}
          onSelectMode={setTrainerMode}
          onStartSession={() => setIsSessionStarted(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-2 animate-fadeIn">
      <ConnectedSpeechHeaderNav
        trainerMode={trainerMode}
        onSelectMode={setTrainerMode}
        onBackToSetup={() => setIsSessionStarted(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 w-full min-w-0">
          {trainerMode === "unpacking" ? (
            <ConnectedSpeechUnpackingCard
              phrase={currentPhrase}
              safeIndex={safeIndex}
              totalPhrases={totalPhrases}
              activeCategory={activeCategory}
              onSelectCategory={(catId) => {
                setActiveCategory(catId);
                setSelectedIndex(0);
              }}
              isPlayingAudio={isPlayingAudio}
              isPlayingSlow={isPlayingSlow}
              selectedOption={selectedOption}
              isRevealed={isRevealed}
              onPlayNormal={handlePlayNormal}
              onPlaySlow={handlePlaySlow}
              onSelectOption={handleSelectOption}
            />
          ) : (
            <ConnectedSpeechVoiceCard
              phrase={currentPhrase}
              safeIndex={safeIndex}
              totalPhrases={totalPhrases}
              activeCategory={activeCategory}
              onSelectCategory={(catId) => {
                setActiveCategory(catId);
                setSelectedIndex(0);
              }}
              isPlayingAudio={isPlayingAudio}
              isPlayingSlow={isPlayingSlow}
              status={status}
              errorCode={errorCode}
              isSupported={isSupported}
              hasAttemptAudio={hasAttempt}
              onPlaySlow={handlePlaySlow}
              onPlayConnected={handlePlayNormal}
              onPlayAttempt={handlePlayAttempt}
              onToggleMic={isListening ? stop : start}
              onResetRecording={reset}
            />
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 w-full min-w-0">
          {trainerMode === "unpacking" ? (
            !isAnswered ? (
              <ConnectedSpeechFeedbackPlaceholder />
            ) : (
              <ConnectedSpeechPedagogicalCard phrase={currentPhrase} />
            )
          ) : !isDone ? (
            <ConnectedSpeechVoiceChecklist phrase={currentPhrase} />
          ) : (
            <ConnectedSpeechVoiceFeedback
              phrase={currentPhrase}
              transcript={speechResult.transcript}
              hasAttemptAudio={hasAttempt}
              onPlayNormal={handlePlayNormal}
              onPlayAttempt={handlePlayAttempt}
            />
          )}
        </div>
      </div>

      <ConnectedSpeechFooter
        isAnswered={isAnswered}
        trainerMode={trainerMode}
        hasPrev={safeIndex > 0}
        onPrev={handlePrevPhrase}
        onNext={handleNextPhrase}
        onCheckAnswer={handleCheckAnswer}
        onRevealAnswer={() => setIsRevealed(true)}
        onSwitchToVoice={() => setTrainerMode("production")}
      />
    </div>
  );
}
