"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRecorder } from "@/hooks/useRecorder";

export type VoiceState =
  | "idle"
  | "recording"
  | "transcribing"
  | "speaking";

interface UseAIVoiceOptions {
  /** Called with the transcript after recording stops */
  onTranscript: (text: string) => void;
}

interface UseAIVoiceReturn {
  voiceEnabled: boolean;
  voiceState: VoiceState;
  toggleVoice: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  /** Plays text via TTS. Returns when playback ends (or on error). */
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
}

export function useAIVoice({ onTranscript }: UseAIVoiceOptions): UseAIVoiceReturn {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const { startRecording, stopRecording, isRecording, audioUrl, resetRecording } = useRecorder();

  // Keep a ref to cancel in-flight transcribe
  const transcribeAbortRef = useRef<AbortController | null>(null);
  // Track current utterance for cancellation
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // When audioUrl updates after stop, kick off transcription
  const audioUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!audioUrl || audioUrl === audioUrlRef.current) return;
    audioUrlRef.current = audioUrl;

    if (voiceState !== "recording") return; // guard: only when we triggered the stop

    setVoiceState("transcribing");

    const controller = new AbortController();
    transcribeAbortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    fetch("/api/gemini/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ audioDataUrl: audioUrl }),
    })
      .then(res => res.ok ? res.json() : res.json().then((d: { error?: string }) => Promise.reject(d.error ?? "transcribe failed")))
      .then((data: { transcript?: string }) => {
        const text = String(data.transcript ?? "").trim();
        if (text) onTranscript(text);
      })
      .catch(err => {
        if ((err as Error)?.name !== "AbortError") console.warn("[useAIVoice] transcribe failed:", err);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        setVoiceState("idle");
        resetRecording();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) {
        // Turning off: cancel anything in flight
        transcribeAbortRef.current?.abort();
        window.speechSynthesis?.cancel();
        setVoiceState("idle");
      }
      return !prev;
    });
  }, []);

  const startListening = useCallback(async () => {
    if (!voiceEnabled || isRecording) return;
    window.speechSynthesis?.cancel(); // stop any ongoing TTS
    setVoiceState("recording");
    await startRecording();
  }, [voiceEnabled, isRecording, startRecording]);

  const stopListening = useCallback(() => {
    if (!isRecording) return;
    stopRecording();
    // voiceState stays "recording" until audioUrl effect fires
  }, [isRecording, stopRecording]);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!voiceEnabled || !text.trim()) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setVoiceState("speaking");

    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utteranceRef.current = utterance;

      utterance.onend = () => {
        setVoiceState("idle");
        resolve();
      };
      utterance.onerror = () => {
        setVoiceState("idle");
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [voiceEnabled]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    setVoiceState("idle");
  }, []);

  return {
    voiceEnabled,
    voiceState,
    toggleVoice,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}
