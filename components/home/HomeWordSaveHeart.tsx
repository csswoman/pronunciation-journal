"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/cn";
import { isWordInBank, quickAddWord } from "@/lib/word-bank/queries";

interface HomeWordSaveHeartProps {
  word: string;
  context?: string | null;
}

export default function HomeWordSaveHeart({ word, context }: HomeWordSaveHeartProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }

    let cancelled = false;
    void isWordInBank(word)
      .then((exists) => {
        if (!cancelled) setSaved(exists);
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, word]);

  const handleSave = useCallback(async () => {
    if (!user || saved || saving) return;

    setSaving(true);
    try {
      await quickAddWord({ text: word, context: context ?? null });
      setSaved(true);
      setShowTip(true);
      window.setTimeout(() => setShowTip(false), 2200);
    } catch {
      // Leave heart outline; user can retry
    } finally {
      setSaving(false);
    }
  }, [user, saved, saving, word, context]);

  if (!user) return null;

  const label = saved ? "Añadido a vocabulario" : "Añadir a vocabulario";

  return (
    <div className="relative">
      {showTip ? (
        <span
          role="status"
          className="animate-state-in pointer-events-none absolute bottom-full right-0 z-10 mb-1.5 whitespace-nowrap rounded-md border border-border-subtle bg-surface-tooltip px-2 py-1 font-caption text-[var(--on-primary)] shadow-md"
        >
          Añadido a vocabulario
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saved || saving}
        className={cn(
          "focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors",
          saved
            ? "cursor-default text-[var(--primary)]"
            : "text-[var(--text-tertiary)] hover:bg-surface-sunken hover:text-[var(--text-secondary)]",
        )}
        aria-label={label}
        title={label}
      >
        {saving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Heart size={15} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
