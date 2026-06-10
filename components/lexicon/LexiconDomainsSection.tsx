"use client";

import { LEXICON_DOMAINS, aggregateDomainStats } from "@/lib/lexicon/domains";
import type { LexiconDomain } from "@/lib/lexicon/domains";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface DomainGroup {
  domain: LexiconDomain;
  lessons: LessonViewModel[];
}

interface LexiconDomainsSectionProps {
  groups: DomainGroup[];
  onDomainClick: (domainId: string) => void;
}

export function LexiconDomainsSection({ groups, onDomainClick }: LexiconDomainsSectionProps) {
  return (
    <>
      <div className="words-lexicon__sechead">
        <span className="words-lexicon__sechead-num">02</span>
        <h3>Browse by topic</h3>
      </div>
      <div className="words-lexicon__areachips" role="list">
        {LEXICON_DOMAINS.map((domain) => {
          const group = groups.find((g) => g.domain.id === domain.id);
          const isEmpty = !group || group.lessons.length === 0;
          const stats = group ? aggregateDomainStats(group.lessons) : null;

          return (
            <button
              key={domain.id}
              type="button"
              role="listitem"
              className={`words-lexicon__areachip${isEmpty ? " is-empty" : ""}`}
              disabled={isEmpty}
              onClick={() => !isEmpty && onDomainClick(domain.id)}
              title={domain.description}
            >
              <span
                className="words-lexicon__areachip-ic"
                style={{ color: domain.color }}
                aria-hidden
              >
                {domain.icon}
              </span>
              <span className="words-lexicon__areachip-name">{domain.name}</span>
              <span className="words-lexicon__areachip-count">
                {isEmpty ? "Soon" : stats!.totalWords}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
