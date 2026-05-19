"use client";

import { useRef, useCallback } from "react";

export function useSharedMicStream() {
  const streamRef = useRef<MediaStream | null>(null);

  const getStream = useCallback(async (): Promise<MediaStream> => {
    if (streamRef.current) return streamRef.current;
    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    return streamRef.current;
  }, []);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  return { getStream, release };
}
