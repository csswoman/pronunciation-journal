"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Zap,
  Briefcase,
  Square,
  Grid3x3,
  PenTool,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import {
  LexiconHeader,
  LexiconFilters,
  LexiconSearchBar,
  LessonGrid,
} from "@/components/lexicon";
import type { FilterId, Lesson } from "@/components/lexicon";

const LESSONS: Lesson[] = [
  {
    id: "ux-design",
    icon: Sparkles,
    title: "UX / UI Design",
    wordsCompleted: 200,
    totalWords: 500,
    progress: 40,
    tags: ["affordance", "wireframe", "heuristic", "gestalt", "skeuomorph", "wayfinding", "hierarchy"],
    accentColor: "primary",
  },
  {
    id: "frontend-dev",
    icon: Zap,
    title: "Frontend Dev",
    wordsCompleted: 180,
    totalWords: 800,
    progress: 20,
    tags: ["debounce", "memoize", "hydration", "idempotent", "serialization", "middleware"],
    accentColor: "success",
  },
  {
    id: "professional",
    icon: Briefcase,
    title: "Professional",
    wordsCompleted: 175,
    totalWords: 350,
    progress: 50,
    tags: ["stakeholder", "bandwidth", "leverage", "granular", "cadence", "iterate"],
    accentColor: "warning",
  },
  {
    id: "design-systems",
    icon: Square,
    title: "Design Systems",
    wordsCompleted: 120,
    totalWords: 400,
    progress: 30,
    tags: ["token", "atomic design", "variant", "composability", "theming", "breakpoint", "abstraction"],
    accentColor: "primary",
  },
  {
    id: "technical-writing",
    icon: PenTool,
    title: "Technical Writing",
    wordsCompleted: 35,
    totalWords: 300,
    progress: 10,
    tags: ["deprecate", "caveat", "verbosity", "scaffold", "preamble"],
    accentColor: "success",
  },
  {
    id: "data-science",
    icon: Grid3x3,
    title: "Data Science",
    wordsCompleted: 45,
    totalWords: 250,
    progress: 18,
    tags: ["algorithm", "normalization", "clustering", "regression", "correlation", "inference"],
    accentColor: "warning",
  },
];

export default function LexiconPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalWordsLearned = LESSONS.reduce((sum, l) => sum + l.wordsCompleted, 0);
  const totalWords = 10000;
  const percentageDone = (totalWordsLearned / totalWords) * 100;

  const filteredLessons = useMemo(() => {
    let filtered = LESSONS;

    // Apply filter
    if (activeFilter === "in-progress") {
      filtered = filtered.filter((l) => l.progress > 0 && l.progress < 100);
    } else if (activeFilter === "not-started") {
      filtered = filtered.filter((l) => l.progress === 0);
    } else if (activeFilter !== "all") {
      // Category filters (tech, design, professional)
      const categoryMap: Record<FilterId, string[]> = {
        tech: ["ux-design", "frontend-dev", "technical-writing", "data-science"],
        design: ["ux-design", "design-systems"],
        professional: ["professional"],
        all: [],
        "in-progress": [],
        "not-started": [],
      };
      filtered = filtered.filter((l) => categoryMap[activeFilter]?.includes(l.id));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [activeFilter, searchQuery]);

  return (
    <PageLayout cardWrapper={false}>
      <Section spacing="lg">
        <LexiconHeader
          wordsLearned={totalWordsLearned}
          totalWords={totalWords}
          percentageDone={percentageDone}
        />

        <div className="space-y-6">
          <LexiconFilters active={activeFilter} onChange={setActiveFilter} />

          <LexiconSearchBar value={searchQuery} onChange={setSearchQuery} />

          <LessonGrid
            lessons={filteredLessons}
            onLessonClick={(lessonId) => {
              // TODO: Navigate to lesson detail page
              console.log("Clicked lesson:", lessonId);
            }}
          />
        </div>
      </Section>
    </PageLayout>
  );
}
