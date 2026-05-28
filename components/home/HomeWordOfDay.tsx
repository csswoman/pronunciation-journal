"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Square, Play, Loader2, RotateCcw } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import { SyllableWord } from "@/components/ui/SyllableWord";
import { CardBadge } from "@/components/ui/CardBadge";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { useSpeechInput } from "@/hooks/useSpeechInput";

interface WordOfDay {
  word: string;
  ipa: string;
  part_of_speech?: string;
  definition: string;
  example_sentence: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}


export default function HomeWordOfDay() {
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [speaking, setSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { state, result, start, stop } = useSpeechInput({ prefer: "web-speech" });

  useEffect(() => {
    const cached = sessionStorage.getItem("wod");
    const cachedDate = sessionStorage.getItem("wod_date");
    const today = new Date().toISOString().slice(0, 10);
    if (cached && cachedDate === today) {
      setWord(JSON.parse(cached));
      return;
    }
    fetchWord();
  }, []);

  async function fetchWord(forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh
        ? `/api/gemini/word-of-day?refresh=1&t=${Date.now()}`
        : "/api/gemini/word-of-day";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      const data: WordOfDay = await res.json();
      setWord(data);
      sessionStorage.setItem("wod", JSON.stringify(data));
      sessionStorage.setItem("wod_date", new Date().toISOString().slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load word");
    } finally {
      setLoading(false);
    }
  }

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
    setRecordedUrl(null);
    await start();
    setIsRecording(true);
  }

  async function stopRecording() {
    await stop();
    setIsRecording(false);
  }

  useEffect(() => {
    if (state !== "done") return;
    const transcript = result?.transcript ?? "";
    if (!transcript) return;
    const blob = new Blob([transcript], { type: "text/plain" });
    setRecordedUrl(URL.createObjectURL(blob));
  }, [state, result]);

  function playRecording() {
    if (!recordedUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(recordedUrl);
    audioRef.current = audio;
    audio.onplay = () => setPlayingRecording(true);
    audio.onended = () => setPlayingRecording(false);
    audio.onerror = () => setPlayingRecording(false);
    audio.play();
  }

  return (
    <Card variant="compact" className="gap-4">
      <div className="flex items-center justify-between">
        <CardBadge color={word?.difficulty === "beginner" ? "success" : word?.difficulty === "advanced" ? "warning" : "primary"}>
          Word of the day
        </CardBadge>
        {!loading && (
          <button
            onClick={() => fetchWord(true)}
            className="transition-colors text-fg-subtle hover:text-fg-muted"
            title="Refresh"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs py-2 text-fg-muted">
          <Loader2 size={13} className="animate-spin" />
          Loading word…
        </div>
      )}

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {word && !loading && (
        <>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)] leading-none"><SyllableWord word={word.word} /></p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-ipa">{word.ipa}</p>
              {word.part_of_speech && (
                <span className="text-tiny font-medium px-1.5 py-0.5 rounded bg-surface-sunken border border-border-default text-fg-muted">
                  {word.part_of_speech}
                </span>
              )}
            </div>
            <div className="mt-2 pl-3 py-2 rounded-lg flex flex-col gap-1" style={{ backgroundColor: "color-mix(in oklch, var(--primary) 10%, transparent)" }}>
              <p className="text-body-sm italic leading-relaxed text-[var(--text-secondary)]">{word.definition}</p>
              {word.example_sentence && (
                <p className="text-body-sm italic leading-snug text-[var(--text-tertiary)]">"{word.example_sentence}"</p>
              )}
            </div>
          </div>

          {/* Waveform */}
          <WaveformVisualizer
            isActive={speaking || playingRecording}
            isRecording={isRecording}
            color="gradient"
            className="h-8"
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
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
                size="md"
                className="flex-1"
                onClick={startRecording}
                variant="primary"
              >
                Record
              </Button>
            ) : (
              <Button
                icon={<Square size={14} />}
                size="md"
                className="flex-1"
                onClick={stopRecording}
                variant="primary"
              >
                Stop
              </Button>
            )}
          </div>

          {recordedUrl && (
            <Button
              variant="secondary"
              size="md"
              icon={<Play size={14} />}
              onClick={playRecording}
              disabled={playingRecording}
              fullWidth
            >
              {playingRecording ? "Playing…" : "Play my recording"}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
