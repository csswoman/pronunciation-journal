"use client";

import MicButton from "./MicButton";
import PhonemeChips from "./PhonemeChips";
import type { MicState, PhonemeResult } from "./exercise-types";

interface Props {
  micState: MicState;
  showFeedback: boolean;
  phonemeResults: PhonemeResult[];
  coachingLine: string;
  onStart: () => void;
  onStop: () => void;
  onSkip: () => void;
  onKnow: () => void;
  onRetry: () => void;
}

export default function MicBand({
  micState,
  showFeedback,
  phonemeResults,
  coachingLine,
  onStart,
  onStop,
  onSkip,
  onKnow,
  onRetry,
}: Props) {
  return (
    <div className="shrink-0 bg-surface-sunken border-t border-border-subtle">
      <div className="max-w-[1280px] mx-auto px-space-8 py-space-5 flex items-center">
        {/* Left — secondary actions */}
        <div className="flex-[3] flex flex-col items-start gap-space-2">
          <button
            onClick={onSkip}
            className="text-body-sm text-fg-muted hover:text-fg transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onKnow}
            className="text-body-sm text-fg-muted hover:text-fg transition-colors"
          >
            I know this →
          </button>
        </div>

        {/* Center — mic */}
        <div className="flex-[4] flex justify-center">
          <MicButton state={micState} onStart={onStart} onStop={onStop} />
        </div>

        {/* Right — phoneme feedback */}
        <div className="flex-[3] flex justify-end">
          {showFeedback && (
            <PhonemeChips
              results={phonemeResults}
              coachingLine={coachingLine}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}
