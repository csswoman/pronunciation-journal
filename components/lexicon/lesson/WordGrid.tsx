// Planned structure:
// <WordGrid>
//   <LetterGroup letter="A">
//     <WordCard /> ...
//   </LetterGroup>
//   ...
// </WordGrid>

import { WordCard } from "./WordCard";
import type { WordCardProps } from "./WordCard";

export interface Word extends Omit<WordCardProps, "onAddToWordBank"> {
  id: string;
}

interface WordGridProps {
  words: Word[];
  view: "grid" | "list";
  color?: string;
  onAddToWordBank?: (word: string) => void;
}

function groupByLetter(words: Word[]): Map<string, Word[]> {
  const map = new Map<string, Word[]>();
  for (const word of words) {
    const letter = word.word[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(word);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function WordGrid({ words, view, color, onAddToWordBank }: WordGridProps) {
  if (words.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-fg-muted text-sm">No words found</p>
      </div>
    );
  }

  const grouped = groupByLetter(words);

  return (
    <div className="space-y-8">
      {[...grouped.entries()].map(([letter, group]) => (
        <section key={letter}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-fg-subtle tracking-widest uppercase">{letter}</span>
            <hr className="flex-1 border-border-subtle" />
          </div>

          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {group.map((word) => (
              <WordCard key={word.id} {...word} color={color} onAddToWordBank={onAddToWordBank} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
