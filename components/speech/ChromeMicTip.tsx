"use client";

// Planned structure:
// <ChromeMicTip>
//   title + body (Chrome recommendation)
//   optional dismiss
// </ChromeMicTip>

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { isWebSpeechReliable } from "@/lib/speech/adapters/webSpeechAdapter";
import {
  CHROME_MIC_BANNER_BODY_ES,
  CHROME_MIC_BANNER_TITLE_ES,
  CHROME_MIC_TIP_ES,
  dismissChromeMicTip,
  readChromeMicTipDismissed,
} from "@/lib/speech/browser-support-message";

type ChromeMicTipVariant = "login" | "app";

interface ChromeMicTipProps {
  variant?: ChromeMicTipVariant;
  className?: string;
  /**
   * login — always show a quiet tip (helps before first practice).
   * app — only when Web Speech is unreliable, and dismissible.
   */
}

/**
 * Soft Chrome recommendation for microphone / pronunciation scoring.
 * Not a modal — product tip that respects dismissals in the app shell.
 */
export default function ChromeMicTip({
  variant = "app",
  className,
}: ChromeMicTipProps) {
  const [visible, setVisible] = useState(variant === "login");

  useEffect(() => {
    if (variant === "login") {
      setVisible(true);
      return;
    }
    if (readChromeMicTipDismissed()) {
      setVisible(false);
      return;
    }
    setVisible(!isWebSpeechReliable());
  }, [variant]);

  if (!visible) return null;

  if (variant === "login") {
    return (
      <p
        className={cn(
          "rounded-md border border-border-subtle bg-surface-sunken px-3 py-2.5 font-body-sm text-pretty text-fg-muted",
          className,
        )}
        role="note"
      >
        {CHROME_MIC_TIP_ES}
      </p>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col gap-2 border-b border-border-subtle bg-surface-raised px-[var(--layout-page-inline)] py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
      role="status"
      aria-labelledby="chrome-mic-tip-title"
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <p id="chrome-mic-tip-title" className="font-label text-fg">
          {CHROME_MIC_BANNER_TITLE_ES}
        </p>
        <p className="font-body-sm max-w-[65ch] text-pretty text-fg-muted">
          {CHROME_MIC_BANNER_BODY_ES}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          dismissChromeMicTip();
          setVisible(false);
        }}
        className="focus-ring shrink-0 self-start rounded-md px-3 py-2 font-label text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg sm:self-center"
      >
        Entendido
      </button>
    </aside>
  );
}
