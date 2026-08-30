"use client";

// Planned structure:
// <HomeChunkOfDayCard>
//   header: "Frase del día" + category chip
//   content:
//     phrase title
//     IPA line + speak button
//     meaning in Spanish
//     divider
//     example quote in English
//   footer:
//     Guardar button + Otra button
// </HomeChunkOfDayCard>

import { useEffect, useState } from "react";
import { Heart, RefreshCw } from "@/components/icons";
import { ListenButton } from "@/components/ui/ListenButton";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { useChunkOfDay } from "@/hooks/useChunkOfDay";
import { quickAddWord, toggleFavorite } from "@/lib/word-bank/queries";
import { speakText } from "@/lib/speech/synthesis";
import { cn } from "@/lib/cn";
import { getIllustration } from "@/lib/illustrations/registry";

const DomainIcon = getIllustration("domainWriting");

type SaveState = "idle" | "saving" | "saved" | "error";

function saveLabel(state: SaveState): string {
  if (state === "saved") return "Guardada";
  if (state === "saving") return "Guardando…";
  if (state === "error") return "No se pudo guardar · reintentar";
  return "Guardar frase";
}

/** Phrase focus — IPA carries domain color; card matches editorial visual language. */
export default function HomeChunkOfDayCard() {
  const { chunk, loading, shuffle } = useChunkOfDay();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setSaveState("idle");
  }, [chunk?.id]);

  async function handleSave() {
    if (!chunk || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const entry = await quickAddWord({
        text: chunk.chunk,
        context: `${chunk.meaning} · Example: "${chunk.example}"`,
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
    shuffle();
    setTimeout(() => setIsRotating(false), 350);
  }

  const label = saveLabel(saveState);

  return (
    <div
      className="home-sidebar-card relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border-default bg-surface-raised p-5 shadow-sm motion-reduce:shadow-none"
      aria-busy={loading || undefined}
      aria-labelledby="chunk-of-day-heading"
    >
      <DomainIcon
        className="home-illustration-watermark text-chunks"
        aria-hidden="true"
      />

      {/* Header: Frase del día + Categoría */}
      <div className="relative z-1 flex items-center justify-between gap-2">
        <span id="chunk-of-day-heading" className="font-label text-caption text-fg-muted">
          Frase del día
        </span>
        {chunk?.category ? (
          <span className="rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-kicker text-fg-muted">
            {chunk.category}
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

      {chunk && !loading && (
        <div className="animate-state-in relative z-1 flex flex-col gap-2.5" key={chunk.id}>
          {/* Título de la frase */}
          <p className="font-heading text-h3 font-bold text-fg leading-tight">
            {chunk.chunk}
          </p>

          {/* IPA + Botón de audio */}
          <div className="flex items-center gap-2">
            {chunk.ipa ? (
              <span
                className="font-ipa text-body-md font-medium text-chunks"
                lang="en-fonipa"
              >
                {formatIpaDisplay(chunk.ipa)}
              </span>
            ) : null}
            <ListenButton
              iconOnly
              aria-label="Escuchar pronunciación"
              onPlay={() => speakText(chunk.chunk)}
            />
          </div>

          {/* Significado en español */}
          <p className="font-body-sm text-fg leading-normal">
            {chunk.meaning}
          </p>

          {/* Divisor sutil */}
          {chunk.example ? (
            <div className="border-t border-border-subtle/50 my-1" />
          ) : null}

          {/* Ejemplo en inglés */}
          {chunk.example ? (
            <p className="font-body-sm italic text-fg leading-relaxed">
              “{chunk.example}”
            </p>
          ) : null}
        </div>
      )}

      {/* Footer de acciones: Guardar + Otra */}
      <div className="relative z-1 flex items-center gap-5 border-t border-border-subtle/40 pt-3">
        <button
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
          aria-label="Ver otra frase"
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
