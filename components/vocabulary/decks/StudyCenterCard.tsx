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
    <div className="w-full flex flex-col items-center justify-center min-w-0">
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
    </div>
  );
}
