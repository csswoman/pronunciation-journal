"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import { WebSpeechAdapter, isWebSpeechReliable } from "@/lib/speech/adapters/webSpeechAdapter";
import { GeminiAdapter } from "@/lib/speech/adapters/geminiAdapter";
import type { SpeechInputResult, SpeechInputAdapter } from "@/lib/speech/types";

// Browsers that report Chrome's UA but lack Google's speech backend key
// (Brave, Edge, Arc, Opera, ...) fail every Web Speech attempt with this error,
// regardless of connectivity. The error surfaces asynchronously (in stop()),
// so we ALSO route these browsers to Gemini up front via isWebSpeechReliable().
// This set remains as a defensive net for the start() path.
const WEB_SPEECH_UNUSABLE_ERRORS = new Set(["network", "service-not-allowed"]);

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
  // Tracks whether we've already fallen back to Gemini for this hook instance,
  // so we don't bounce back to a Web Speech adapter we know is unusable.
  // Stored as state (not a ref) so the adapter is rebuilt on fallback.
  const [usingGeminiFallback, setUsingGeminiFallback] = useState(false);

  const canFallbackToGemini = prefer === 'auto' && !externalAdapter && !!getStream;

  const adapter = useMemo<SpeechInputAdapter>(() => {
    if (externalAdapter) return externalAdapter;

    if (prefer === 'gemini' || usingGeminiFallback) {
      if (!getStream) throw new Error('useSpeechInput: getStream required for gemini adapter');
      return new GeminiAdapter(getStream);
    }

    if (prefer === 'web-speech') {
      return new WebSpeechAdapter();
    }

    // 'auto': use Web Speech only when it's both supported AND reliable in this
    // browser. Brave/Edge/Arc/Opera support the API but fail with "network", so
    // route them straight to Gemini instead of starting a doomed recognition.
    const web = new WebSpeechAdapter();
    if (web.isSupported() && isWebSpeechReliable()) return web;
    if (!getStream) throw new Error('useSpeechInput: getStream required when WebSpeech is unavailable');
    return new GeminiAdapter(getStream);
  }, [externalAdapter, prefer, usingGeminiFallback, getStream]);

  const adapterRef = useRef<SpeechInputAdapter>(adapter);
  adapterRef.current = adapter;

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
      await adapterRef.current!.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start';

      // Web Speech is unusable in this browser (e.g. Brave/Edge/Arc lack
      // Google's key, so every attempt fails with "network"). Retry once
      // immediately with Gemini instead of surfacing a dead-end error.
      if (canFallbackToGemini && !usingGeminiFallback && WEB_SPEECH_UNUSABLE_ERRORS.has(message)) {
        const gemini = new GeminiAdapter(getStream!);
        adapterRef.current = gemini;
        setUsingGeminiFallback(true);
        try {
          setState('listening');
          setError(null);
          setResult(null);
          await gemini.start();
          return;
        } catch (fallbackErr) {
          const fe = fallbackErr instanceof Error ? fallbackErr : new Error('Failed to start');
          setError(fe.message);
          setState('error');
          onError?.(fe);
          return;
        }
      }

      const e = err instanceof Error ? err : new Error(message);
      setError(e.message);
      setState('error');
      onError?.(e);
    }
  }, [isSupported, canFallbackToGemini, usingGeminiFallback, getStream, onError]);

  const stop = useCallback(async () => {
    if (state !== 'listening') return;
    try {
      setState('processing');
      const r = await adapterRef.current!.stop();
      setResult(r);
      setState('done');
      onResult?.(r);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to stop');
      setError(e.message);
      setState('error');
      onError?.(e);
    }
  }, [state, onResult, onError]);

  const abort = useCallback(() => {
    adapterRef.current?.abort();
    setState('idle');
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, isSupported, start, stop, abort, reset };
}
