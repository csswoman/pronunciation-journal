"use client";

import type { SpeechInputAdapter, SpeechInputResult } from "../types";

export class GeminiAdapter implements SpeechInputAdapter {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType: string = 'audio/webm';

  constructor(
    private getStream: () => Promise<MediaStream>,
    private endpoint: string = '/api/gemini/transcribe'
  ) {}

  isSupported(): boolean {
    return typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia;
  }

  async start(): Promise<void> {
    const stream = await this.getStream();
    this.chunks = [];
    this.mimeType = MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/wav';

    this.recorder = new MediaRecorder(stream, { mimeType: this.mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  stop(): Promise<SpeechInputResult> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) return reject(new Error('Recorder not started'));

      this.recorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: this.mimeType });
          const audioDataUrl = await blobToBase64(blob);

          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 10000);

          const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({ audioDataUrl }),
          });

          window.clearTimeout(timeoutId);

          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            // Surface real server failures (auth, rate-limit, 503, etc.) so the
            // UI shows an actionable error instead of a silent empty transcript.
            throw new Error(d.error ?? `transcribe failed (${res.status})`);
          }

          const data = await res.json();
          resolve({
            transcript: String(data.transcript ?? '').trim(),
            source: 'gemini',
          });
        } catch (err) {
          console.warn('[GeminiAdapter] transcription failed:', err);
          // Network/abort/server errors are reported; the hook maps them to a
          // visible message. (An OK response with an empty transcript — i.e.
          // unintelligible audio — resolves above as transcript: '' instead.)
          reject(err instanceof Error ? err : new Error('transcribe failed'));
        }
      };

      this.recorder.stop();
    });
  }

  abort(): void {
    this.recorder?.stop();
    this.recorder = null;
    this.chunks = [];
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}
