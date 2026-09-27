"use client";

// Planned structure:
// <ConnectedSpeechVoiceFeedback>
//   <FeedbackHeader />          → recuento real de palabras entendidas
//   <HeardTranscript />         → lo que devolvió el reconocedor
//   <WordRecognitionChips />    → cada palabra: entendida / no entendida
//   <LinkingSelfCheck />        → el enlace se compara de oído (el texto no lo mide)
// </ConnectedSpeechVoiceFeedback>

import { useMemo } from "react";
import { Play } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { evaluateConnectedSpeechTranscript } from "@/lib/pronunciation/connected-speech-evaluation";

interface Props {
  phrase: ConnectedPhrase;
  transcript: string;
  hasAttemptAudio: boolean;
  onPlayNormal: () => void;
  onPlayAttempt: () => void;
}

function headingFor(heardCount: number, total: number): string {
  if (heardCount === total) return "Te entendimos toda la frase";
  if (heardCount === 0) return "No reconocimos la frase";
  return `${heardCount} de ${total} palabras reconocidas`;
}

export function ConnectedSpeechVoiceFeedback({
  phrase,
  transcript,
  hasAttemptAudio,
  onPlayNormal,
  onPlayAttempt,
}: Props) {
  const evaluation = useMemo(
    () => evaluateConnectedSpeechTranscript(phrase.phrase, transcript),
    [phrase.phrase, transcript],
  );
  const [first, second] = phrase.linkedWords;

  return (
    <section
      aria-label="Resultado de pronunciación"
      className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-surface-raised dark:border-slate-800/80 p-6 sm:p-8 shadow-xs animate-fadeIn transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-0.5">
            LO QUE ENTENDIMOS
          </span>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-950 dark:text-white tracking-tight">
            {headingFor(evaluation.heardCount, evaluation.total)}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Entendida
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            No se oyó
          </span>
        </div>
      </div>

      <p className="m-0 text-body-sm text-slate-700 dark:text-slate-200 font-medium">
        Escuchamos: <span className="font-heading font-extrabold">«{transcript}»</span>
      </p>

      <ul
        aria-label="Palabras reconocidas"
        className="m-0 p-4 sm:p-5 list-none flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-surface-sunken shadow-2xs"
      >
        {evaluation.words.map(({ word, heard }, i) => (
          <li
            key={`${word}-${i}`}
            className={cn(
              "px-3 py-1.5 rounded-full font-heading font-extrabold text-lg sm:text-xl border",
              heard
                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/40"
                : "bg-rose-50 text-rose-700 border-rose-200 line-through dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800/40",
            )}
          >
            <span className="sr-only">{heard ? "Entendida: " : "No se oyó: "}</span>
            {word}
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-5 flex flex-col gap-3">
        <h3 className="m-0 font-heading font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight">
          ¿Enlazaste «{first}» con «{second}»?
        </h3>
        <p className="m-0 text-body-sm text-slate-700 dark:text-slate-200 font-medium">
          El reconocedor sólo nos da texto, no mide el enlace. Compara de oído: debería sonar{" "}
          {phrase.howItSoundsEs}, de un tirón.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onPlayNormal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950 text-white font-heading font-extrabold text-xs hover:bg-slate-900 transition-all cursor-pointer focus-ring shadow-2xs"
          >
            <Play size={14} className="fill-current" />
            <span>Nativo</span>
          </button>
          <button
            type="button"
            onClick={onPlayAttempt}
            disabled={!hasAttemptAudio}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-heading font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-ring shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={14} className="fill-current" />
            <span>Tu intento</span>
          </button>
        </div>
      </div>
    </section>
  );
}
