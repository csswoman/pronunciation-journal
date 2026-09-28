"use client";

import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";

interface Props {
  phrase: ConnectedPhrase;
}

function LinkingArcConnector({ linkSound }: { linkSound: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center px-1.5 py-0.5 select-none shrink-0">
      <span className="font-mono text-xs sm:text-sm font-bold text-accent-purple dark:text-purple-300 -mb-1">
        {linkSound}
      </span>
      <svg
        width="44"
        height="14"
        viewBox="0 0 44 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent-purple dark:text-purple-300"
      >
        <path
          d="M 3,2 Q 22,12 41,2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function ConnectedSpeechPedagogicalCard({ phrase }: Props) {
  const words = phrase.phrase.split(" ");
  const defaultLinks = phrase.links ?? [
    { word: words[0] ?? phrase.phrase, linkSound: phrase.linkSound ? `${phrase.linkSound}→v` : undefined },
    ...(words.slice(1).map((w, idx) => ({
      word: w,
      linkSound: idx < words.length - 2 && phrase.linkSound ? `${phrase.linkSound}→v` : undefined,
    }))),
  ];

  return (
    <section
      aria-label="Explicación pedagógica de habla conectada"
      className="flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white dark:bg-surface-sunken dark:border-slate-800/80 p-6 sm:p-8 shadow-xs animate-fadeIn transition-colors"
    >
      {/* Header */}
      <div>
        <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
          POR QUÉ SUENA ASÍ
        </span>
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-950 dark:text-white tracking-tight">
          {phrase.explanationEs || "La consonante final salta a la vocal siguiente"}
        </h2>
      </div>

      {/* 1 · LOS ENLACES (Con dibujo de raya curva que une las palabras) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-soft dark:bg-surface-raised dark:border-purple-900/30 p-5 sm:p-6 transition-colors">
        <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest block">
          1 · LOS ENLACES
        </span>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 py-2">
          {defaultLinks.map((step, idx) => (
            <div key={idx} className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-950 text-slate-950 dark:bg-surface-sunken dark:border-white dark:text-white font-heading font-extrabold text-base sm:text-lg shadow-2xs">
                {step.word}
              </span>
              {step.linkSound && (
                <LinkingArcConnector linkSound={step.linkSound} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2 · LO QUE ESPERAS VS. LO QUE OYES */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
          2 · LO QUE ESPERAS VS. LO QUE OYES
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-stone-200/60 bg-surface-raised dark:bg-surface-sunken dark:border-slate-800 p-5 flex flex-col justify-center transition-colors">
            <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">
              LO QUE ESPERAS
            </span>
            <span className="font-ipa text-slate-600 dark:text-slate-300 text-base sm:text-lg font-medium">
              {phrase.isolatedIpa}
            </span>
          </div>

          <div className="rounded-2xl border-2 border-slate-950 bg-sky-soft dark:bg-slate-900 dark:border-white p-5 flex flex-col justify-center shadow-xs transition-colors">
            <span className="font-mono text-[10px] font-bold text-slate-950 dark:text-white uppercase tracking-widest block mb-1">
              LO QUE OYES
            </span>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-ipa font-extrabold text-slate-950 dark:text-white text-lg sm:text-xl">
                {phrase.connectedIpa}
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-medium text-sm">
                {phrase.howItSoundsEs}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 · EL RITMO */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-surface-raised dark:bg-surface-sunken dark:border-slate-800 p-5 sm:p-6 transition-colors">
        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
          3 · EL RITMO
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-end gap-3.5 pt-3 pb-1">
            {words.map((w, i) => {
              const isStressed = i === 0 || i === words.length - 1;
              return (
                <div key={i} className="flex flex-col items-center">
                  {isStressed ? (
                    <span className="text-accent-purple dark:text-purple-400 text-xs font-bold mb-1 leading-none">●</span>
                  ) : (
                    <span className="text-transparent text-xs mb-1 leading-none">●</span>
                  )}
                  <span className={isStressed ? "font-heading font-extrabold text-xl sm:text-2xl text-slate-950 dark:text-white" : "font-heading font-semibold text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-0.5"}>
                    {w}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-body-sm text-slate-600 dark:text-slate-300 font-medium max-w-md text-pretty m-0">
            Dos pulsos. <strong className="text-slate-950 dark:text-white font-bold">{words[1] || "it"}</strong> es forma débil: se comprime entre los golpes.
          </p>
        </div>
      </div>
    </section>
  );
}
