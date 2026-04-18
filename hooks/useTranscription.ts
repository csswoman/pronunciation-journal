"use client";

import { useEffect, useRef } from "react";
import type { Phase } from "@/components/lesson/ActiveLessonPage";

interface Options {
  phase: Phase;
  audioUrl: string | null;
  currentWord: string;
  onResult: (transcript: string) => void;
}

export function useTranscription({ phase, audioUrl, currentWord, onResult }: Options) {
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (phase !== "processing" || !audioUrl || inFlightRef.current) return;

    inFlightRef.current = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    fetch("/api/gemini/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ audioDataUrl: audioUrl, targetWord: currentWord }),
    })
      .then((res) => res.ok ? res.json() : res.json().then((d) => Promise.reject(d.error || "transcribe failed")))
      .then((data) => onResult(String(data.transcript ?? "").trim()))
      .catch((err) => {
        console.warn("[STT/Gemini] failed:", err);
        onResult("");
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        inFlightRef.current = false;
      });
  }, [audioUrl, phase, currentWord, onResult]);

  return inFlightRef;
}
