import { StudyCard } from "./StudyCard";
import type { Tables } from "@/lib/supabase/types";

interface CardMeaning {
  partOfSpeech?: string;
  definitions?: { definition?: string; example?: string }[];
}

interface StudyCenterCardProps {
  currentCard: (Tables<"entries"> & { progress: Tables<"deck_entry_progress"> | null }) | undefined;
  levelLabel: string | null;
  firstMeaning: CardMeaning | undefined;
  firstDef: { definition?: string; example?: string } | undefined;
  flipped: boolean;
  onFlip: () => void;
  onSkip: () => void;
}

export function StudyCenterCard({
  currentCard,
  levelLabel,
  firstMeaning,
  firstDef,
  flipped,
  onFlip,
  onSkip,
}: StudyCenterCardProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-w-0">
      {currentCard && (
        <StudyCard
          word={currentCard.word}
          ipa={currentCard.ipa}
          levelLabel={levelLabel}
          firstMeaning={firstMeaning}
          firstDef={firstDef}
          flipped={flipped}
          onFlip={onFlip}
          onSkip={onSkip}
        />
      )}
      {!flipped && (
        <p className="mt-3 text-xs text-fg-subtle">
          Hint: Press{" "}
          <kbd
            className="px-1.5 py-0.5 rounded border text-tiny font-mono"
            style={{
              borderColor: "var(--line-divider)",
              backgroundColor: "var(--btn-regular-bg)",
            }}
          >
            SPACE
          </kbd>
          {" "}to flip
        </p>
      )}
    </div>
  );
}
