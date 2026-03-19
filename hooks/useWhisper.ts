"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { WhisperWorkerResponse } from "@/lib/types";

interface UseWhisperOptions {
  onResult?: (text: string) => void;
}

interface UseWhisperReturn {
  isModelLoaded: boolean;
  isModelLoading: boolean;
  isTranscribing: boolean;
  loadProgress: number;
  error: string | null;
  loadModel: () => void;
  transcribe: (audio: Float32Array) => void;
  reset: () => void;
}

export function useWhisper(options: UseWhisperOptions = {}): UseWhisperReturn {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  // Keep onResult in a ref so we don't re-create the worker on every render
  const onResultRef = useRef(options.onResult);
  useEffect(() => { onResultRef.current = options.onResult; }, [options.onResult]);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/workers/whisper.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (event: MessageEvent<WhisperWorkerResponse>) => {
      const { type, text, error: workerError, progress } = event.data;

      switch (type) {
        case "ready":
          setIsModelLoaded(true);
          setIsModelLoading(false);
          setLoadProgress(100);
          break;
        case "result":
          setIsTranscribing(false);
          if (text !== undefined) {
            // Call the callback directly with the transcript
            onResultRef.current?.(text);
          }
          break;
        case "error":
          setError(workerError || "Unknown error");
          setIsModelLoading(false);
          setIsTranscribing(false);
          break;
        case "progress":
          setLoadProgress(progress || 0);
          break;
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModel = useCallback(() => {
    if (!workerRef.current || isModelLoaded || isModelLoading) return;
    setIsModelLoading(true);
    setError(null);
    setLoadProgress(0);
    workerRef.current.postMessage({ type: "load" });
  }, [isModelLoaded, isModelLoading]);

  const transcribe = useCallback(
    (audio: Float32Array) => {
      if (!workerRef.current || !isModelLoaded) {
        setError("Model not loaded yet");
        return;
      }
      setIsTranscribing(true);
      setError(null);
      workerRef.current.postMessage({ type: "transcribe", audio });
    },
    [isModelLoaded]
  );


  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    isModelLoaded,
    isModelLoading,
    isTranscribing,
    loadProgress,
    error,
    loadModel,
    transcribe,
    reset,
  };
}
