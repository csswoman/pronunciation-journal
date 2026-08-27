"use client";

// Planned structure:
// <HomeWordOfDayCard>
//   kicker
//   word mark (neutral text) + heart — card left border + IPA in --c-vocabulario
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
import { playUiCue } from "@/lib/ui-sounds/cues";
import { useRetrigger } from "@/hooks/useRetrigger";
import { getIllustration } from "@/lib/illustrations/registry";

const DomainIcon = getIllustration("domainDictionary");

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "Guardada";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar palabra";
}

interface HomeWordOfDayCardProps {
  profileLevel?: string | null;
}

/** Single-word focus — IPA carries domain color; card stays neutral. */
export default function HomeWordOfDayCard({ profileLevel = null }: HomeWordOfDayCardProps) {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | undefined>(
    profileLevel ? profileLevel.toLowerCase() : undefined
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const { ref: heartRef, trigger: popHeart } = useRetrigger<HTMLButtonElement>("animate-heart-pop");

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

  useEffect(() => {
    if (saveState !== "saved") return;
    popHeart();
    playUiCue("save");
  }, [saveState, popHeart]);

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
      className="home-sidebar-card relative flex flex-col gap-3 overflow-hidden"
      aria-busy={loading || undefined}
    >
      <DomainIcon
        className="home-illustration-watermark text-vocabulario"
        aria-hidden="true"
      />
      <span className="relative z-1 font-label text-fg">Palabra del día</span>

      {loading && (
        <div className="relative z-1 flex flex-col gap-2 py-1" aria-hidden>
          <div className="h-9 w-32 animate-pulse rounded-sm bg-surface-sunken" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
        </div>
      )}

      {error && !word && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col items-start gap-2 py-1">
          <p className="font-body-sm text-error">No se pudo cargar la palabra.</p>
          <Button type="button" variant="ghost" size="md" onClick={() => refresh()}>
            Reintentar
          </Button>
        </div>
      )}

      {word && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col gap-2.5" key={word.word}>
          <div className="flex items-center gap-2">
            <p className="home-editorial-mark min-w-0">
              <SyllableWord word={word.word} />
            </p>
            <div className="group/tooltip relative shrink-0">
              <button
                ref={heartRef}
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
                  size={22}
                  fill={saveState === "saved" ? "currentColor" : "none"}
                  aria-hidden
                />
              </button>
              <span
                id="word-save-tooltip"
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-sm border border-border-default bg-surface-raised px-2 py-1 text-caption font-medium text-fg opacity-0 shadow-md transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
              >
                {label}
              </span>
            </div>
          </div>
          {word.ipa ? (
            <p className="-mt-1.5 font-ipa text-body-lg leading-snug text-vocabulario">
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
