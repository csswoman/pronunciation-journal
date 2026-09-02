"use client";

// Planned structure:
// <ContentFunctionEarTrainer>
//   <EarTrainerHeader />
//   <EarTrainerAudioControls />
//   <SentenceTokenGrid />
//   <AcousticMapCard />
// </ContentFunctionEarTrainer>

import { useState, useCallback, useEffect } from "react";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface WordItem {
  text: string;
  type: "content" | "function";
  fullIpa: string;
  reducedIpa?: string;
  note?: string;
}

interface TrainerPhrase {
  id: string;
  sentence: string;
  translation: string;
  words: WordItem[];
  explanation: string;
}

const PHRASES: TrainerPhrase[] = [
  {
    id: "store-milk",
    sentence: "I can go to the store for some milk",
    translation: "Puedo ir a la tienda por algo de leche",
    words: [
      { text: "I", type: "function", fullIpa: "/aɪ/", note: "Átono" },
      { text: "can", type: "function", fullIpa: "/kæn/", reducedIpa: "/kən/", note: "Schwa" },
      { text: "go", type: "content", fullIpa: "/ɡoʊ/", note: "Verbo principal" },
      { text: "to", type: "function", fullIpa: "/tuː/", reducedIpa: "/tə/", note: "Schwa" },
      { text: "the", type: "function", fullIpa: "/ðiː/", reducedIpa: "/ðə/", note: "Schwa" },
      { text: "store", type: "content", fullIpa: "/stɔːr/", note: "Sustantivo" },
      { text: "for", type: "function", fullIpa: "/fɔːr/", reducedIpa: "/fər/", note: "Schwa" },
      { text: "some", type: "function", fullIpa: "/sʌm/", reducedIpa: "/səm/", note: "Schwa" },
      { text: "milk", type: "content", fullIpa: "/mɪlk/", note: "Sustantivo" },
    ],
    explanation:
      "Solo 3 palabras transmiten el mensaje real ('go', 'store', 'milk'). Todas las demás son palabras funcionales comprimidas al sonido neutro schwa /ə/.",
  },
  {
    id: "station-hour",
    sentence: "She was waiting at the station for an hour",
    translation: "Ella estuvo esperando en la estación durante una hora",
    words: [
      { text: "She", type: "function", fullIpa: "/ʃiː/", note: "Pronombre átono" },
      { text: "was", type: "function", fullIpa: "/wɒz/", reducedIpa: "/wəz/", note: "Schwa" },
      { text: "waiting", type: "content", fullIpa: "/ˈweɪ.tɪŋ/", note: "Verbo acentuado" },
      { text: "at", type: "function", fullIpa: "/æt/", reducedIpa: "/ət/", note: "Schwa" },
      { text: "the", type: "function", fullIpa: "/ðiː/", reducedIpa: "/ðə/", note: "Schwa" },
      { text: "station", type: "content", fullIpa: "/ˈsteɪ.ʃən/", note: "Sustantivo" },
      { text: "for", type: "function", fullIpa: "/fɔːr/", reducedIpa: "/fər/", note: "Schwa" },
      { text: "an", type: "function", fullIpa: "/æn/", reducedIpa: "/ən/", note: "Schwa" },
      { text: "hour", type: "content", fullIpa: "/ˈaʊ.ər/", note: "Sustantivo" },
    ],
    explanation:
      "El oído nativo salta de 'waiting' a 'station' y a 'hour'. Las preposiciones y artículos intermedios son solo puentes rítmicos.",
  },
  {
    id: "talk-about-it",
    sentence: "Tell him that we have to talk about it",
    translation: "Dile que tenemos que hablar de ello",
    words: [
      { text: "Tell", type: "content", fullIpa: "/tɛl/", note: "Verbo imperativo" },
      { text: "him", type: "function", fullIpa: "/hɪm/", reducedIpa: "/ɪm/", note: "Elisión de /h/" },
      { text: "that", type: "function", fullIpa: "/ðæt/", reducedIpa: "/ðət/", note: "Schwa" },
      { text: "we", type: "function", fullIpa: "/wiː/", reducedIpa: "/wi/", note: "Átono" },
      { text: "have", type: "function", fullIpa: "/hæv/", reducedIpa: "/hæf/", note: "Asimilación" },
      { text: "to", type: "function", fullIpa: "/tuː/", reducedIpa: "/tə/", note: "Schwa" },
      { text: "talk", type: "content", fullIpa: "/tɔːk/", note: "Verbo acentuado" },
      { text: "about", type: "function", fullIpa: "/əˈbaʊt/", note: "Preposición" },
      { text: "it", type: "function", fullIpa: "/ɪt/", note: "Pronombre átono" },
    ],
    explanation:
      "'Tell' y 'talk' reciben toda la energía articulatoria. 'Tell him' omite la /h/ (/tɛl ɪm/) y 'have to' se asimila a /hæftə/.",
  },
];

