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
import { BookOpen, Bookmark, BookmarkCheck, RefreshCw, Volume2 } from "@/components/icons";
import Button from "@/components/ui/Button";
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
  inSessionToday?: boolean;
}

function FormattedDefinition({ definition }: { definition: string }) {
  const parts = definition.split(/\s+[—–-]\s+/);
  if (parts.length >= 2) {
    const spanish = parts[0];
    const english = parts.slice(1).join(" — ");
    return (
      <p className="font-body-md leading-relaxed">
        <span className="font-bold text-ink">{spanish}</span>
        <span className="text-ink-secondary font-normal"> — {english}</span>
      </p>
    );
  }
  return (
    <p className="font-body-md text-ink font-semibold leading-relaxed">
      {definition}
    </p>
  );
}

/** Single-word focus — large hero title, clean hierarchy, editorial visual language. */
export default function HomeWordOfDayCard({
  profileLevel = null,
  inSessionToday = false,
}: HomeWordOfDayCardProps) {
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
      className="home-sidebar-card relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-butter p-5 text-ink motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="word-of-day-heading"
    >
      {/* Header: Palabra del día + Categoría gramatical o vínculo con la sesión */}
      <div className="relative z-1 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <BookOpen size={16} className="text-ink" aria-hidden />
          <span id="word-of-day-heading" className="whitespace-nowrap font-kicker text-ink-secondary">
            Palabra del día
          </span>
        </div>
        {inSessionToday ? (
          <span
            className="truncate max-w-[62%] rounded-full bg-ink px-3 py-1 font-sans text-caption font-medium text-paper whitespace-nowrap"
            title="Aparece en tu sesión de hoy"
          >
            En tu sesión de hoy
          </span>
        ) : posLabel ? (
          <span
            className="truncate max-w-[62%] rounded-full bg-butter-deep px-3 py-1 font-sans text-caption font-medium text-ink lowercase whitespace-nowrap"
            title={posLabel}
          >
            {posLabel}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="relative z-1 flex flex-col gap-3 py-1" aria-hidden>
          <div className="h-7 w-3/4 animate-pulse rounded bg-butter-deep" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-butter-deep" />
          <div className="h-4 w-full animate-pulse rounded bg-butter-deep" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-butter-deep" />
        </div>
      )}

      {error && !word && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col items-start gap-2 py-1">
          <p className="font-body-sm text-error">No se pudo cargar la palabra.</p>
          <Button type="button" variant="ej-outline" size="md" onClick={() => refresh()}>
            Reintentar
          </Button>
        </div>
      )}

      {word && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col gap-3" key={word.word}>
          {/* Grupo de título y pronunciación tocable */}
          <button
            type="button"
            onClick={() => speakText(word.word)}
            className="group/listen focus-ring -mx-1.5 flex flex-col gap-1 rounded-xl p-1.5 text-left transition-colors hover:bg-butter-deep cursor-pointer"
            aria-label={`Escuchar pronunciación de ${word.word}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "font-heading font-bold text-ink leading-tight break-words tracking-tight",
                  getHeroScale(word.word)
                )}
              >
                {word.word}
              </span>
              <div className="shrink-0 rounded-full bg-butter-deep p-2 text-ink">
                <Volume2 size={16} aria-hidden />
              </div>
            </div>

            {word.ipa ? (
              <span
                className="font-ipa text-body-md font-medium text-ink-secondary tracking-wide"
                lang="en-fonipa"
              >
                {formatIpaDisplay(word.ipa)}
              </span>
            ) : null}
          </button>

          {/* Significado (definición con formato de resaltado) */}
          {word.definition ? (
            <FormattedDefinition definition={word.definition} />
          ) : null}

          {/* Ejemplo estilo card con kicker y audio */}
          {example ? (
            <HeroTermExample example={example} resetKey={word.word} tone="butter" />
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar (Bookmark) + Otra (Refresh icon) */}
      <div className="relative z-1 flex items-center gap-2 border-t border-ink/15 pt-3">
        <button
          ref={bookmarkRef}
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          aria-pressed={saveState === "saved"}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-1.5 font-body-sm font-medium transition-colors cursor-pointer",
            saveState === "saved"
              ? "bg-ink text-paper cursor-default"
              : "bg-butter-deep text-ink hover:bg-ink hover:text-paper",
            saveState === "error" && "text-error"
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
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-butter-deep px-3 text-ink transition-colors hover:bg-ink hover:text-paper cursor-pointer"
        >
          <RefreshCw
            size={14}
            className={cn(
              "transition-transform duration-300",
              isRotating && "rotate-180"
            )}
            aria-hidden
          />
          <span className="font-body-sm font-medium">Otra</span>
        </button>
      </div>
    </div>
  );
}
