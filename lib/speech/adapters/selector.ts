"use client";

import { WebSpeechAdapter, isWebSpeechReliable } from "./webSpeechAdapter";
import { GeminiAdapter } from "./geminiAdapter";
import type { SpeechInputAdapter, SpeechInputPreference } from "../types";

export type SpeechAdapterKind = "web-speech" | "gemini" | "unsupported";

export interface SpeechAdapterSelectionOptions {
  prefer?: SpeechInputPreference;
  getStream?: () => Promise<MediaStream>;
  endpoint?: string;
}

export function getDefaultAudioStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new Error("Microphone access is not supported in this environment"));
  }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

/**
 * Detects which speech adapter kind should be used based on runtime capabilities
 * and user/system preference.
 *
 * - Google Chrome (reliable Web Speech) -> 'web-speech'
 * - Brave / Edge / Arc / Firefox / Safari (Web Speech missing or unreliable, but mic present) -> 'gemini'
 * - Insecure context or no media devices -> 'unsupported' (or falls back to web-speech feature check)
 */
export function detectSpeechAdapterKind(prefer: SpeechInputPreference = "auto"): SpeechAdapterKind {
  if (typeof window === "undefined") return "unsupported";

  const hasMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const webSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  const webReliable = isWebSpeechReliable();

  if (prefer === "gemini") {
    return hasMedia ? "gemini" : "unsupported";
  }

  if (prefer === "web-speech") {
    return webSupported ? "web-speech" : "unsupported";
  }

  // 'auto': prefer native Web Speech when reliable (real Chrome).
  if (webSupported && webReliable) {
    return "web-speech";
  }

  // Fallback to Gemini when microphone access is available in non-Chrome browsers.
  if (hasMedia) {
    return "gemini";
  }

  return webSupported ? "web-speech" : "unsupported";
}

/**
 * Instantiates the appropriate SpeechInputAdapter for the current environment.
 */
export function createSpeechInputAdapter(
  options: SpeechAdapterSelectionOptions = {}
): SpeechInputAdapter {
  const { prefer = "auto", getStream = getDefaultAudioStream, endpoint } = options;
  const kind = detectSpeechAdapterKind(prefer);

  if (kind === "web-speech") {
    return new WebSpeechAdapter();
  }

  if (kind === "gemini") {
    return new GeminiAdapter(getStream, endpoint);
  }

  return new WebSpeechAdapter();
}
