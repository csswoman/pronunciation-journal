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
import { Bookmark, BookmarkCheck, RefreshCw, Volume2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import PastelCard from "@/components/layout/PastelCard";
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
    <PastelCard
      tone="coral"
      className="relative flex h-full flex-col justify-between gap-5 overflow-hidden motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="word-of-day-heading"
    >
      {/* Header: Palabra del día + Categoría gramatical o vínculo con la sesión */}
      <div className="relative z-1 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center justify-center shrink-0 rounded-full bg-ink px-4 py-1.5 text-paper">
          <span id="word-of-day-heading" className="whitespace-nowrap font-sans text-caption font-bold tracking-tight text-paper">
            Palabra del día
          </span>
        </div>
        {inSessionToday ? (
          <span
            className="truncate max-w-[62%] rounded-full bg-ink px-3.5 py-1.5 font-sans text-caption font-medium text-paper whitespace-nowrap"
            title="Aparece en tu sesión de hoy"
          >
            En tu sesión de hoy
          </span>
        ) : posLabel ? (
          <span
            className="pastel-card-chip truncate max-w-[62%] rounded-full px-3.5 py-1.5 font-sans text-caption font-medium text-ink-muted lowercase whitespace-nowrap"
            title={posLabel}
          >
            {posLabel}
          </span>
        ) : null}
      </div>

      {loading && (
        <div className="relative z-1 flex flex-col gap-3 py-1" aria-hidden>
          <div className="pastel-card-chip h-8 w-3/4 animate-pulse rounded-xl" />
          <div className="pastel-card-chip h-4 w-1/3 animate-pulse rounded-lg" />
          <div className="pastel-card-chip h-4 w-full animate-pulse rounded-lg" />
          <div className="pastel-card-chip mt-2 h-4 w-5/6 animate-pulse rounded-lg" />
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
          {/* Grupo de título y pronunciación */}
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "font-heading font-extrabold text-ink leading-[1.2] break-words tracking-tight",
                getHeroScale(word.word)
              )}
            >
              {word.word}
            </span>
            <button
              type="button"
              onClick={() => speakText(word.word)}
              className="shrink-0 rounded-full bg-ink p-3 text-paper hover:scale-105 active:scale-95 transition-transform cursor-pointer focus-ring shadow-sm"
              aria-label={`Escuchar pronunciación de ${word.word}`}
            >
              <Volume2 size={18} aria-hidden />
            </button>
          </div>

          {word.ipa ? (
            <span
              className="font-ipa text-body-md font-bold text-ink-secondary tracking-wide -mt-1"
              lang="en-fonipa"
            >
              {formatIpaDisplay(word.ipa)}
            </span>
          ) : null}

          {/* Significado (definición con formato de resaltado) */}
          {word.definition ? (
            <FormattedDefinition definition={word.definition} />
          ) : null}

          {/* Ejemplo estilo card con kicker y audio */}
          {example ? (
            <HeroTermExample example={example} resetKey={word.word} />
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar (Bookmark) + Otra (Refresh icon) */}
      <div className="relative z-1 flex items-center gap-2.5 pt-1">
        <button
          ref={bookmarkRef}
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          aria-pressed={saveState === "saved"}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-2 border-ink px-5 py-2 font-sans text-body-sm font-bold text-ink transition-all cursor-pointer",
            saveState === "saved"
              ? "bg-ink text-paper border-ink cursor-default"
              : "bg-transparent text-ink hover:bg-ink hover:text-paper",
            saveState === "error" && "text-error border-error"
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
          title="Otra palabra"
          className="focus-ring group relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-transparent text-ink transition-all hover:bg-ink/10 hover:scale-105 active:scale-95 cursor-pointer select-none"
        >
          <RefreshCw
            size={18}
            className={cn(
              "transition-transform duration-500",
              isRotating ? "rotate-[360deg] opacity-60" : "group-hover:rotate-45"
            )}
            aria-hidden
          />
          <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 rounded-full bg-ink/15 text-ink px-3 py-1 font-sans text-caption font-semibold whitespace-nowrap shadow-xs">
            Otra palabra
          </span>
        </button>
      </div>
    </PastelCard>
  );
}
