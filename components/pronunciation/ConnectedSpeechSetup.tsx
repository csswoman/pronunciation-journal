import Link from "next/link";
import PastelCard from "@/components/layout/PastelCard";
import { Headphones, Mic, ArrowRight, ArrowLeft } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface CategoryCardData {
  id: string;
  title: string;
  subtitle: string;
  example: string;
}

export const SETUP_CATEGORIES: CategoryCardData[] = [
  {
    id: "all",
    title: "Todos los enlaces",
    subtitle: "Una mezcla de los cinco tipos",
    example: "pick it up · want to · go on",
  },
  {
    id: "linking-cv",
    title: "Consonante + vocal",
    subtitle: "La consonante final salta a la vocal",
    example: "pick _ it _ up",
  },
  {
    id: "flap-t",
    title: "Flap T /r/",
    subtitle: "La t entre vocales suena como una r suave",
    example: "get it → «ge-rit»",
  },
  {
    id: "intrusion",
    title: "Intrusión /w/ y /j/",
    subtitle: "Aparece un sonido de puente entre vocales",
    example: "go _w_ on · I _j_ am",
  },
  {
    id: "weak-forms",
    title: "Formas débiles",
    subtitle: "Palabras cortas que casi desaparecen",
    example: "want to → «wanna»",
  },
  {
    id: "silent-letters",
    title: "Letras mudas",
    subtitle: "Letras que se escriben pero no se dicen",
    example: "walk · Wednesday",
  },
];

export function ConnectedSpeechSetup({
  activeCategory,
  trainerMode,
  phraseCount,
  onSelectCategory,
  onSelectMode,
  onStartSession,
}: {
  activeCategory: string;
  trainerMode: "unpacking" | "production";
  phraseCount: number;
  onSelectCategory: (catId: string) => void;
  onSelectMode: (mode: "unpacking" | "production") => void;
  onStartSession: () => void;
}) {
  const currentCategory =
    SETUP_CATEGORIES.find((c) => c.id === activeCategory) ?? SETUP_CATEGORIES[0];
  const modeLabel = trainerMode === "unpacking" ? "Oído" : "Voz";

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Page Header on Setup Screen */}
      <div className="w-full mb-2">
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 text-body font-semibold text-fg-muted hover:text-fg transition-colors focus-ring rounded-lg py-1 px-2 -ml-2 mb-4"
        >
          <ArrowLeft className="size-5" />
          <span>Hub de Práctica</span>
        </Link>
        <span className="font-mono text-[10px] sm:text-[11px] font-bold text-fg-muted uppercase tracking-widest block mb-1">
          PRÁCTICA · FLUIDEZ Y COMPRENSIÓN AUDITIVA
        </span>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-fg tracking-tight">
          Habla conectada
        </h1>
        <p className="text-body-lg text-fg-muted max-w-3xl text-pretty mt-2 font-normal leading-relaxed">
          En inglés las palabras se encadenan. Aprende cómo suenan juntas para entender a los nativos
          a velocidad real, y luego dilo tú.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
        {/* Left Column: 1 · QUÉ QUIERES PRACTICAR */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <span className="font-mono text-[10px] sm:text-[11px] font-bold text-fg-muted uppercase tracking-widest block mb-1">
            1 · QUÉ QUIERES PRACTICAR
          </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Categorías de habla conectada">
          {SETUP_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  "flex flex-col justify-between p-5 sm:p-6 rounded-3xl border text-left transition-all cursor-pointer focus-ring min-h-[148px]",
                  isSelected
                    ? "bg-primary-soft/80 border-2 border-primary shadow-xs"
                    : "bg-surface-raised dark:bg-slate-900 border-border-default hover:border-border-strong hover:bg-surface-sunken/40",
                )}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                        isSelected
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border-strong bg-surface dark:bg-slate-800",
                      )}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <h3 className="font-heading font-extrabold text-lg text-fg dark:text-white">
                      {cat.title}
                    </h3>
                  </div>
                  <p className="text-body-sm text-fg-muted mt-1.5 ml-8 font-medium">
                    {cat.subtitle}
                  </p>
                </div>

                <div className="mt-4 ml-8">
                  <span
                    className={cn(
                      "inline-block px-3 py-1 rounded-xl text-xs font-mono font-semibold border",
                      isSelected
                        ? "bg-surface-raised dark:bg-slate-900 text-fg border-border-subtle shadow-2xs"
                        : "bg-surface-sunken dark:bg-slate-800/80 text-fg-muted border-border-subtle",
                    )}
                  >
                    {cat.example}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: 2 · CÓMO QUIERES EMPEZAR */}
      <div className="lg:col-span-4 w-full">
        <PastelCard tone="sky" className="rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-6 min-h-[480px]">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-ink-muted uppercase tracking-widest block mb-0.5">
              2 · CÓMO QUIERES EMPEZAR
            </span>

            {/* Oído (Paso 1) */}
            <button
              type="button"
              onClick={() => onSelectMode("unpacking")}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer focus-ring text-left",
                trainerMode === "unpacking"
                  ? "bg-white border-ink shadow-xs"
                  : "bg-white/80 border-transparent opacity-85 hover:opacity-100",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-deep/50 text-ink flex items-center justify-center shrink-0">
                  <Headphones className="size-5 text-ink" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-ink text-base sm:text-lg leading-snug">
                    Oído
                  </h4>
                  <p className="text-body-sm text-ink-secondary font-medium leading-tight">
                    Escucha y descubre qué se dijo
                  </p>
                </div>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-ink-secondary px-2 py-0.5 rounded bg-ink/10 shrink-0 whitespace-nowrap ml-2">
                PASO 1
              </span>
            </button>

            {/* Voz (Paso 2) */}
            <button
              type="button"
              onClick={() => onSelectMode("production")}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer focus-ring text-left",
                trainerMode === "production"
                  ? "bg-white border-ink shadow-xs"
                  : "bg-white/80 border-transparent opacity-85 hover:opacity-100",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral/50 text-ink flex items-center justify-center shrink-0">
                  <Mic className="size-5 text-ink" />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-ink text-base sm:text-lg leading-snug">
                    Voz
                  </h4>
                  <p className="text-body-sm text-ink-secondary font-medium leading-tight">
                    Repite la frase enlazando los sonidos
                  </p>
                </div>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-ink-secondary px-2 py-0.5 rounded bg-ink/10 shrink-0 whitespace-nowrap ml-2">
                PASO 2
              </span>
            </button>

            <p className="text-body-sm text-ink-secondary font-medium leading-relaxed mt-1">
              Recomendado: empieza por Oído. Puedes cambiar de modo en cualquier momento desde la sesión.
            </p>
          </div>

          {/* Bottom Summary & Start CTA */}
          <div className="flex flex-col gap-3.5">
            <div className="bg-white/90 rounded-2xl p-4 border border-ink/15 flex flex-col gap-0.5 shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted block">
                TU SESIÓN
              </span>
              <span className="font-heading font-extrabold text-base text-ink">
                {currentCategory.title} · {modeLabel} · {phraseCount} frases
              </span>
            </div>

            <button
              type="button"
              onClick={onStartSession}
              className="bg-ink text-paper font-heading font-extrabold rounded-full py-4 px-6 w-full flex items-center justify-center gap-2 hover:bg-ink-secondary transition-all text-base shadow-md cursor-pointer focus-ring"
            >
              <span>Empezar</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </PastelCard>
      </div>
    </div>
  </div>
);
}
