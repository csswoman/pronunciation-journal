"use client";

import { useState, useCallback, useEffect } from "react";
import { Volume2, Loader2, RotateCcw, BookmarkPlus, BookmarkCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { SyllableWord } from "@/components/ui/SyllableWord";
import { CardBadge } from "@/components/ui/CardBadge";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { useWordOfDay } from "@/hooks/useWordOfDay";
import { useAuth } from "@/components/auth/AuthProvider";
import { isWordInBank, quickAddWord } from "@/lib/word-bank/queries";

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
    if (!word || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
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
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
      <div className="flex items-center justify-between gap-2">
        <CardBadge>Word of the day</CardBadge>
        {!loading && (
          <button
            type="button"
            onClick={() => refresh()}
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-surface-sunken hover:text-[var(--text-secondary)]"
            aria-label="Refresh word of the day"
            title="Refresh word of the day"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {loading && (
        <div className="font-caption flex items-center gap-2 py-4 text-[var(--text-tertiary)]">
          <Loader2 size={13} className="animate-spin" />
          Loading word…
        </div>
      )}

      {error && !word && !loading && (
        <div className="animate-state-in flex flex-col items-start gap-2 py-2">
          <p className="font-caption text-[var(--error)]">Couldn&apos;t load today&apos;s word.</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => refresh()}>
            Try again
          </Button>
        </div>
      )}

      {word && !loading && (
        <div className="animate-state-in" key={word.word}>
          <div className="mt-3">
            <p className="font-display text-display-word font-semibold leading-none text-[var(--text-primary)]">
              <SyllableWord word={word.word} />
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-ipa text-sm">{word.ipa}</p>
              {word.part_of_speech ? (
                <span className="font-tiny rounded border border-border-default bg-surface-sunken px-1.5 py-0.5 text-[var(--text-tertiary)]">
                  {word.part_of_speech}
                </span>
              ) : null}
              {word.difficulty ? (
                <span className="font-tiny rounded border border-border-default bg-surface-sunken px-1.5 py-0.5 capitalize text-[var(--text-tertiary)]">
                  {word.difficulty}
                </span>
              ) : null}
            </div>
            <div className="bg-primary-wash mt-2 rounded-lg py-2 pl-3">
              <p className="font-body-sm max-w-[65ch] italic leading-relaxed text-[var(--text-secondary)]">
                {word.definition}
              </p>
            </div>
            {word.example_sentence ? (
              <p className="font-body-sm mt-1 max-w-[65ch] italic text-[var(--text-tertiary)]">
                &ldquo;{word.example_sentence}&rdquo;
              </p>
            ) : null}
          </div>

          {speaking && (
            <WaveformVisualizer isActive isRecording={false} color="gradient" className="mt-3 h-8" />
          )}

          <div className={`flex gap-2 ${speaking ? "mt-3" : "mt-4"}`}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Volume2 size={14} />}
              className="flex-1 justify-center"
              onClick={speak}
              disabled={speaking}
            >
              {speaking ? "Playing…" : "Listen"}
            </Button>

            {user && (
              <Button
                variant={saved ? "ghost" : "primary"}
                size="sm"
                icon={saved ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                className="flex-1 justify-center"
                onClick={() => void handleSave()}
                disabled={saved || saving}
              >
                {saving ? "Saving…" : saved ? "Saved" : "Add to words"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
