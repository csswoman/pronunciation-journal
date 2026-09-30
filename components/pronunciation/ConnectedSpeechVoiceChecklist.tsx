"use client";

// Planned structure:
// <ConnectedSpeechVoiceChecklist>
//   <ChecklistHeader />
//   <ChecklistItemsList />
//   <ChecklistFooterNote />
// </ConnectedSpeechVoiceChecklist>

import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";

interface Props {
  phrase: ConnectedPhrase;
}

function SmallLinkingArc() {
  return (
    <svg
      width="32"
      height="10"
      viewBox="0 0 32 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-accent-purple dark:text-purple-300 inline-block mx-0.5"
    >
      <path
        d="M 2,2 Q 16,9 30,2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ConnectedSpeechVoiceChecklist({ phrase }: Props) {
  const words = phrase.phrase.split(" ");
  const w1 = words[0] ?? "Pick";
  const w2 = words[1] ?? "it";
  const w3 = words[2] ?? "up";

  const checklistItems = [
    {
      num: 1,
      title: `Enlaza «${w1}» con «${w2}»`,
      subtitle: `La consonante final de «${w1}» pasa a la vocal siguiente: «${phrase.howItSoundsEs || "pi-kit"}».`,
      badge: (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-heading font-extrabold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-2xs">
          {w1}
          <SmallLinkingArc />
          {w2}
        </span>
      ),
    },
    ...(words.length > 2
      ? [
          {
            num: 2,
            title: `Enlaza «${w2}» con «${w3}»`,
            subtitle: `La consonante de «${w2}» se pega a «${w3}»: sin pausa entre las palabras.`,
            badge: (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-heading font-extrabold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-2xs">
                {w2}
                <SmallLinkingArc />
                {w3}
              </span>
            ),
          },
        ]
      : []),
    {
      num: words.length > 2 ? 3 : 2,
      title: words.length > 2 ? "Dos golpes, no tres" : "Un solo pulso de voz",
      subtitle: `«${w2}» va débil y rápido, entre los pulsos de la frase.`,
      badge: (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-heading font-extrabold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="uppercase">{w1}</span>{" "}
          <span className="lowercase font-normal text-slate-500 dark:text-slate-400">{w2}</span>{" "}
          <span className="uppercase">{w3}</span>
        </span>
      ),
    },
  ];

  return (
    <section
      aria-label="Lista de verificación de voz"
      className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200/80 bg-white dark:bg-surface-sunken dark:border-slate-800/80 p-6 sm:p-8 shadow-xs min-h-[480px] animate-fadeIn transition-colors"
    >
      {/* Top Header */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
          LO QUE VAMOS A ESCUCHAR EN TU VOZ
        </span>
        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-950 dark:text-white tracking-tight">
          {checklistItems.length} cosas para que suene nativa
        </h2>
      </div>

      {/* Checklist Inset Cards */}
      <div className="flex flex-col gap-3.5 my-auto">
        {checklistItems.map((item) => (
          <div
            key={item.num}
            className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200/70 bg-surface-raised dark:bg-surface-sunken dark:border-slate-800 transition-colors"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-heading font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {item.num}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-950 dark:text-white tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-body-sm text-slate-600 dark:text-slate-300 font-medium m-0 leading-relaxed text-pretty">
                  {item.subtitle}
                </p>
              </div>
            </div>

            <div className="shrink-0">{item.badge}</div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0 text-center sm:text-left">
          Después de grabar, cada punto se marca como <strong className="text-slate-700 dark:text-slate-200">Bien</strong>, <strong className="text-slate-700 dark:text-slate-200">Casi</strong> o <strong className="text-slate-700 dark:text-slate-200">No se oyó</strong>.
        </p>
      </div>
    </section>
  );
}
