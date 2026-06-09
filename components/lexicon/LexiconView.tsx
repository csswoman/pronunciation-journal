"use client";

import { useMemo, useRef } from "react";
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
        <span className="words-lexicon__sechead-num">03</span>
        <h3>All topics</h3>
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
            <div className="words-lexicon__domain-head">
              <span
                className="words-lexicon__domain-icon"
                style={{ color: domain.color }}
                aria-hidden
              >
                {domain.icon}
              </span>
              <h3 className="words-lexicon__domain-name">{domain.name}</h3>
              <span className="words-lexicon__domain-count">
                {group.lessons.length} topics
              </span>
            </div>
            <LessonGrid
              lessons={group.lessons}
              onLessonClick={(id) => router.push(`/lexicon/${id}`)}
            />
          </div>
        );
      })}
    </>
  );
}
