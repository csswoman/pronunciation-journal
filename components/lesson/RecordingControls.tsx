"use client";

import Button from "@/components/ui/Button";
import type { Phase } from "./ActiveLessonPage";

interface Props {
  phase: Phase;
  currentIndex: number;
  totalWords: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onSkip: () => void;
  onMarkKnown: () => void;
}

export default function RecordingControls({
  phase,
  onStart,
  onStop,
  onCancel,
  onRetry,
  onSkip,
  onMarkKnown,
}: Props) {
  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6">
        <Button
          onClick={onStart}
          variant="danger"
          size="iconLg"
          className="w-28 h-28 shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
          aria-label="Start recording"
          icon={
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          }
        >
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="secondary"
            size="sm"
          >
            Skip
          </Button>
          <Button
            onClick={onMarkKnown}
            variant="secondary"
            size="sm"
          >
            I know this
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex items-center gap-6">
        <Button
          onClick={onCancel}
          aria-label="Cancel recording"
          variant="secondary"
          size="lg"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        >
          Cancel
        </Button>
        <Button
          onClick={onStop}
          variant="ghost"
          size="iconLg"
          className="w-28 h-28 bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg hover:scale-105 animate-pulse"
          aria-label="Stop recording"
          icon={
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          }
        >
        </Button>
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Analyzing pronunciation...</p>
      </div>
    );
  }

  if (phase === "no-audio") {
    return (
      <div className="w-full text-center space-y-5">
        <div className="text-5xl">🎙️</div>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>I didn&apos;t catch that</p>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
          Try speaking a bit louder or closer to the mic.
        </p>
        <Button
          onClick={onRetry}
          variant="primary"
          size="lg"
        >
          Try again
        </Button>
      </div>
    );
  }

  return null;
}
