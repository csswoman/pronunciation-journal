"use client";

import type { LexiconSearchHit } from "@/lib/lexicon/types";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

// Planned structure:
// <LexiconSearchResults>
//   <empty state | result buttons />
// </LexiconSearchResults>

interface LexiconSearchResultsProps {
  open: boolean;
  query: string;
  matches: LexiconSearchHit[];
  focusedIndex: number;
  onPick: (hit: LexiconSearchHit) => void;
}

export function LexiconSearchResults({
  open,
  query,
  matches,
  focusedIndex,
  onPick,
}: LexiconSearchResultsProps) {
  return (
    <div
      id="lexicon-search-results"
      className={`words-lexicon__results${open ? " is-open" : ""}`}
      aria-label="Search results"
    >
      {matches.length === 0 && query.trim() ? (
        <p className="words-lexicon__nores">
          No encontramos &ldquo;{query.trim()}&rdquo;. Prueba otra escritura o un término más general.
        </p>
      ) : (
        matches.map((hit, index) => (
          <button
            key={hit.id}
            type="button"
            className={`words-lexicon__res${focusedIndex === index ? " is-focused" : ""}`}
            aria-selected={focusedIndex === index}
            onClick={() => onPick(hit)}
          >
            <span className="words-lexicon__res-word">{hit.word}</span>
            {hit.ipa ? (
              <span className="words-lexicon__res-pos font-ipa text-primary">
                {formatIpaDisplay(hit.ipa)}
              </span>
            ) : (
              <span className="words-lexicon__res-pos">{hit.pos}</span>
            )}
            <span className="words-lexicon__res-cat">{hit.categoryName}</span>
            {hit.translation ? (
              <span className="words-lexicon__res-def words-lexicon__res-def--translation">
                {hit.translation}
              </span>
            ) : null}
            <span className="words-lexicon__res-def">{hit.definition}</span>
          </button>
        ))
      )}
    </div>
  );
}
