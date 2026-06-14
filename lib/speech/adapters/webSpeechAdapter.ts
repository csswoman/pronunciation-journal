"use client";

import type { SpeechInputAdapter, SpeechInputResult } from "../types";

interface BrowserSpeechRecognition {
  lang: string;
  maxAlternatives: number;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
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

export class WebSpeechAdapter implements SpeechInputAdapter {
  private recognition: BrowserSpeechRecognition | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  async start(): Promise<void> {
    const speechWindow = window as SpeechWindow;
    const SR = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SR) throw new Error('Speech recognition not supported');
    this.recognition = new SR();
    this.recognition!.lang = 'en-US';
    this.recognition!.maxAlternatives = 3;
    this.recognition!.continuous = false;
    this.recognition!.interimResults = false;
    this.recognition!.start();
  }

  stop(): Promise<SpeechInputResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) return reject(new Error('Recognition not started'));

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results[0]);
        const best = results.reduce((a, b) =>
          a.confidence > b.confidence ? a : b
        );
        resolve({
          transcript: best.transcript.trim(),
          confidence: best.confidence,
          alternatives: results.map(r => r.transcript.trim()),
          source: 'web-speech',
        });
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(event.error));
      };

      this.recognition.stop();
    });
  }

  abort(): void {
    this.recognition?.abort();
    this.recognition = null;
  }
}
