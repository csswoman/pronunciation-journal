"use client";

// Planned structure:
// <HomeWordOfDayCard>
//   header: "Palabra del día" + part of speech chip
//   content:
//     word hero title (large)
//     IPA line + speak button
//     definition in Spanish
//     example block (filete, audio button, translation toggle)
//   footer:
//     Guardar button (Bookmark) + Otra button (Refresh icon)
// </HomeWordOfDayCard>

import { useEffect, useState } from "react";
import { BookOpen, Bookmark, BookmarkCheck, RefreshCw } from "@/components/icons";
import Button from "@/components/ui/Button";
import { ListenButton } from "@/components/ui/ListenButton";
import { HeroTermExample } from "@/components/home/HeroTermExample";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWordOfDay } from "@/hooks/useWordOfDay";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import { readStoredCefrLevel } from "@/lib/essential-words/target-level";
import { readGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { quickAddWord, toggleFavorite } from "@/lib/word-bank/queries";
import { speakText } from "@/lib/speech/synthesis";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { useRetrigger } from "@/hooks/useRetrigger";
import { formatPartOfSpeech } from "@/lib/word-of-day/format-pos";
import { getHeroScale } from "@/lib/home/hero-scale";
import type { Example } from "@/lib/chunk-of-day/types";
import { cn } from "@/lib/cn";

type SaveState = "idle" | "saving" | "saved" | "error";

interface HomeWordOfDayCardProps {
  profileLevel?: string | null;
}

/** Single-word focus — large hero title, clean hierarchy, editorial visual language. */
export default function HomeWordOfDayCard({ profileLevel = null }: HomeWordOfDayCardProps) {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | undefined>(
    profileLevel ? profileLevel.toLowerCase() : undefined
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRotating, setIsRotating] = useState(false);
  const { ref: bookmarkRef, trigger: popBookmark } = useRetrigger<HTMLButtonElement>("animate-heart-pop");

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
    popBookmark();
    playUiCue("save");
  }, [saveState, popBookmark]);

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

  function handleShuffle() {
    setIsRotating(true);
    refresh();
    setTimeout(() => setIsRotating(false), 350);
  }

  const label = saveState === "saved" ? "Guardada" : saveState === "saving" ? "Guardando…" : saveState === "error" ? "No se pudo guardar · reintentar" : "Guardar palabra";
  const posLabel = formatPartOfSpeech(word?.part_of_speech);
  const example: Example | null = word?.example_sentence
    ? {
        kind: "sentence",
        en: word.example_sentence,
        es: word.example_translation ?? "",
      }
    : null;

  return (
    <div
      className="home-sidebar-card relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-xl border border-border-default bg-surface-raised p-4 shadow-xs motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="word-of-day-heading"
    >
      {/* Header: Palabra del día + Categoría gramatical */}
      <div className="relative z-1 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen size={14} className="text-fg-muted" aria-hidden />
          <span id="word-of-day-heading" className="whitespace-nowrap font-label text-caption font-semibold text-fg">
            Palabra del día
          </span>
        </div>
        {posLabel ? (
          <span
            className="rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 font-mono text-caption text-fg-muted lowercase whitespace-nowrap"
            title={posLabel}
          >
            {posLabel}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="relative z-1 flex flex-col gap-3 py-1" aria-hidden>
          <div className="h-7 w-3/4 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-surface-sunken" />
          <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-surface-sunken" />
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
        <div className="animate-state-in relative z-1 flex flex-col gap-3" key={word.word}>
          {/* Grupo de título y pronunciación */}
          <div className="flex flex-col gap-1">
            <p
              className={cn(
                "font-heading font-bold text-fg leading-tight break-words tracking-tight",
                getHeroScale(word.word)
              )}
            >
              {word.word}
            </p>

            <div className="flex items-center gap-2">
              {word.ipa ? (
                <span
                  className="font-ipa text-body-md font-medium text-fg-muted"
                  lang="en-fonipa"
                >
                  {formatIpaDisplay(word.ipa)}
                </span>
              ) : null}
              <ListenButton
                iconOnly
                aria-label="Escuchar pronunciación"
                onPlay={() => speakText(word.word)}
              />
            </div>
          </div>

          {/* Significado (definición) */}
          {word.definition ? (
            <p className="font-body-md text-fg leading-relaxed">
              {word.definition}
            </p>
          ) : null}

          {/* Ejemplo con filete lateral y botón de audio */}
          {example ? (
            <HeroTermExample example={example} resetKey={word.word} />
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar (Bookmark) + Otra (Refresh icon) */}
      <div className="relative z-1 flex items-center gap-2 border-t border-border-subtle/50 pt-3">
        <button
          ref={bookmarkRef}
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          aria-pressed={saveState === "saved"}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 py-1.5 font-body-sm font-medium transition-colors cursor-pointer",
            saveState === "saved"
              ? "border-accent/40 bg-accent/10 text-accent font-medium cursor-default"
              : "border-border-default bg-surface-base text-fg hover:bg-surface-sunken",
            saveState === "error" && "border-error/40 text-error"
          )}
        >
          {saveState === "saved" ? (
            <BookmarkCheck size={16} aria-hidden />
          ) : (
            <Bookmark size={16} aria-hidden />
          )}
          <span>{saveState === "saved" ? "Guardada" : "Guardar"}</span>
        </button>

        <button
          type="button"
          onClick={handleShuffle}
          aria-label="Ver otra palabra"
          className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border-default bg-surface-base text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg cursor-pointer"
        >
          <RefreshCw
            size={15}
            className={cn(
              "transition-transform duration-300",
              isRotating && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
