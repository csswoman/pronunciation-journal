"use client";

import { useCallback, useState, useMemo } from "react";
import { WebSpeechAdapter } from "@/lib/speech/adapters/webSpeechAdapter";
import { GeminiAdapter } from "@/lib/speech/adapters/geminiAdapter";
import type { SpeechInputResult, SpeechInputAdapter } from "@/lib/speech/types";

export type SpeechInputPreference = 'web-speech' | 'gemini' | 'auto';
export type SpeechInputState = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported';

interface UseSpeechInputOptions {
  prefer?: SpeechInputPreference;
  getStream?: () => Promise<MediaStream>;
  adapter?: SpeechInputAdapter;
  onResult?: (result: SpeechInputResult) => void;
  onError?: (error: Error) => void;
}

interface UseSpeechInputReturn {
  state: SpeechInputState;
  result: SpeechInputResult | null;
  error: string | null;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  abort: () => void;
  reset: () => void;
}

export function useSpeechInput({
  prefer = 'auto',
  getStream,
  adapter: externalAdapter,
  onResult,
  onError,
}: UseSpeechInputOptions = {}): UseSpeechInputReturn {
  const [state, setState] = useState<SpeechInputState>('idle');
  const [result, setResult] = useState<SpeechInputResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adapter = useMemo<SpeechInputAdapter>(() => {
    if (externalAdapter) return externalAdapter;
    const web = new WebSpeechAdapter();

    if (prefer === 'gemini') {
      if (!getStream) throw new Error('useSpeechInput: getStream required for gemini adapter');
      return new GeminiAdapter(getStream);
    }

    if (prefer === 'web-speech') {
      return web;
    }

    // 'auto': prefer web-speech for quick phoneme exercises, fallback to gemini
    if (web.isSupported()) return web;
    if (!getStream) throw new Error('useSpeechInput: getStream required when WebSpeech is unavailable');
    return new GeminiAdapter(getStream);
  }, [externalAdapter, prefer, getStream]);

  const isSupported = adapter.isSupported();

  const start = useCallback(async () => {
    if (!isSupported) {
      setState('unsupported');
      return;
    }
    try {
      setState('listening');
      setError(null);
      setResult(null);
      await adapter.start();
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to start');
      setError(e.message);
      setState('error');
      onError?.(e);
    }
  }, [adapter, isSupported, onError]);

  const stop = useCallback(async () => {
    if (state !== 'listening') return;
    try {
      setState('processing');
      const r = await adapter.stop();
      setResult(r);
      setState('done');
      onResult?.(r);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to stop');
      setError(e.message);
      setState('error');
      onError?.(e);
    }
  }, [adapter, state, onResult, onError]);

  const abort = useCallback(() => {
    adapter.abort();
    setState('idle');
    setError(null);
  }, [adapter]);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, isSupported, start, stop, abort, reset };
}
