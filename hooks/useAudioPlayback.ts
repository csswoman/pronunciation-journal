"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

type PlaybackSpeed = "normal" | "slow";

interface UseAudioPlaybackState {
  play: (speed: PlaybackSpeed) => Promise<void>;
  currentSpeed: PlaybackSpeed | null;
  stopAll: () => void;
}

const SLOW_RATE = 0.50;
const NORMAL_RATE = 1;

function getPlaybackRate(speed: PlaybackSpeed): number {
  return speed === "slow" ? SLOW_RATE : NORMAL_RATE;
}

export function useAudioPlayback(
  audioUrl: string | null | undefined,
  text: string
): UseAudioPlaybackState {
  const [currentSpeed, setCurrentSpeed] = useState<PlaybackSpeed | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionRef = useRef(0);

  const stopCurrentPlayback = useCallback((resetSession: boolean) => {
    if (resetSession) {
      sessionRef.current += 1;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    setCurrentSpeed(null);
  }, []);

  const stopAll = useCallback(() => {
    stopCurrentPlayback(true);
  }, [stopCurrentPlayback]);

  const play = useCallback(
    async (speed: PlaybackSpeed) => {
      const playbackSession = sessionRef.current + 1;
      sessionRef.current = playbackSession;

      // Stop whatever is currently playing, but keep this new session active.
      stopCurrentPlayback(false);
      setCurrentSpeed(speed);

      const playbackRate = getPlaybackRate(speed);

      const finishIfCurrent = () => {
        if (sessionRef.current === playbackSession) {
          setCurrentSpeed(null);
        }
      };

      const fallbackToSpeech = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          finishIfCurrent();
          return;
        }

        void speakSlow(text, playbackRate, finishIfCurrent, utteranceRef);
      };

      try {
        if (!audioUrl) {
          fallbackToSpeech();
          return;
        }

        const audio =
          audioRef.current ??
          (() => {
            const instance = new Audio();
            instance.preload = "auto";
            audioRef.current = instance;
            return instance;
          })();

        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;

        audio.playbackRate = playbackRate;
        audio.defaultPlaybackRate = playbackRate;
        // Keep the original voice intact when slowing down.
        audio.preservesPitch = true;
        audio.onended = finishIfCurrent;
        audio.onerror = () => {
          if (sessionRef.current !== playbackSession) return;
          fallbackToSpeech();
        };

        const playPromise = audio.play();
        if (playPromise) {
          await playPromise;
        }
      } catch (error) {
        console.error("[useAudioPlayback] Playback failed:", error);

        if (sessionRef.current !== playbackSession) return;
        fallbackToSpeech();
      }
    },
    [audioUrl, stopCurrentPlayback, text]
  );

  useEffect(() => {
    return () => {
      stopCurrentPlayback(true);
    };
  }, [stopCurrentPlayback]);

  return { play, currentSpeed, stopAll };
}

async function speakSlow(
  text: string,
  rate: number,
  finishIfCurrent: () => void,
  utteranceRef: MutableRefObject<SpeechSynthesisUtterance | null>
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    finishIfCurrent();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    await waitForSpeechSynthesisReady();
    await nextAnimationFrame();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.voice = pickEnglishVoice();

    utterance.onend = finishIfCurrent;
    utterance.onerror = finishIfCurrent;

    // Keep a reference so the utterance is not garbage collected mid-playback.
    // This also makes future cancellation more predictable.
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (speechError) {
    console.error("[useAudioPlayback] Speech synthesis failed:", speechError);
    finishIfCurrent();
  }
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  return (
    voices.find((voice) => voice.lang?.toLowerCase() === "en-us") ??
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("en")) ??
    voices[0] ??
    null
  );
}

function waitForSpeechSynthesisReady(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve();
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged, { once: true });
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve();
    }, 500);
  });
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
