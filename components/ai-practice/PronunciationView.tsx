"use client";

import { useState, useRef } from "react";
import { Mic, Play, CheckCircle } from "lucide-react";
import { useRecorder } from "@/hooks/useRecorder";

const DEFAULT_PHRASES = [
  "I would appreciate the opportunity",
  "Could you please repeat that?",
  "I'm looking forward to working with you",
  "That sounds like a great idea",
  "I completely understand your point",
];

interface PronunciationViewProps {
  onSubmit?: (audioUrl: string, phrase: string) => void;
}

export default function PronunciationView({ onSubmit }: PronunciationViewProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [customPhrase, setCustomPhrase] = useState("");
  const [inputValue, setInputValue] = useState("");
  const { startRecording, stopRecording, audioUrl, isRecording, resetRecording } = useRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activePhrase = customPhrase || DEFAULT_PHRASES[phraseIndex];

  // Cycle to next phrase when user submits
  const handleSend = () => {
    if (!audioUrl) return;
    onSubmit?.(audioUrl, activePhrase);
    resetRecording();
    if (!customPhrase) setPhraseIndex((i) => (i + 1) % DEFAULT_PHRASES.length);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setCustomPhrase(inputValue.trim());
    setInputValue("");
    resetRecording();
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetRecording();
      startRecording();
    }
  };

  const handleListenModel = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(activePhrase);
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Phrase card */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-tertiary)" }}
        >
          Active pronunciation
        </p>

        {/* Phrase display */}
        <div
          className="w-full max-w-sm px-8 py-7 rounded-2xl border-2 border-dashed text-center"
          style={{ borderColor: "var(--line-divider)" }}
        >
          <p
            className="text-xl leading-snug"
            style={{
              fontFamily: "var(--font-serif, 'DM Serif Display', serif)",
              color: "var(--text-primary)",
            }}
          >
            &ldquo;{activePhrase}&rdquo;
          </p>
        </div>

        {/* Mic button */}
        <button
          onClick={handleMicClick}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all focus:outline-none"
          style={{
            backgroundColor: isRecording ? "transparent" : "var(--card-bg)",
            border: `3px solid ${isRecording ? "#ef4444" : "var(--line-divider)"}`,
            boxShadow: isRecording
              ? "0 0 0 6px rgba(239,68,68,0.15), 0 0 0 12px rgba(239,68,68,0.06)"
              : "0 2px 8px rgba(0,0,0,0.08)",
          }}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <Mic
            size={22}
            style={{ color: isRecording ? "#ef4444" : "var(--text-secondary)" }}
          />
        </button>

        {/* Waveform / audio player */}
        <div
          className="w-full max-w-sm h-14 rounded-xl border flex items-center justify-center overflow-hidden"
          style={{
            borderColor: "var(--line-divider)",
            backgroundColor: "var(--btn-regular-bg)",
          }}
        >
          {audioUrl ? (
            <audio ref={audioRef} src={audioUrl} controls className="w-full h-full opacity-80" />
          ) : (
            <WaveformIdle isRecording={isRecording} />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleListenModel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:opacity-80"
            style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
          >
            <Play size={12} />
            Listen to model
          </button>

          {audioUrl && (
            <button
              onClick={handleSend}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:opacity-80"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <CheckCircle size={12} />
              Send recording
            </button>
          )}
        </div>
      </div>

      {/* Custom phrase input */}
      <div
        className="flex-shrink-0 p-3 border-t"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <form
          onSubmit={handleCustomSubmit}
          className="flex items-center gap-2 p-3 rounded-xl border transition-all focus-within:shadow-md"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--line-divider)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              e.currentTarget.style.borderColor = "var(--line-divider)";
          }}
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="or type the phrase to practice..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-lg text-white transition-colors flex items-center justify-center disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}
            aria-label="Practice phrase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function WaveformIdle({ isRecording }: { isRecording: boolean }) {
  const bars = Array.from({ length: 28 });

  return (
    <div className="flex items-center gap-[3px] px-4">
      {bars.map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: 3,
            backgroundColor: isRecording ? "var(--primary)" : "var(--line-divider)",
            height: isRecording
              ? `${12 + Math.abs(Math.sin(i * 0.7)) * 24}px`
              : "8px",
            opacity: isRecording ? 0.6 + Math.abs(Math.sin(i * 0.5)) * 0.4 : 1,
            animationName: isRecording ? "pulse" : "none",
            animationDuration: `${0.8 + (i % 3) * 0.2}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
