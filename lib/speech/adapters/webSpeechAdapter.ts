"use client";

import type { SpeechInputAdapter, SpeechInputResult } from "../types";

interface BrowserSpeechRecognition {
  lang: string;
  maxAlternatives: number;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

type SpeechWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

type BraveNavigator = Navigator & { brave?: { isBrave?: () => Promise<boolean> } };

/**
 * Mobile browsers are unreliable hosts for Web Speech even when the API is
 * present: Chrome on Android drops recognition when the screen dims or the
 * tab loses focus mid-utterance, and every iOS browser is a WebKit shell
 * whose SpeechRecognition, when exposed at all, routes through Siri dictation
 * with different endpointing. Both surface to the learner as "it did not hear
 * me". Recording the audio ourselves and sending it to Gemini behaves the
 * same on every phone, so mobile is routed there unconditionally.
 *
 * iPadOS reports a desktop user agent, so touch points are checked too.
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;

  if (/Android|iPhone|iPod|IEMobile|Opera Mini|Mobile Safari|CriOS|FxiOS/i.test(ua)) return true;
  if (/iPad/.test(ua)) return true;

  // iPadOS 13+ masquerades as macOS; a Mac with touch points is an iPad.
  if (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1) return true;

  return false;
}

/**
 * Web Speech recognition needs Google's private speech-server key, which only
 * ships in real Google Chrome. Brave, Edge, Arc, Opera, etc. all report
 * "Chrome/" in their UA but lack the key, so every recognition attempt fails
 * asynchronously with error "network" — regardless of connectivity.
 *
 * The "network" error surfaces only after recognition starts (via onerror),
 * so we cannot catch it at start() time to fall back. Instead we detect these
 * browsers up front and route them straight to the Gemini adapter.
 */
export function isWebSpeechReliable(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const nav = navigator as BraveNavigator;

  // Phones and tablets never get Web Speech, whatever the browser claims.
  if (isMobileBrowser()) return false;

  // Brave exposes navigator.brave; treat its mere presence as "not Chrome".
  if (nav.brave !== undefined) return false;
  if (!/Chrome\//.test(ua)) return false;
  if (/Edg\/|EdgA\/|EdgiOS\//.test(ua)) return false; // Edge
  if (/OPR\//.test(ua)) return false; // Opera
  if (/Arc\//.test(ua)) return false; // Arc

  return true;
}

/**
 * Whether this device can score spoken answers at all, by any adapter.
 *
 * Distinct from `isWebSpeechReliable`, which answers the narrower question of
 * whether the *native* recognizer works here. Scoring does NOT require it:
 * `createSpeechInputAdapter` routes every browser without a reliable native
 * recognizer — Firefox, Safari, Brave, Edge, Arc, and every phone — to the
 * Gemini adapter, which records the audio itself and transcribes it server
 * side. So the real precondition is a microphone, not a particular browser.
 *
 * Keep this aligned with `detectSpeechAdapterKind`: it returns 'unsupported'
 * only when neither a microphone nor Web Speech is reachable (an insecure
 * origin, a blocking permission policy, a device with no mic, or SSR).
 *
 * UI that recommends switching browsers must consult this predicate — telling
 * a Firefox or Safari learner their working browser is broken is a falsehood,
 * and pointing someone whose mic is blocked at Chrome does not fix anything.
 */
export function canScoreSpeech(): boolean {
  if (typeof window === 'undefined') return false;
  const hasMic =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  if (hasMic) return true;
  // No mic capture: the native recognizer is the only remaining path, and it
  // must be both present and reliable to produce a score.
  const webSupported =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  return webSupported && isWebSpeechReliable();
}

export class WebSpeechAdapter implements SpeechInputAdapter {
  private recognition: BrowserSpeechRecognition | null = null;
  // The Web Speech API fires `onresult`/`onend` as soon as it detects a pause
  // (continuous = false), which can happen BEFORE the user taps "stop". We must
  // attach handlers in start() and capture the result into this pending promise,
  // otherwise an early result is dropped and stop() resolves with nothing.
  private pending: Promise<SpeechInputResult> | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  async start(): Promise<void> {
    const speechWindow = window as SpeechWindow;
    const SR = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SR) throw new Error('Speech recognition not supported');

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    recognition.continuous = false;
    recognition.interimResults = false;
    this.recognition = recognition;

    this.pending = new Promise<SpeechInputResult>((resolve, reject) => {
      let settled = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results[0]);
        const best = results.reduce((a, b) =>
          a.confidence > b.confidence ? a : b
        );
        settled = true;
        resolve({
          transcript: best.transcript.trim(),
          confidence: best.confidence,
          alternatives: results.map(r => r.transcript.trim()),
          source: 'web-speech',
        });
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        settled = true;
        reject(new Error(event.error));
      };

      // Recognition ended without producing a result (e.g. silence, or stop()
      // called before any speech was captured).
      recognition.onend = () => {
        if (!settled) {
          settled = true;
          reject(new Error('no-speech'));
        }
      };
    });

    recognition.start();
  }

  stop(): Promise<SpeechInputResult> {
    if (!this.recognition || !this.pending) {
      return Promise.reject(new Error('Recognition not started'));
    }
    // Ask recognition to finalize; the result arrives via the handlers attached
    // in start(). If it already fired, `pending` is already resolved.
    this.recognition.stop();
    return this.pending;
  }

  abort(): void {
    this.recognition?.abort();
    this.recognition = null;
    this.pending = null;
  }
}
