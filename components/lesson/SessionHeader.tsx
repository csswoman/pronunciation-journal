"use client";
import Button from "@/components/ui/Button";

import type { Phase } from "./ActiveLessonPage";

interface Props {
  title: string;
  currentIndex: number;
  totalWords: number;
  phase: Phase;
  onBack: () => void;
}

export default function SessionHeader({ title, currentIndex, totalWords, phase, onBack }: Props) {
  return (
    <header
      className="sticky top-0 z-10 border-b"
      style={{
        background: 'linear-gradient(180deg, color-mix(in_oklch,var(--card-bg)_92%,var(--on-primary)), var(--card-bg))',
        borderColor: 'var(--line-divider)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={onBack}
            className="rounded-xl p-2.5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="text-center">
            <h1 className="text-body-lg font-semibold leading-tight tracking-tight" style={{ color: 'var(--deep-text)' }}>{title}</h1>
            <p className="text-caption leading-5" style={{ color: 'var(--text-secondary)' }}>
              {phase !== "complete" ? `${currentIndex + 1} / ${totalWords}` : "Complete"}
            </p>
          </div>
          <div className="w-10" />
        </div>
        {phase !== "complete" && (
          <div className="mt-4 w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--line-divider)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ backgroundColor: 'var(--primary)', width: `${((currentIndex + (phase === "feedback" ? 1 : 0)) / totalWords) * 100}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );
}

