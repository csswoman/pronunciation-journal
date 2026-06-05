"use client";

import { useState } from "react";
import Link from "next/link";
import { Volume2, Mic, Square, Loader2, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { SyllableWord } from "@/components/ui/SyllableWord";
import { CardBadge } from "@/components/ui/CardBadge";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useWordOfDay } from "@/hooks/useWordOfDay";

export default function HomeWordOfDayCard() {
  const { word, loading, error, refresh } = useWordOfDay();
  const [speaking, setSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { start, stop } = useSpeechInput({ prefer: "web-speech" });

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

  async function startRecording() {
    await start();
    setIsRecording(true);
  }

  async function stopRecording() {
    await stop();
    setIsRecording(false);
  }

  const difficultyColor =
    word?.difficulty === "beginner"
      ? "success"
      : word?.difficulty === "advanced"
        ? "warning"
        : "primary";

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
      <div className="flex items-center justify-between gap-2">
        <CardBadge color={difficultyColor}>Word of the day</CardBadge>
        {!loading && (
          <button
            type="button"
            onClick={() => refresh()}
            className="text-fg-subtle transition-colors hover:text-fg-muted"
            aria-label="Refresh word of the day"
            title="Refresh word of the day"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-xs text-fg-muted">
          <Loader2 size={13} className="animate-spin" />
          Loading word…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-2">
          <p className="text-xs text-[var(--error)]">Couldn't load today's word.</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {word && !loading && (
        <>
          <div className="mt-3">
            <p className="font-display text-2xl font-semibold leading-none text-[var(--text-primary)]">
              <SyllableWord word={word.word} />
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-ipa text-sm">{word.ipa}</p>
              {word.part_of_speech ? (
                <span className="text-[11px] rounded border border-border-default bg-surface-sunken px-1.5 py-0.5 font-medium text-fg-muted">
                  {word.part_of_speech}
                </span>
              ) : null}
            </div>
            <div
              className="mt-2 rounded-lg py-2 pl-3"
              style={{ backgroundColor: "color-mix(in oklch, var(--primary) 10%, transparent)" }}
            >
              <p className="text-sm italic leading-relaxed text-[var(--text-secondary)]">
                {word.definition}
              </p>
            </div>
            {word.example_sentence ? (
              <p className="mt-1 text-sm italic text-[var(--text-tertiary)]">
                &ldquo;{word.example_sentence}&rdquo;
              </p>
            ) : null}
          </div>

          <WaveformVisualizer
            isActive={speaking}
            isRecording={isRecording}
            color="gradient"
            className="mt-3 h-8"
          />

          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Volume2 size={14} />}
              className="flex-1"
              onClick={speak}
              disabled={speaking}
            >
              {speaking ? "Playing…" : "Listen"}
            </Button>
            {!isRecording ? (
              <Button
                icon={<Mic size={14} />}
                size="sm"
                className="flex-1"
                onClick={startRecording}
                variant="primary"
              >
                Record
              </Button>
            ) : (
              <Button
                icon={<Square size={14} />}
                size="sm"
                className="flex-1"
                onClick={stopRecording}
                variant="primary"
              >
                Stop
              </Button>
            )}
          </div>

          <Link
            href="/words?tab=lexicon"
            className="mt-3 text-xs text-[var(--primary)] hover:underline"
          >
            Save to vocabulary →
          </Link>
        </>
      )}
    </div>
  );
}
