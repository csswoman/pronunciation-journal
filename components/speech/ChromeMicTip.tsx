"use client";

// Planned structure:
// <ChromeMicTip>
//   title + body (Chrome recommendation)
//   optional dismiss
// </ChromeMicTip>

import { useEffect, useState } from "react";
import { Info } from "@/components/icons";
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
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      <aside
        className={cn(
          "flex items-start gap-2.5 text-caption text-fg-muted",
          className,
        )}
        role="note"
        aria-label="Compatibilidad del micrófono"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        <div className="min-w-0">
          <p>
            La práctica con micrófono funciona mejor en Google Chrome.{" "}
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls="chrome-mic-login-details"
              onClick={() => setDetailsOpen((open) => !open)}
              className="font-medium text-fg underline decoration-border-strong underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {detailsOpen ? "Ver menos" : "Ver más"}
            </button>
          </p>
          {detailsOpen ? (
            <p id="chrome-mic-login-details" className="mt-2 max-w-[60ch] text-pretty">
              {CHROME_MIC_TIP_ES}
            </p>
          ) : null}
        </div>
      </aside>
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
