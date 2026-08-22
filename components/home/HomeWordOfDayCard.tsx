"use client";

// Planned structure:
// <HomeWordOfDayCard>
//   kicker
//   word mark (accent-1 highlight on the word only) + heart
//   IPA + definition + example line
// </HomeWordOfDayCard>

import { useEffect, useState } from "react";
import { Heart } from "@/components/icons";
import Button from "@/components/ui/Button";
import { SyllableWord } from "@/components/ui/SyllableWord";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWordOfDay } from "@/hooks/useWordOfDay";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { readStoredCefrLevel } from "@/lib/essential-words/target-level";
import { readGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { cn } from "@/lib/cn";
import { quickAddWord, toggleFavorite } from "@/lib/word-bank/queries";

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "En Tracking";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar en Tracking";
}

interface HomeWordOfDayCardProps {
  profileLevel?: string | null;
}

/** Single-word focus — accent lives on the word mark, not the card shell. */
export default function HomeWordOfDayCard({ profileLevel = null }: HomeWordOfDayCardProps) {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | undefined>(
    profileLevel ? profileLevel.toLowerCase() : undefined
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    if (profileLevel) return;
    let cancelled = false;
    const isGuest = isAnonymousUser(user);
    const storedLevel = isGuest
      ? Promise.resolve(readGuestStudyLevel())
      : (user?.id ? readStoredCefrLevel(user.id) : Promise.resolve(null));
    void storedLevel.then((l) => {
      if (!cancelled && l) setLevel(l.toLowerCase());
    });
    return () => {
      cancelled = true;
    };
  }, [user, profileLevel]);

  const { word, loading, error, refresh } = useWordOfDay(level);

  useEffect(() => {
    setSaveState("idle");
  }, [word?.word]);

  async function handleSave() {
    if (!word || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const entry = await quickAddWord({
        text: word.word,
        context: word.example_sentence || word.definition || null,
        source: "manual",
      });
      await toggleFavorite(entry.id, true);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const label = saveLabel(saveState);

  return (
    <div
      className="home-sidebar-card flex flex-col gap-3"
      aria-busy={loading || undefined}
    >
      <span className="font-kicker text-fg-subtle">Palabra del día</span>

      {loading && (
        <div className="flex flex-col gap-2 py-1" aria-hidden>
          <div className="h-9 w-32 animate-pulse rounded-sm bg-surface-sunken" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
        </div>
      )}

      {error && !word && !loading && (
        <div className="animate-state-in flex flex-col items-start gap-2 py-1">
          <p className="font-body-sm text-error">No se pudo cargar la palabra.</p>
          <Button type="button" variant="ghost" size="md" onClick={() => refresh()}>
            Reintentar
          </Button>
        </div>
      )}

      {word && !loading && (
        <div className="animate-state-in flex flex-col gap-2.5" key={word.word}>
          <div className="flex items-start gap-2">
            <p className="home-editorial-mark min-w-0">
              <SyllableWord word={word.word} />
            </p>
            <div className="group relative shrink-0 pt-0.5">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveState === "saving" || saveState === "saved"}
                aria-label={label}
                aria-describedby="word-save-tooltip"
                className={cn(
                  "focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm transition-colors",
                  saveState === "saved"
                    ? "text-error"
                    : "text-fg-muted hover:text-fg",
                  saveState === "error" && "text-error",
                )}
              >
                <Heart
                  size={18}
                  fill={saveState === "saved" ? "currentColor" : "none"}
                  aria-hidden
                />
              </button>
              <span
                id="word-save-tooltip"
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-caption font-medium text-fg opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {label}
              </span>
            </div>
          </div>
          {word.ipa ? (
            <p className="font-ipa text-body-lg leading-snug text-fg-muted">
              {formatIpaDisplay(word.ipa)}
            </p>
          ) : null}
          {word.definition ? (
            <p className="max-w-[42ch] font-body-sm text-pretty text-fg-muted">
              {word.definition}
            </p>
          ) : null}
          {word.example_sentence ? (
            <p className="border-t border-border-subtle pt-2.5 font-body-sm text-pretty italic text-fg">
              “{word.example_sentence}”
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
