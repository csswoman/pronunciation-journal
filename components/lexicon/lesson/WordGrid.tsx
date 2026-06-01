import { WordCard } from "./WordCard";
import type { WordCardProps } from "./WordCard";

export interface Word extends Omit<WordCardProps, "onMarkLearned" | "view"> {
  id: string;
  isFavorite?: boolean;
  wordBankId?: string | null;
  onToggleFavorite?: () => void;
  onAddToMyWords?: () => void;
  isInMyWords?: boolean;
}

interface WordGridProps {
  words: Word[];
  view: "grid" | "list";
  groupByLetter?: boolean;
  onMarkLearned?: (wordId: string) => void;
}

function partitionWordsByLetter(words: Word[]): Map<string, Word[]> {
  const map = new Map<string, Word[]>();
  for (const word of words) {
    const letter = word.word[0]?.toUpperCase() ?? "#";
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(word);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function WordCards({
  group,
  view,
  onMarkLearned,
}: {
  group: Word[];
  view: "grid" | "list";
  onMarkLearned?: (wordId: string) => void;
}) {
  return (
    <>
      {group.map(({ id, wordBankId, onToggleFavorite, onAddToMyWords, isInMyWords, isFavorite, ...rest }) => (
        <WordCard
          key={id}
          {...rest}
          view={view}
          onMarkLearned={onMarkLearned ? () => onMarkLearned(id) : undefined}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onAddToMyWords={onAddToMyWords}
          isInMyWords={isInMyWords}
        />
      ))}
    </>
  );
}

export function WordGrid({ words, view, groupByLetter = true, onMarkLearned }: WordGridProps) {
  if (words.length === 0) {
    return <p className="lexicon-area__empty">No words match this filter.</p>;
  }

  const gridClass = `lexicon-area__grid${view === "list" ? " lexicon-area__grid--list" : ""}`;

  if (!groupByLetter) {
    return (
      <div className="lexicon-area__lettergroup">
        <div className={gridClass}>
          <WordCards group={words} view={view} onMarkLearned={onMarkLearned} />
        </div>
      </div>
    );
  }

  const grouped = partitionWordsByLetter(words);

  return (
    <>
      {[...grouped.entries()].map(([letter, group]) => (
        <section key={letter} className="lexicon-area__lettergroup">
          <div className="lexicon-area__letterhead">
            <span className="lexicon-area__letter">{letter}</span>
            <hr className="lexicon-area__letter-rule" />
          </div>
          <div className={gridClass}>
            <WordCards group={group} view={view} onMarkLearned={onMarkLearned} />
          </div>
        </section>
      ))}
    </>
  );
}
