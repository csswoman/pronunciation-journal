"use client";

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
        <button
          onClick={onStart}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Start recording"
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--btn-regular-bg)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            Skip →
          </button>
          <button
            onClick={onMarkKnown}
            className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--btn-regular-bg)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            I know this ✓
          </button>
        </div>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div className="flex items-center gap-6">
        <button
          onClick={onCancel}
          aria-label="Cancel recording"
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-base font-medium transition-colors"
          style={{ backgroundColor: 'var(--btn-regular-bg)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
        <button
          onClick={onStop}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center animate-pulse"
          aria-label="Stop recording"
        >
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
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
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}