export default function ContentFunctionEarTrainer() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<Record<number, boolean>>({});
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentPhrase = PHRASES[phraseIndex];

  useEffect(() => {
    cancelSpeech();
    setSelectedWords({});
    setIsRevealed(false);
    setIsPlayingAudio(false);
    return () => cancelSpeech();
  }, [phraseIndex]);

  const handlePlayAudio = useCallback(
    (rate: number) => {
      cancelSpeech();
      setIsPlayingAudio(true);
      speakText(currentPhrase.sentence, {
        rate,
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    },
    [currentPhrase.sentence]
  );

  const toggleWord = (idx: number) => {
    if (isRevealed) return;
    setSelectedWords((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleNext = () => {
    setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
  };

  const contentWords = currentPhrase.words.filter((w) => w.type === "content");
  const functionWords = currentPhrase.words.filter((w) => w.type === "function");

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm layout-stack-md my-6">
      <header className="flex flex-col gap-1">
        <span className="font-kicker text-primary text-xs tracking-wider uppercase">
          Laboratorio de Escucha Activa
        </span>
        <h3 className="text-h3 text-fg font-semibold">Entrenador de Discriminación Acústica</h3>
        <p className="text-body-sm text-fg-muted">
          Escucha la frase a velocidad normal o lenta. Toca las palabras que consideres de{" "}
          <strong>contenido</strong> (las que transmiten la idea esencial) y luego revela el mapa acústico.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 py-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePlayAudio(1.0)}
          disabled={isPlayingAudio}
          className="gap-2"
        >
          <span aria-hidden="true">🔊</span> Escuchar (1.0x)
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePlayAudio(0.65)}
          disabled={isPlayingAudio}
          className="gap-2"
        >
          <span aria-hidden="true">🐢</span> Lento (0.65x)
        </Button>
        <span className="text-caption text-fg-muted ml-auto">
          Frase {phraseIndex + 1} de {PHRASES.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-surface-raised border border-border items-center justify-center min-h-[90px]">
        {currentPhrase.words.map((item, idx) => {
          const isSelected = !!selectedWords[idx];
          const isContent = item.type === "content";
          let tokenStyle = "border-border bg-surface text-fg hover:border-primary/50";

          if (isRevealed) {
            if (isContent) {
              tokenStyle = "border-primary bg-primary/10 text-primary font-semibold shadow-xs";
            } else {
              tokenStyle = "border-border/50 bg-surface-sunken text-fg-muted line-through-none opacity-75";
            }
          } else if (isSelected) {
            tokenStyle = "border-primary bg-primary text-white font-medium";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleWord(idx)}
              aria-pressed={isSelected}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-body-md transition-all duration-150 flex flex-col items-center",
                tokenStyle
              )}
            >
              <span>{item.text}</span>
              {isRevealed && (
                <span
                  className={cn(
                    "text-[10px] font-mono tracking-tight",
                    isContent ? "text-primary font-medium" : "text-fg-muted"
                  )}
                >
                  {isContent ? item.fullIpa : item.reducedIpa ?? item.fullIpa}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant={isRevealed ? "secondary" : "primary"}
            size="sm"
            onClick={() => setIsRevealed((prev) => !prev)}
          >
            {isRevealed ? "Ocultar análisis" : "Revelar mapa acústico"}
          </Button>
          {isRevealed && (
            <Button variant="ghost" size="sm" onClick={handleNext}>
              Siguiente frase →
            </Button>
          )}
        </div>
        <p className="text-caption text-fg-muted italic">«{currentPhrase.translation}»</p>
      </div>

      {isRevealed && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 layout-stack-sm animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Palabras de contenido (Acentuadas)
              </span>
              <ul className="mt-1 text-caption text-fg layout-stack-xs list-disc pl-4">
                {contentWords.map((w, i) => (
                  <li key={i}>
                    <strong>{w.text}</strong> {w.fullIpa} — {w.note}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
                Formas débiles y reducciones
              </span>
              <ul className="mt-1 text-caption text-fg-muted layout-stack-xs list-disc pl-4">
                {functionWords.map((w, i) => (
                  <li key={i}>
                    <span>{w.text}</span>: de {w.fullIpa} →{" "}
                    <strong className="text-fg font-mono">{w.reducedIpa ?? w.fullIpa}</strong> ({w.note})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-caption text-fg border-t border-border/50 pt-2 mt-2">
            💡 <strong>Lo que procesa el oído:</strong> {currentPhrase.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
