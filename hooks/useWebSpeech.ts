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

export function useWebSpeech({ onResult, onError }: UseWebSpeechOptions = {}): UseWebSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const pendingRef = useRef<string>("");
  const disabledByNetworkRef = useRef(false);
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const isSupported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (disabledByNetworkRef.current) return;

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const rec: any = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      pendingRef.current = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      console.log(`[WebSpeech] Interim result: "${pendingRef.current}"`);
    };

    rec.onerror = (e: any) => {
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
