"use client";

// Planned structure:
// <ConnectedSpeechAudioCompare>
//   <CompareUserCard />
//   <CompareCorrectCard />
// </ConnectedSpeechAudioCompare>

import { Play } from "@/components/icons";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { useState, useCallback } from "react";

export function getOptionComparisonData(
  phrase: ConnectedPhrase,
  selectedText: string,
): { userIpa: string; userNote: string; correctNote: string } {
  if (phrase.id === "pick-it-up") {
    if (selectedText.toLowerCase().includes("cup")) {
      return {
        userIpa: "/pɪk ə kʌp/",
        userNote: "Hay una /ə/ corta y una /k/ antes de «up».",
        correctNote: "La /t/ se pega a «up»: suena «tap».",
      };
    }
  }

  return {
    userIpa: phrase.isolatedIpa,
    userNote: `Identificaste la lectura aislada «${selectedText}».`,
    correctNote: `El enlace fonético nativo suena «${phrase.howItSoundsEs.replace(/[«»]/g, "")}».`,
  };
}

export function ConnectedSpeechAudioCompare({
  phrase,
  selectedText,
}: {
  phrase: ConnectedPhrase;
  selectedText: string;
}) {
  const [playingCompare, setPlayingCompare] = useState<"user" | "correct" | null>(null);
  const compData = getOptionComparisonData(phrase, selectedText);

  const handlePlayUserOption = useCallback(() => {
    cancelSpeech();
    setPlayingCompare("user");
    speakText(selectedText, {
      rate: 1.0,
      onEnd: () => setPlayingCompare(null),
      onError: () => setPlayingCompare(null),
    });
  }, [selectedText]);

  const handlePlayCorrectOption = useCallback(() => {
    cancelSpeech();
    setPlayingCompare("correct");
    speakText(phrase.phrase, {
      rate: 1.0,
      onEnd: () => setPlayingCompare(null),
      onError: () => setPlayingCompare(null),
    });
  }, [phrase.phrase]);

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-ink/15 mt-2 animate-fadeIn">
      <span className="font-caption text-xs font-bold text-ink uppercase tracking-wider block">
        ESCUCHA LAS DOS SEGUIDAS
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: TU RESPUESTA */}
        <div className="bg-white border border-ink/15 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
          <button
            type="button"
            onClick={handlePlayUserOption}
            disabled={playingCompare !== null}
            className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer focus-ring disabled:opacity-50"
            title={`Escuchar tu respuesta: ${selectedText}`}
          >
            <Play size={18} className="fill-current ml-0.5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
              TU RESPUESTA
            </span>
            <div className="flex items-baseline gap-1.5">
              <strong className="font-heading font-extrabold text-ink text-base">
                {selectedText}
              </strong>
              <span className="font-ipa text-ink-muted text-xs font-medium">
                {compData.userIpa}
              </span>
            </div>
            <p className="text-caption text-ink-secondary mt-0.5 m-0 text-pretty">
              {compData.userNote}
            </p>
          </div>
        </div>

        {/* Card 2: LO QUE DIJO */}
        <div className="bg-white border-2 border-ink rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <button
            type="button"
            onClick={handlePlayCorrectOption}
            disabled={playingCompare !== null}
            className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer focus-ring disabled:opacity-50"
            title={`Escuchar respuesta correcta: ${phrase.phrase}`}
          >
            <Play size={18} className="fill-current ml-0.5" />
          </button>
          <div>
            <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">
              LO QUE DIJO
            </span>
            <div className="flex items-baseline gap-1.5">
              <strong className="font-heading font-extrabold text-ink text-base">
                {phrase.phrase}
              </strong>
              <span className="font-ipa text-ink-muted text-xs font-medium">
                {phrase.connectedIpa}
              </span>
            </div>
            <p className="text-caption text-ink-secondary mt-0.5 m-0 text-pretty">
              {compData.correctNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
