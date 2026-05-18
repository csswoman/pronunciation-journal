"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LexiconFilters, LexiconSearchBar, LessonGrid } from "@/components/lexicon";
import type { FilterId } from "@/components/lexicon";
import type { LessonViewModel } from "@/lib/lexicon/types";

const STATUS_FILTERS: Record<string, (l: LessonViewModel) => boolean> = {
  "in-progress": (l) => l.progress > 0 && l.progress < 100,
  "not-started": (l) => l.progress === 0,
};

interface LexiconContentProps {
  lessons: LessonViewModel[];
}

export function LexiconContent({ lessons }: LexiconContentProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    if (activeFilter in STATUS_FILTERS) {
      filtered = filtered.filter(STATUS_FILTERS[activeFilter]);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [lessons, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <LexiconFilters active={activeFilter} onChange={setActiveFilter} />
      <LexiconSearchBar value={searchQuery} onChange={setSearchQuery} />
      <LessonGrid
        lessons={filteredLessons}
        onLessonClick={(id) => router.push(`/lexicon/${id}`)}
      />
    </div>
  );
}
