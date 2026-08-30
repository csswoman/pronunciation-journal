"use client";

// Planned structure:
// <HomeWordOfDayCard>
//   header: "Palabra del día" + part of speech chip
//   content:
//     word title
//     IPA line + speak button
//     definition in Spanish
//     divider
//     example quote in English
//   footer:
//     Guardar button + Otra button
// </HomeWordOfDayCard>

import { useEffect, useState } from "react";
import { Heart, RefreshCw } from "@/components/icons";
import Button from "@/components/ui/Button";
import { ListenButton } from "@/components/ui/ListenButton";
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
import { cn } from "@/lib/cn";
import { getIllustration } from "@/lib/illustrations/registry";

const DomainIcon = getIllustration("domainDictionary");

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "Guardada";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar palabra";
}

const POS_LABELS: Record<string, string> = {
  noun: "Sustantivo",
  verb: "Verbo",
  adjective: "Adjetivo",
  adverb: "Adverbio",
  phrase: "Frase",
  idiom: "Modismo",
  preposition: "Preposición",
};

function formatPartOfSpeech(pos?: string): string | null {
  if (!pos) return null;
  const key = pos.toLowerCase().trim();
  return POS_LABELS[key] ?? pos;
}

interface HomeWordOfDayCardProps {
  profileLevel?: string | null;
}

/** Single-word focus — IPA carries domain color; card matches editorial visual language. */
export default function HomeWordOfDayCard({ profileLevel = null }: HomeWordOfDayCardProps) {
  const { user } = useAuth();
  const [level, setLevel] = useState<string | undefined>(
    profileLevel ? profileLevel.toLowerCase() : undefined
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRotating, setIsRotating] = useState(false);
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

  function handleShuffle() {
    setIsRotating(true);
    refresh();
    setTimeout(() => setIsRotating(false), 350);
  }

  const label = saveLabel(saveState);
  const posLabel = formatPartOfSpeech(word?.part_of_speech);

  return (
    <div
      className="home-sidebar-card relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border-default bg-surface-raised p-5 shadow-sm motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="word-of-day-heading"
    >
      <DomainIcon
        className="home-illustration-watermark text-vocabulario"
        aria-hidden="true"
      />

      {/* Header: Palabra del día + Categoría gramatical */}
      <div className="relative z-1 flex items-center justify-between gap-2">
        <span id="word-of-day-heading" className="font-label text-caption text-fg-muted">
          Palabra del día
        </span>
        {posLabel ? (
          <span className="rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-kicker text-fg-muted">
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
        <div className="animate-state-in relative z-1 flex flex-col gap-2.5" key={word.word}>
          {/* Título de la palabra */}
          <p className="font-heading text-h3 font-bold text-fg leading-tight">
            {word.word}
          </p>

          {/* IPA + Botón de audio */}
          <div className="flex items-center gap-2">
            {word.ipa ? (
              <span
                className="font-ipa text-body-md font-medium text-vocabulario"
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

          {/* Definición en español */}
          {word.definition ? (
            <p className="font-body-sm text-fg leading-normal">
              {word.definition}
            </p>
          ) : null}

          {/* Divisor sutil */}
          {word.example_sentence ? (
            <div className="border-t border-border-subtle/50 my-1" />
          ) : null}

          {/* Ejemplo en inglés */}
          {word.example_sentence ? (
            <p className="font-body-sm italic text-fg leading-relaxed">
              “{word.example_sentence}”
            </p>
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar + Otra */}
      <div className="relative z-1 flex items-center gap-5 border-t border-border-subtle/40 pt-3">
        <button
          ref={heartRef}
          type="button"
          onClick={() => void handleSave()}
          disabled={saveState === "saving" || saveState === "saved"}
          aria-label={label}
          className={cn(
            "focus-ring inline-flex items-center gap-1.5 font-body-sm transition-colors",
            saveState === "saved"
              ? "text-error font-medium"
              : "text-fg-muted hover:text-fg",
            saveState === "error" && "text-error"
          )}
        >
          <Heart
            size={16}
            fill={saveState === "saved" ? "currentColor" : "none"}
            className={saveState === "saved" ? "text-error" : ""}
            aria-hidden
          />
          <span>{saveState === "saved" ? "Guardada" : "Guardar"}</span>
        </button>

        <button
          type="button"
          onClick={handleShuffle}
          aria-label="Ver otra palabra"
          className="focus-ring inline-flex items-center gap-1.5 font-body-sm text-fg-muted transition-colors hover:text-fg"
        >
          <RefreshCw
            size={14}
            className={cn(
              "transition-transform duration-300",
              isRotating && "rotate-180"
            )}
            aria-hidden
          />
          <span>Otra</span>
        </button>
      </div>
    </div>
  );
}
