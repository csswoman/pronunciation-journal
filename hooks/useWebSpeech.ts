"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface UseWebSpeechOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseWebSpeechReturn {
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function useWebSpeech({ onResult, onError }: UseWebSpeechOptions = {}): UseWebSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const pendingRef = useRef<string>("");
  const disabledByNetworkRef = useRef(false);
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const isSupported =
    typeof window !== "undefined" &&
    !!((window as WindowWithSpeech).SpeechRecognition ?? (window as WindowWithSpeech).webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (disabledByNetworkRef.current) return;

    const SR = (window as WindowWithSpeech).SpeechRecognition ?? (window as WindowWithSpeech).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEventLike) => {
      pendingRef.current = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      console.log(`[WebSpeech] Interim result: "${pendingRef.current}"`);
    };

    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      const error = String(e.error || "unknown");
      if (error === "network") {
        console.info("[WebSpeech] network unavailable; using fallback STT");
        disabledByNetworkRef.current = true;
      } else if (error !== "no-speech") {
        console.warn("[WebSpeech] error:", error);
      }
      onErrorRef.current?.(error);
      setIsListening(false);
      onResultRef.current?.(pendingRef.current);
      recognitionRef.current = null;
    };

    // Default onend: recognition stopped without explicit stopListening call
    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    pendingRef.current = "";

    try {
      rec.start();
      setIsListening(true);
    } catch (err) {
      console.error("[WebSpeech] Failed to start:", err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      onResultRef.current?.("");
      return;
    }
    // Override onend so we can deliver the transcript once stop completes
    rec.onend = () => {
      setIsListening(false);
      onResultRef.current?.(pendingRef.current);
      recognitionRef.current = null;
    };
    rec.stop();
  }, []);

  return { isSupported, isListening, startListening, stopListening };
}
