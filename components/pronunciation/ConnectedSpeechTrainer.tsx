"use client";

// Planned structure:
// <ConnectedSpeechTrainer>
//   <ConnectedSpeechCategoryPills />
//   <ConnectedSpeechPhraseCard />
// </ConnectedSpeechTrainer>

import { useState, useCallback, useEffect } from "react";
import { CONNECTED_SPEECH_DATA } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  ConnectedSpeechCategoryPills,
  ConnectedSpeechPhraseCard,
  firstIndexForCategory,
} from "./ConnectedSpeechParts";

export function ConnectedSpeechTrainer() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

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
    reset();
  }, [selectedIndex, reset]);

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
      <ConnectedSpeechCategoryPills
        activeCategory={activeCategory}
        onSelect={(categoryId) => {
          setActiveCategory(categoryId);
          const firstMatch = firstIndexForCategory(categoryId);
          if (firstMatch >= 0) setSelectedIndex(firstMatch);
        }}
      />

      <ConnectedSpeechPhraseCard
        phrase={currentPhrase}
        isPlayingAudio={isPlayingAudio}
        isPlayingSlow={isPlayingSlow}
        isListening={isListening}
        isDone={isDone}
        isSupported={isSupported}
        transcript={speechResult?.transcript}
        userAudioUrl={userAudioUrl}
        onPlaySlow={handlePlaySlow}
        onPlayConnected={handlePlayConnected}
        onToggleMic={isListening ? stop : start}
        onNext={() => {
          setSelectedIndex((prev) => (prev + 1) % CONNECTED_SPEECH_DATA.length);
        }}
      />
    </div>
  );
}
