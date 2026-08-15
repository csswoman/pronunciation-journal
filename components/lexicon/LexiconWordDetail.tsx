"use client";

import { Volume2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { LexiconSearchHit } from "@/lib/lexicon/types";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

// Planned structure:
// <LexiconWordDetail>
//   <word meta />
//   <definition />
//   <Hear | Add | Open category />
// </LexiconWordDetail>

interface LexiconWordDetailProps {
  selected: LexiconSearchHit;
  onPlay: () => void;
  onAddWord?: (text: string) => void;
  onOpenCategory: (hit: LexiconSearchHit) => void;
}

export function LexiconWordDetail({
  selected,
  onPlay,
  onAddWord,
  onOpenCategory,
}: LexiconWordDetailProps) {
  return (
    <div
      className="words-lexicon__worddetail is-open"
      role="region"
      aria-label="Word detail"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="words-lexicon__wd-top">
        <span className="words-lexicon__wd-w">{selected.word}</span>
        {selected.ipa ? (
          <span className="words-lexicon__wd-pos font-ipa">{formatIpaDisplay(selected.ipa)}</span>
        ) : (
          <span className="words-lexicon__wd-pos">{selected.pos}</span>
        )}
        <span className="words-lexicon__wd-cat">{selected.categoryName}</span>
        {selected.ipa && (
          <span
            className="words-lexicon__wd-cat"
            title="International Phonetic Alphabet — shows how to pronounce the word"
          >
            IPA
          </span>
        )}
      </div>
      {selected.translation ? (
        <p className="words-lexicon__wd-translation">{selected.translation}</p>
      ) : null}
      <p className="words-lexicon__wd-def">{selected.definition}</p>
      <div className="words-lexicon__wd-btns">
        <Button size="sm" icon={<Volume2 size={15} />} onClick={onPlay}>
          Hear it
        </Button>
        {onAddWord ? (
          <Button variant="secondary" size="sm" onClick={() => onAddWord(selected.word)}>
            Add to my words
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => onOpenCategory(selected)}>
          Open category
        </Button>
      </div>
    </div>
  );
}
