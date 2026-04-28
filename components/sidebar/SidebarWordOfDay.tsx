"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Square, Play, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import { useSidebar } from "@/components/sidebar/SidebarContext";

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

const BAR_HEIGHTS = [6, 10, 16, 12, 20, 14, 24, 18, 14, 20, 12, 16, 10, 6, 12, 18, 14, 8];

export default function SidebarWordOfDay() {
  const { collapsed } = useSidebar();

  const [word, setWord] = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [definitionOpen, setDefinitionOpen] = useState(false);

  // TTS
  const [speaking, setSpeaking] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (collapsed) return;
    const cached = sessionStorage.getItem("wod");
    const cachedDate = sessionStorage.getItem("wod_date");
    const today = new Date().toISOString().slice(0, 10);
    if (cached && cachedDate === today) {
      setWord(JSON.parse(cached));
      return;
    }
    fetchWord();
  }, [collapsed]);

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

  if (collapsed) return null;

  const difficultyStyle = word
    ? (DIFFICULTY_STYLE[word.difficulty] ?? DIFFICULTY_STYLE.intermediate)
    : DIFFICULTY_STYLE.intermediate;

  return (
    <div
      className="mx-3 mb-3 rounded-2xl overflow-hidden p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold tracking-widest uppercase border rounded-full px-2 py-0.5"
          style={difficultyStyle}
        >
          Word of the day
        </span>
        {!loading && (
          <button
            onClick={() => fetchWord(true)}
            className="transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
            title="Refresh"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs py-2" style={{ color: "var(--text-secondary)" }}>
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
              <p className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{word.word}</p>
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
            <p className="text-sm font-mono mt-0.5" style={{ color: "var(--primary)" }}>{word.ipa}</p>

            {definitionOpen && (
              <div
                className="mt-1 rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
              >
                <p className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{word.definition}</p>
                {word.example_sentence && (
                  <p className="text-[10px] italic leading-snug" style={{ color: "var(--text-tertiary)" }}>"{word.example_sentence}"</p>
                )}
              </div>
            )}
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-[3px] h-7">
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className={`block w-[3px] rounded-full transition-opacity ${speaking || isRecording ? "opacity-100 animate-pulse" : "opacity-40"}`}
                style={{ height: `${h}px`, backgroundColor: `oklch(0.70 0.15 calc(var(--hue) + ${i * 4}))` }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={speak}
              disabled={speaking}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2 transition-colors disabled:opacity-50"
              style={{ color: "var(--text-primary)", border: "1px solid var(--border)", backgroundColor: "var(--btn-regular-bg)" }}
            >
              <Volume2 size={13} />
              {speaking ? "Playing…" : "Listen"}
            </button>

            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2 transition-colors accent-button"
              >
                <Mic size={13} />
                Record
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2 transition-colors"
                style={{ backgroundColor: "var(--error)", color: "oklch(1 0 0)" }}
              >
                <Square size={13} />
                Stop
              </button>
            )}
          </div>

          {/* Playback row */}
          {recordedUrl && (
            <button
              onClick={playRecording}
              disabled={playingRecording}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl py-2 transition-colors disabled:opacity-50"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", backgroundColor: "var(--btn-regular-bg)" }}
            >
              <Play size={13} />
              {playingRecording ? "Playing…" : "Play my recording"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
