"use client";

import { useState, useCallback, useEffect } from "react";
import { CONNECTED_SPEECH_DATA, type ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SelfPlaybackAudioBar } from "./SelfPlaybackAudioBar";
import Button from "@/components/ui/Button";
import { Volume2, Mic, ArrowRight, Check, Sparkles } from "@/components/icons";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { cn } from "@/lib/cn";

export function ConnectedSpeechTrainer() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const currentPhrase = CONNECTED_SPEECH_DATA[selectedIndex] ?? CONNECTED_SPEECH_DATA[0];

  const {
    status,
    result: speechResult,
    userAudioUrl,
    errorCode,
    isSupported,
    start,
    stop,
    reset,
  } = useSpeechRecognition();

  useEffect(() => {
    cancelSpeech();
    setIsPlayingAudio(false);
    setIsPlayingSlow(false);
    reset();
  }, [selectedIndex, reset]);

  const handlePlayConnected = useCallback(() => {
    cancelSpeech();
    setIsPlayingAudio(true);
    speakText(currentPhrase.phrase, {
      rate: 1.0,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  }, [currentPhrase.phrase]);

  const handlePlaySlow = useCallback(() => {
    cancelSpeech();
    setIsPlayingSlow(true);
    speakText(currentPhrase.phrase, {
      rate: 0.65,
      onEnd: () => setIsPlayingSlow(false),
      onError: () => setIsPlayingSlow(false),
    });
  }, [currentPhrase.phrase]);

  const filteredList =
    activeCategory === "all"
      ? CONNECTED_SPEECH_DATA
      : CONNECTED_SPEECH_DATA.filter((p) => p.category === activeCategory);

  const isListening = status === "listening";
  const isDone = status === "done";

  // Check if transcript matches target phrase
  const isCorrect =
    isDone &&
    speechResult?.transcript &&
    speechResult.transcript.toLowerCase().replace(/[^a-z0-9 ]/g, "") ===
      currentPhrase.phrase.toLowerCase().replace(/[^a-z0-9 ]/g, "");

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Todos los enlaces" },
          { id: "linking-cv", label: "Consonante + Vocal" },
          { id: "flap-t", label: "Flap T (/ɾ/)" },
          { id: "intrusion", label: "Intrusión (/w/ y /j/)" },
          { id: "weak-forms", label: "Formas Débiles" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.id);
              const firstMatch = CONNECTED_SPEECH_DATA.findIndex(
                (p) => cat.id === "all" || p.category === cat.id,
              );
              if (firstMatch >= 0) setSelectedIndex(firstMatch);
            }}
            className={cn(
              "rounded-full px-3.5 py-1.5 font-label text-xs transition-colors",
              activeCategory === cat.id
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "bg-surface-raised border border-border-default text-fg-muted hover:text-fg hover:bg-surface-sunken",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Phrase Card */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border-default bg-surface-raised p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-caption uppercase tracking-wider text-xs font-semibold text-primary">
              {currentPhrase.categoryNameEs}
            </span>
            <h2 className="text-h1 font-bold text-fg mt-1">
              &ldquo;{currentPhrase.phrase}&rdquo;
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlaySlow}
              disabled={isPlayingSlow || isPlayingAudio}
              className={cn(
                "flex h-11 items-center gap-1.5 rounded-full border border-border-default bg-surface-base px-3.5 text-caption font-semibold text-fg transition-transform hover:scale-105 active:scale-95",
                isPlayingSlow && "border-primary text-primary animate-pulse",
              )}
              title="Escuchar lento (0.65x)"
            >
              <span>🐢 0.65x</span>
            </button>

            <button
              type="button"
              onClick={handlePlayConnected}
              disabled={isPlayingAudio || isPlayingSlow}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-primary text-on-primary transition-transform hover:scale-105 active:scale-95 shadow-sm",
                isPlayingAudio && "animate-pulse ring-2 ring-primary/40",
              )}
              title="Escuchar habla conectada normal"
              aria-label="Escuchar habla conectada normal"
            >
              <Volume2 size={20} />
            </button>
          </div>
        </div>

        {/* Visual Linking Representation */}
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-wash/50 p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="font-caption text-xs font-bold text-primary uppercase tracking-wider">
              Enlace Fonético en Acción
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-body-lg font-bold text-fg py-2">
            {currentPhrase.phrase.split(" ").map((w, idx, arr) => {
              const isLinked =
                currentPhrase.linkedWords.includes(w.replace(/[^a-zA-Z]/g, "")) &&
                idx < arr.length - 1;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border-default shadow-xs">
                    {w}
                  </span>
                  {isLinked && (
                    <span className="inline-flex items-center gap-1 text-primary font-mono text-xs px-2 py-0.5 rounded-full bg-primary-soft border border-primary/30 animate-pulse">
                      <span>🔗</span>
                      <span>/{currentPhrase.linkSound}/</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Phonetic Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle/60 text-body-sm">
            <div>
              <span className="font-caption text-xs text-fg-muted block">Pronunciación aislada (antinatural):</span>
              <span className="font-ipa text-fg-muted line-through">{currentPhrase.isolatedIpa}</span>
            </div>
            <div>
              <span className="font-caption text-xs text-primary font-semibold block">Habla conectada nativa:</span>
              <span className="font-ipa text-primary font-bold text-base">{currentPhrase.connectedIpa}</span>
            </div>
          </div>
        </div>

        {/* How it sounds & tip */}
        <div className="rounded-xl border border-border-subtle bg-surface-base p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-caption text-xs font-semibold text-fg-muted">Cómo suena al oído:</span>
            <span className="font-label text-sm font-bold text-fg bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
              {currentPhrase.howItSoundsEs}
            </span>
          </div>
          <p className="text-body-sm text-fg-muted mt-2 text-pretty">
            {currentPhrase.explanationEs}
          </p>
        </div>

        {/* Mic Recording for Connected Speech Shadowing */}
        {isSupported && (
          <div className="flex flex-col gap-3 pt-2 border-t border-border-subtle">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant={isListening ? "error" : "primary"}
                size="lg"
                onClick={isListening ? stop : start}
                className="w-full sm:w-auto min-w-[200px]"
              >
                <Mic size={18} className={isListening ? "animate-pulse" : ""} />
                {isListening ? "Detener grabación" : "Grabar mi repetición (Shadowing)"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setSelectedIndex((prev) => (prev + 1) % CONNECTED_SPEECH_DATA.length);
                }}
                className="w-full sm:w-auto"
              >
                Siguiente frase
                <ArrowRight size={16} />
              </Button>
            </div>

            {/* Self-playback comparison bar when user speaks */}
            {isDone && (
              <div className="pt-2">
                <SelfPlaybackAudioBar
                  targetWord={currentPhrase.phrase}
                  userAudioUrl={userAudioUrl}
                />
                {speechResult?.transcript && (
                  <p className="mt-2 text-body-sm text-fg">
                    Reconocido: <strong className="font-medium text-primary">&ldquo;{speechResult.transcript}&rdquo;</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
