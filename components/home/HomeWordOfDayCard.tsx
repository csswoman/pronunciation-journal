"use client";

import { useState, useCallback, useEffect } from "react";
import { Volume2, Loader2, RotateCcw, BookmarkPlus, BookmarkCheck } from "@/components/icons";
import Button from "@/components/ui/Button";
import { SyllableWord } from "@/components/ui/SyllableWord";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { useWordOfDay } from "@/hooks/useWordOfDay";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { isWordInBank, quickAddWord } from "@/lib/word-bank/queries";
import { speakText } from "@/lib/speech/synthesis";

export default function HomeWordOfDayCard() {
  const { word, loading, error, refresh } = useWordOfDay();
  const { user } = useAuth();
  const [speaking, setSpeaking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !word) return;
    let cancelled = false;
    void isWordInBank(word.word)
      .then((exists) => { if (!cancelled) setSaved(exists); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [user, word]);

  function speak() {
    if (!word) return;
    speakText(word.word, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    });
  }

  const handleSave = useCallback(async () => {
    if (!user || !word || saved || saving) return;
    setSaving(true);
    try {
      await quickAddWord({ text: word.word, context: word.example_sentence || word.definition });
      setSaved(true);
    } catch {
      // silent — user can retry
    } finally {
      setSaving(false);
    }
  }, [user, word, saved, saving]);

  return (
    <div className="home-sidebar-card flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-label text-fg">Palabra del día</span>
        {!loading && (
          <button
            type="button"
            onClick={() => refresh()}
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
            aria-label="Otra palabra"
            title="Otra palabra"
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {loading && (
        <div className="font-caption flex items-center gap-2 py-2 text-fg-muted">
          <Loader2 size={15} className="animate-spin" />
          Cargando…
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
        <div className="animate-state-in" key={word.word}>
          <p className="font-mono text-display-word font-semibold leading-tight text-fg">
            <SyllableWord word={word.word} />
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {word.ipa ? (
              <p className="font-ipa text-body-lg leading-snug text-fg-muted">{formatIpaDisplay(word.ipa)}</p>
            ) : null}
            {word.part_of_speech ? (
              <span className="font-caption rounded-md border border-border-default bg-surface-sunken px-2 py-0.5 text-fg-muted">
                {word.part_of_speech}
              </span>
            ) : null}
            {word.difficulty ? (
              <span className="font-caption rounded-md border border-border-default bg-surface-sunken px-2 py-0.5 capitalize text-fg-muted">
                {word.difficulty}
              </span>
            ) : null}
          </div>
          {word.definition ? (
            <p className="font-body-sm mt-2 line-clamp-2 text-fg-muted" title={word.definition}>
              {word.definition}
            </p>
          ) : null}
          {word.example_sentence ? (
            <p className="font-body-sm mt-1.5 line-clamp-2 text-pretty text-fg italic">
              &ldquo;{word.example_sentence}&rdquo;
            </p>
          ) : null}

          {speaking && (
            <WaveformVisualizer isActive isRecording={false} color="gradient" className="mt-2 h-6" />
          )}

          <div className={`flex gap-2 ${speaking ? "mt-2" : "mt-3"}`}>
            <Button
              variant="secondary"
              size="md"
              icon={<Volume2 size={18} />}
              className="flex-1 justify-center"
              onClick={speak}
              disabled={speaking}
            >
              {speaking ? "…" : "Escuchar"}
            </Button>

            {user && (
              <Button
                variant={saved ? "ghost" : "secondary"}
                size="md"
                icon={saved ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
                className="flex-1 justify-center"
                onClick={() => void handleSave()}
                disabled={saved || saving}
              >
                {saving ? "…" : saved ? "Guardada" : "Añadir"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
