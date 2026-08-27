"use client";

import { publicAiErrorMessage } from "@/lib/degradation/messages";
import type { SpeechInputAdapter, SpeechInputResult } from "../types";

export class GeminiAdapter implements SpeechInputAdapter {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType: string = 'audio/webm';
  private aborted = false;
  private inFlight: AbortController | null = null;

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

    this.aborted = false;
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
        // abort() stops the recorder, which fires this handler — bail before
        // spending a transcription request the caller no longer wants.
        if (this.aborted) {
          return reject(new Error(publicAiErrorMessage(undefined, 'cancelled')));
        }
        try {
          const blob = new Blob(this.chunks, { type: this.mimeType });
          const audioDataUrl = await blobToBase64(blob);

          const controller = new AbortController();
          this.inFlight = controller;
          // Gemini transcription runs a fallback chain (flash-lite → flash →
          // latest) server-side, so allow a generous budget before giving up.
          const timeoutId = window.setTimeout(
            () => controller.abort(new DOMException('Transcription timed out', 'TimeoutError')),
            30000
          );

          let res: Response;
          try {
            res = await fetch(this.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({ audioDataUrl }),
            });
          } finally {
            window.clearTimeout(timeoutId);
            this.inFlight = null;
          }

          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            // Surface real server failures (auth, rate-limit, 503, etc.) so the
            // UI shows an actionable error instead of a silent empty transcript.
            throw new Error(publicAiErrorMessage(res.status, d.error));
          }

          const data = await res.json();
          resolve({
            transcript: String(data.transcript ?? '').trim(),
            source: 'gemini',
          });
        } catch (err) {
          // A caller-driven abort() (user cancelled) is not a failure — bail
          // quietly. Only our own timeout carries the TimeoutError name.
          if (err instanceof DOMException && err.name === 'AbortError') {
            return reject(new Error(publicAiErrorMessage(undefined, 'cancelled')));
          }

          const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
          console.warn(
            `[GeminiAdapter] transcription ${timedOut ? 'timed out' : 'failed'}:`,
            err
          );
          // Network/timeout/server errors are reported; the hook maps them to a
          // visible message. (An OK response with an empty transcript — i.e.
          // unintelligible audio — resolves above as transcript: '' instead.)
          const reason = timedOut
            ? 'timeout'
            : err instanceof Error
            ? err.message
            : '';
          reject(new Error(publicAiErrorMessage(undefined, reason)));
        }
      };

      this.recorder.stop();
    });
  }

  abort(): void {
    this.aborted = true;
    this.inFlight?.abort();
    this.inFlight = null;
    try {
      this.recorder?.stop();
    } catch {
      // recorder may already be inactive
    }
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
