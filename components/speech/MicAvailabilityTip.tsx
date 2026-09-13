"use client";

// Planned structure:
// <MicAvailabilityTip>
//   title + body (how to restore microphone access)
//   optional dismiss
// </MicAvailabilityTip>

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { canScoreSpeech } from "@/lib/speech/adapters/webSpeechAdapter";
import {
  MIC_UNAVAILABLE_BODY_ES,
  MIC_UNAVAILABLE_TITLE_ES,
  dismissMicTip,
  readMicTipDismissed,
} from "@/lib/speech/browser-support-message";

interface MicAvailabilityTipProps {
  className?: string;
}

/**
 * Shown only when this device genuinely cannot reach a microphone, which is
 * the one thing that stops voice scoring: every browser scores through the
 * Gemini adapter when a mic is available, so there is no browser to recommend
 * and nothing useful to say to a learner whose mic already works.
 */
export default function MicAvailabilityTip({
  className,
}: MicAvailabilityTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readMicTipDismissed()) {
      setVisible(false);
      return;
    }
    setVisible(!canScoreSpeech());
  }, []);

  if (!visible) return null;

  return (
    <aside
      className={cn(
        "flex flex-col gap-2 border-b border-border-subtle bg-surface-raised px-[var(--layout-page-inline)] py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
      role="status"
      aria-labelledby="mic-availability-tip-title"
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <p id="mic-availability-tip-title" className="font-label text-fg">
          {MIC_UNAVAILABLE_TITLE_ES}
        </p>
        <p className="font-body-sm max-w-[65ch] text-pretty text-fg-muted">
          {MIC_UNAVAILABLE_BODY_ES}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          dismissMicTip();
          setVisible(false);
        }}
        className="focus-ring shrink-0 self-start rounded-md px-3 py-2 font-label text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg sm:self-center"
      >
        Entendido
      </button>
    </aside>
  );
}
