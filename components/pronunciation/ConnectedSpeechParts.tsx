import { useState } from "react";
import { Headphones, Mic, ArrowLeft } from "@/components/icons";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { cn } from "@/lib/cn";

export const CATEGORIES = [
  { id: "all", label: "Todos los enlaces" },
  { id: "linking-cv", label: "Consonante + vocal" },
  { id: "flap-t", label: "Flap T /r/" },
  { id: "intrusion", label: "Intrusión /w/ y /j/" },
  { id: "weak-forms", label: "Formas débiles" },
  { id: "silent-letters", label: "Letras mudas" },
] as const;

export function getPhraseOptions(phrase: ConnectedPhrase): { text: string; isCorrect: boolean }[] {
  if (phrase.options && phrase.options.length >= 3) {
    return phrase.options.map((opt) => ({
      text: opt,
      isCorrect: opt.toLowerCase().trim() === phrase.phrase.toLowerCase().trim(),
    }));
  }

  const words = phrase.phrase.split(" ");
  const d1 = words.map((w, idx) => (idx === 1 ? (w === "it" ? "a cup" : "it") : w)).join(" ");
  const d2 = `${words[0]}ed ${words.slice(1).join(" ")}`.trim();

  return [
    { text: d1 !== phrase.phrase ? d1 : `${phrase.phrase} now`, isCorrect: false },
    { text: phrase.phrase, isCorrect: true },
    { text: d2 !== phrase.phrase ? d2 : `Just ${phrase.phrase}`, isCorrect: false },
  ];
}

// ── Top Bar (Back button, Title, Pill Switcher) ──────────────────────────────
export function ConnectedSpeechHeaderNav({
  trainerMode,
  onSelectMode,
  onBackToSetup,
}: {
  trainerMode: "unpacking" | "production";
  onSelectMode: (mode: "unpacking" | "production") => void;
  onBackToSetup: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 w-full mb-6">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onBackToSetup}
          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer focus-ring shrink-0 shadow-2xs"
          title="Volver a la selección"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
            PRÁCTICA · FLUIDEZ
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-950 dark:text-white tracking-tight">
            Habla conectada
          </h1>
        </div>
      </div>

      {/* Pill Switcher: Oído / Voz */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <button
          type="button"
          onClick={() => onSelectMode("unpacking")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-heading font-extrabold text-sm transition-all cursor-pointer focus-ring",
            trainerMode === "unpacking"
              ? "bg-white dark:bg-slate-900 border-2 border-accent-purple text-accent-purple dark:text-purple-300 shadow-xs"
              : "bg-sky-50 dark:bg-sky-950/60 text-slate-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/80",
          )}
        >
          <Headphones className="size-4" />
          <span>Oído</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode("production")}
          className={cn(
            "flex items-center gap-2 px-4.5 py-2 rounded-full font-heading font-extrabold text-sm transition-all cursor-pointer focus-ring",
            trainerMode === "production"
              ? "bg-white dark:bg-slate-900 border-2 border-coral-deep text-accent-orange dark:text-orange-300 shadow-xs"
              : "bg-coral-soft dark:bg-rose-900/60 text-accent-orange dark:text-rose-100 hover:bg-coral dark:hover:bg-rose-800/80",
          )}
        >
          <Mic className="size-4 text-coral-deep dark:text-rose-200" />
          <span>Voz</span>
        </button>
      </div>
    </div>
  );
}

// ── Floating Category Dropdown Menu ──────────────────────────────────────────
export function ConnectedSpeechCategoryDropdown({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentCat = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  return (
    <div className="relative inline-block z-30">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer focus-ring shadow-xs"
      >
        <span>{currentCat.label}</span>
        <span className="text-[10px] ml-0.5">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl z-50 animate-fadeIn flex flex-col gap-3">
            <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
              QUÉ PRACTICAR
            </span>

            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Categorías de práctica">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onSelectCategory(cat.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all text-left cursor-pointer focus-ring",
                      isSelected
                        ? "bg-sky-soft dark:bg-purple-950/50 text-accent-purple dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/60"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                        isSelected
                          ? "border-accent-purple bg-accent-purple text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800",
                      )}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Cambiar el tipo reinicia la selección de frases
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Right Feedback Surface Placeholder ───────────────────────────────────────
export function ConnectedSpeechFeedbackPlaceholder() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[460px] animate-fadeIn">
      <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-2xl shadow-2xs">
        💬
      </div>
      <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-950 dark:text-white mt-4 tracking-tight">
        Aquí aparecerá tu feedback
      </h3>
      <p className="text-body text-slate-600 dark:text-slate-400 font-medium mt-1.5 max-w-sm leading-relaxed">
        Elige una opción y pulsa <strong className="text-slate-950 dark:text-white font-bold">Comprobar</strong>. Te diremos si acertaste y por qué la frase suena así.
      </p>

      <div className="bg-surface-raised dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 w-full max-w-md mt-6 text-left shadow-2xs">
        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3">
          VAS A VER
        </span>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <span className="text-body-sm font-semibold text-slate-800 dark:text-slate-200">
              Qué palabras se enlazan
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <span className="text-body-sm font-semibold text-slate-800 dark:text-slate-200">
              Lo que esperas vs. lo que oyes
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <span className="text-body-sm font-semibold text-slate-800 dark:text-slate-200">
              El ritmo de la frase
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
