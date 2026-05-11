"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Square, Play, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";

interface WordOfDay {
  word: string;
  ipa: string;
  definition: string;
  example_sentence: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const DIFFICULTY_STYLE: Record<string, React.CSSProperties> = {
  beginner:     { color: "var(--success)",  borderColor: "color-mix(in oklch, var(--success) 40%, transparent)" },
  intermediate: { color: "var(--primary)",  borderColor: "color-mix(in oklch, var(--primary) 40%, transparent)" },
  advanced:     { color: "var(--warning)",  borderColor: "color-mix(in oklch, var(--warning) 40%, transparent)" },
};

const BAR_HEIGHTS = [6, 10, 16, 12, 20, 16, 24, 18, 14, 22, 16, 28, 22, 16, 10, 16, 22, 18, 12, 8, 14, 20, 14, 10, 6];

export default function HomeWordOfDay() {
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [definitionOpen, setDefinitionOpen] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (!navigator.mediaDevices) return;
    setRecordedUrl(null);
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

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

  const difficultyStyle = word
    ? (DIFFICULTY_STYLE[word.difficulty] ?? DIFFICULTY_STYLE.intermediate)
    : DIFFICULTY_STYLE.intermediate;

  return (
    <Card variant="compact" className="gap-4">
      <div className="flex items-center justify-between">
        <span
          className="text-tiny font-bold tracking-widest uppercase border rounded-full px-2 py-0.5"
          style={difficultyStyle}
        >
          Word of the day
        </span>
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
        <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>
      )}

      {word && !loading && (
        <>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-medium text-[var(--text-primary)] leading-none">{word.word}</p>
              <button
                onClick={() => setDefinitionOpen((o) => !o)}
                className="hover:opacity-70 transition-opacity mt-0.5"
                style={{ color: "var(--primary)" }}
                title={definitionOpen ? "Hide meaning" : "Show meaning"}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${definitionOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>
            <p className="font-ipa text-xs font-mono mt-1" style={{ color: "var(--primary)" }}>{word.ipa}</p>

            {definitionOpen && (
              <div
                className="mt-2 rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{word.definition}</p>
                {word.example_sentence && (
                  <p className="text-xs italic leading-snug text-[var(--text-tertiary)]">"{word.example_sentence}"</p>
                )}
              </div>
            )}
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-0.5 h-8">
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className={`block w-1 rounded-full transition-opacity ${speaking || isRecording ? "opacity-100 animate-pulse" : "opacity-40"}`}
                style={{ height: `${h}px`, backgroundColor: `oklch(0.70 0.15 calc(var(--hue) + ${i * 4}))` }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
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
                className="flex-1"
                onClick={startRecording}
                variant="primary"
              >
                Record
              </Button>
            ) : (
              <Button
                icon={<Square size={14} />}
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
              variant="outline"
              icon={<Play size={14} />}
              onClick={playRecording}
              disabled={playingRecording}
            >
              {playingRecording ? "Playing…" : "Play my recording"}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
