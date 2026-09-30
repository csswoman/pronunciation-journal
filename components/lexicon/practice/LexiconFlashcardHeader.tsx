import { getIllustration } from "@/lib/illustrations/registry";
import { illustrationForCategory } from "@/lib/lexicon/category-illustrations";

// Planned structure:
// <LexiconFlashcardHeader>
//   <div (Floating Header Container)>
//     <div (Left: Close + CategoryIcon + Titles + ModeBadge)>
//     <div (Center: Progress Counter + 10-Segment Bar)>
//     <div (Right: Undo Button)>
//   </div>
// </LexiconFlashcardHeader>

interface LexiconFlashcardHeaderProps {
  categoryId?: string;
  categoryTitle?: string;
  studyMode?: "receptive" | "productive";
  cardNumber: number;
  totalCards: number;
  canUndo?: boolean;
  disabled?: boolean;
  onUndo?: () => void;
  onClose?: () => void;
}

const CATEGORY_PASTEL_VARS: Record<string, string> = {
  "artificial-intelligence": "var(--sky)",
  "backend-infra": "var(--lilac)",
  "data-science": "var(--butter)",
  "frontend-dev": "var(--mint)",
  "ux-design": "var(--coral)",
  "design-systems": "var(--lilac)",
  "personal-interview": "var(--butter)",
  professional: "var(--sky)",
  "technical-writing": "var(--mint)",
};

export function LexiconFlashcardHeader({
  categoryId = "backend-infra",
  categoryTitle = "Backend e infra",
  studyMode = "receptive",
  cardNumber,
  totalCards,
  canUndo = false,
  disabled = false,
  onUndo,
  onClose,
}: LexiconFlashcardHeaderProps) {
  const illustrationKey = illustrationForCategory(categoryId);
  const Illustration = illustrationKey ? getIllustration(illustrationKey) : null;
  const pastelBg = CATEGORY_PASTEL_VARS[categoryId] ?? "var(--lilac)";

  const maxSegments = Math.min(10, Math.max(1, totalCards));
  const activeSegmentIndex = Math.min(maxSegments - 1, Math.max(0, Math.floor(((cardNumber - 1) / totalCards) * maxSegments)));

  return (
    <div className="w-full rounded-full bg-surface-raised border border-border-subtle/80 px-3.5 sm:px-4 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      {/* Left group */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar práctica"
            className="h-8 w-8 rounded-full bg-surface-sunken hover:bg-surface-raised border border-border-subtle flex items-center justify-center text-fg font-bold text-body-sm transition-all focus-ring shrink-0"
          >
            ✕
          </button>
        ) : null}

        <div
          className="h-8 w-8 shrink-0 rounded-lg border border-black/5 p-1 flex items-center justify-center text-stone-900"
          style={{ backgroundColor: pastelBg }}
          aria-hidden
        >
          {Illustration ? (
            <Illustration className="h-full w-full object-contain text-stone-900" />
          ) : (
            <span className="font-bold text-xs text-stone-900">{categoryTitle.charAt(0)}</span>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-kicker text-[10px] font-extrabold uppercase text-fg-subtle tracking-wider leading-none">
            ESTUDIANDO EL MAZO
          </span>
          <span className="font-display font-bold text-fg text-xs sm:text-body-sm truncate leading-tight">
            {categoryTitle}
          </span>
        </div>

        <span className="hidden sm:inline-flex rounded-full bg-surface-sunken text-fg-muted border border-border-subtle px-2 py-0.5 text-[11px] font-semibold">
          {studyMode === "receptive" ? "Reconocer" : "Producir"}
        </span>
      </div>

      {/* Center progress group */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-caption font-mono font-bold text-fg shrink-0">
          {cardNumber} de {totalCards}
        </span>

        <div className="hidden md:flex items-center gap-1 w-36 sm:w-44" aria-hidden>
          {Array.from({ length: maxSegments }).map((_, idx) => {
            const isFilled = idx < activeSegmentIndex;
            const isActive = idx === activeSegmentIndex;
            return (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-accent-purple"
                    : isActive
                    ? "border-2 border-accent-purple bg-accent-purple/20"
                    : "bg-stone-200 dark:bg-stone-700"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Right undo group */}
      <div className="flex items-center gap-2">
        {canUndo && onUndo ? (
          <button
            type="button"
            onClick={onUndo}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/80 bg-surface-raised hover:bg-surface-sunken text-fg text-xs font-semibold px-3 py-1.5 transition-all focus-ring shadow-2xs disabled:opacity-40"
            title="Deshacer última valoración (Z)"
          >
            <span>↶ Deshacer</span>
            <span className="font-mono text-[10px] bg-surface-sunken border border-border-subtle px-1 rounded text-fg-muted">
              Z
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
