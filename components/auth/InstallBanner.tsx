"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 mb-4 rounded-xl bg-primary-soft border border-primary/20">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">📲</span>
        <p className="text-sm font-medium text-fg truncate">Install the app for offline practice</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-fg-subtle hover:text-fg transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
