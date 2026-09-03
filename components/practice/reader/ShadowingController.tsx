'use client';

// Planned structure:
// <ShadowingController>
//   <ShadowingPlaybackBar />
// </ShadowingController>

import { useState, useEffect, useRef } from 'react';
import {
  splitIntoSentences,
  estimateSentenceSpeechDurationMs,
  type SentenceSegment,
  type ShadowingSettings,
  DEFAULT_SHADOWING_SETTINGS,
} from '@/lib/speech/shadowing';
import { ShadowingPlaybackBar, type PlaybackPhase } from './ShadowingPlaybackBar';

interface ShadowingControllerProps {
  passageText: string;
  online: boolean;
  onActiveSentenceChange?: (index: number | null) => void;
  requestedSentenceIdx?: number | null;
}

export function ShadowingController({
  passageText,
  online,
  onActiveSentenceChange,
  requestedSentenceIdx,
}: ShadowingControllerProps) {
  const sentences = useRef<SentenceSegment[]>(splitIntoSentences(passageText)).current;

  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<PlaybackPhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShadowingMode, setIsShadowingMode] = useState(true);
  const [settings, setSettings] = useState<ShadowingSettings>(DEFAULT_SHADOWING_SETTINGS);

  const echoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onActiveSentenceChange?.(activeSentenceIdx);
  }, [activeSentenceIdx, onActiveSentenceChange]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopAll() {
    setIsPlaying(false);
    setPhase('idle');
    setActiveSentenceIdx(null);
    if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function playSentence(index: number) {
    if (index >= sentences.length) {
      stopAll();
      return;
    }

    const currentSentence = sentences[index];
    if (!currentSentence) return;

    setActiveSentenceIdx(index);
    setPhase('listening');
    setIsPlaying(true);

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSentence.text);
    utterance.lang = 'en-US';
    utterance.rate = settings.playbackRate;

    utterance.onend = () => {
      if (!isShadowingMode) {
        // En modo continuo, pasa directo a la siguiente
        playSentence(index + 1);
        return;
      }

      // En modo Shadowing: Fase de Eco (pausa para que el usuario repita)
      setPhase('echoing');
      const echoDurationMs =
        estimateSentenceSpeechDurationMs(currentSentence.wordCount, settings.playbackRate) *
        settings.pauseMultiplier;

      echoTimerRef.current = setTimeout(() => {
        if (settings.autoAdvance) {
          playSentence(index + 1);
        } else {
          setPhase('idle');
          setIsPlaying(false);
        }
      }, echoDurationMs);
    };

    utterance.onerror = () => {
      stopAll();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Handle click-to-play from the text in ReaderExercise
  useEffect(() => {
    if (requestedSentenceIdx !== undefined && requestedSentenceIdx !== null) {
      playSentence(requestedSentenceIdx);
    }
  }, [requestedSentenceIdx]);

  function togglePlay() {
    if (isPlaying) {
      stopAll();
    } else {
      const startIdx = activeSentenceIdx ?? 0;
      playSentence(startIdx);
    }
  }

  function handleRepeat() {
    if (activeSentenceIdx !== null) {
      if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
      playSentence(activeSentenceIdx);
    } else {
      playSentence(0);
    }
  }

  function handleNext() {
    if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
    const nextIdx = (activeSentenceIdx ?? -1) + 1;
    playSentence(nextIdx);
  }

  const currentSegment = activeSentenceIdx !== null ? sentences[activeSentenceIdx] : null;

  return (
    <ShadowingPlaybackBar
      isShadowingMode={isShadowingMode}
      onToggleShadowingMode={(enabled) => {
        setIsShadowingMode(enabled);
        if (isPlaying) stopAll();
      }}
      playbackRate={settings.playbackRate}
      onSelectPlaybackRate={(rate) => {
        setSettings((s) => ({ ...s, playbackRate: rate }));
        if (isPlaying && activeSentenceIdx !== null) {
          playSentence(activeSentenceIdx);
        }
      }}
      isPlaying={isPlaying}
      onTogglePlay={togglePlay}
      onRepeat={handleRepeat}
      onNext={handleNext}
      online={online}
      totalSentences={sentences.length}
      activeSentenceIdx={activeSentenceIdx}
      phase={phase}
      currentSegment={currentSegment}
    />
  );
}
