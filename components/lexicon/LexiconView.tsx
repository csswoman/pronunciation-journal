"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LexiconHeroSearch } from "@/components/lexicon/LexiconHeroSearch";
import { LexiconProgressStrip } from "@/components/lexicon/LexiconProgressStrip";
import { LexiconContinueSection } from "@/components/lexicon/LexiconContinueSection";
import { LexiconDomainsSection } from "@/components/lexicon/LexiconDomainsSection";
import { LessonGrid } from "@/components/lexicon/LessonGrid";
import { groupLessonsByDomain, LEXICON_DOMAINS } from "@/lib/lexicon/domains";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface LexiconViewProps {
  lessons: LessonViewModel[];
  lexiconTotal: number;
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconPercent: number;
  dueForReview?: number;
  recentWords?: string[];
  dueWordLabels?: string[];
  onAddWord?: (text: string) => void;
}

export function LexiconView({
  lessons,
  lexiconTotal,
  lexiconLearned,
  lexiconInProgress,
  lexiconPercent,
  dueForReview = 0,
  recentWords = [],
  dueWordLabels = [],
  onAddWord,
}: LexiconViewProps) {
  const router = useRouter();
  const domainRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const notStarted = Math.max(0, lexiconTotal - lexiconLearned - lexiconInProgress);

  const inProgress = useMemo(() => {
    const active = lessons.filter((l) => l.progress > 0 && l.progress < 100);
    active.sort((a, b) => b.progress - a.progress);
    return active;
  }, [lessons]);

  const domainGroups = useMemo(
    () => groupLessonsByDomain(lessons, []),
    [lessons]
  );

  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set());

  const toggleDomain = (id: string) => {
    setCollapsedDomains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const scrollToDomain = (domainId: string) => {
    domainRefs.current[domainId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <LexiconHeroSearch
        totalWords={lexiconTotal}
        recentWords={recentWords}
        dueWords={dueWordLabels}
        onAddWord={onAddWord}
      />

      <LexiconProgressStrip
        percent={lexiconPercent}
        learned={lexiconLearned}
        inProgress={lexiconInProgress}
        notStarted={notStarted}
        dueForReview={dueForReview}
      />

      <LexiconContinueSection
        lessons={inProgress}
        onLessonClick={(id) => router.push(`/lexicon/${id}`)}
      />

      <LexiconDomainsSection groups={domainGroups} onDomainClick={scrollToDomain} />

      <div className="words-lexicon__sechead words-lexicon__sechead--spaced">
        <h3>All categories</h3>
      </div>

      {LEXICON_DOMAINS.map((domain) => {
        const group = domainGroups.find((g) => g.domain.id === domain.id);
        if (!group || group.lessons.length === 0) return null;

        return (
          <div
            key={domain.id}
            ref={(el) => {
              domainRefs.current[domain.id] = el;
            }}
            className="words-lexicon__domain-group"
          >
            <button
              type="button"
              className="words-lexicon__domain-head"
              onClick={() => toggleDomain(domain.id)}
              aria-expanded={!collapsedDomains.has(domain.id)}
            >
              <h3 className="words-lexicon__domain-name">{domain.name}</h3>
              <span className="words-lexicon__domain-count">
                {group.lessons.length} {group.lessons.length === 1 ? "category" : "categories"}
              </span>
              <span
                className="words-lexicon__domain-chevron"
                aria-hidden
                style={{ transform: collapsedDomains.has(domain.id) ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 150ms ease-out" }}
              >
                ›
              </span>
            </button>
            {!collapsedDomains.has(domain.id) && (
              <LessonGrid
                lessons={group.lessons}
                onLessonClick={(id) => router.push(`/lexicon/${id}`)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
