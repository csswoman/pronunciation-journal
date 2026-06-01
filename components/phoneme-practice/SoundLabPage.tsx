"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SoundLabHeader } from "./SoundLabHeader";
import { SoundLabContinuingBar } from "./SoundLabContinuingBar";
import { SoundLabStatsStrip } from "./SoundLabStatsStrip";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import type { LessonSection } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";

const IPA_VOWEL_RE = /[aeiouæɑɒɔɛɜɪɐəʌʊ]/;

const CHIP_SECTION_TITLES: Record<SoundLabChip, string> = {
  all: "All Sounds",
  basics: "Basics",
  vowels: "Vowel Sounds",
  consonants: "Consonant Sounds",
  diphthongs: "Diphthongs",
  weak: "Weak for you",
};

const ALL_GROUP_SECTIONS = [
  { id: "vowels", title: "Vowel Sounds" },
  { id: "diphthongs", title: "Diphthongs" },
  { id: "consonants", title: "Consonant Sounds" },
] as const;

function getLessonSectionId(lesson: Lesson): string {
  const ipaMatch = lesson.title.match(/^\/([^/]+)\//);
  return ipaMatch && IPA_VOWEL_RE.test(ipaMatch[1]) ? "vowels" : "consonants";
}

function categorizLesson(lesson: Lesson, soundProgressMap: Map<number, number>): SoundLabChip[] {
  const title = lesson.title.toLowerCase();
  const chips: SoundLabChip[] = ["all"];

  if (lesson.difficulty === "easy" || lesson.category === "basics") chips.push("basics");
  if (title.includes("diphthong")) chips.push("diphthongs");

  const sectionId = getLessonSectionId(lesson);
  if (sectionId === "vowels" || title.includes("vowel") || lesson.category === "vowels") {
    chips.push("vowels");
  }
  if (sectionId === "consonants" || title.includes("consonant") || lesson.category === "consonants") {
    chips.push("consonants");
  }

  if (lesson.id.startsWith("sound-")) {
    const pct = soundProgressMap.get(Number(lesson.id.replace("sound-", "")));
    if (pct !== undefined && pct > 0 && pct < 60) chips.push("weak");
  }

  return chips;
}

function resolveGroupId(lesson: Lesson): string {
  const chips = categorizLesson(lesson, new Map());
  if (chips.includes("diphthongs")) return "diphthongs";
  if (chips.includes("vowels")) return "vowels";
  if (chips.includes("consonants")) return "consonants";
  return getLessonSectionId(lesson);
}

export default function SoundLabPage() {
  const router = useRouter();
  const { allLessons, soundProgressMap, completedCount, inProgressCount, heroLesson, isLoading } =
    useSoundLabData();

  const [activeChip, setActiveChip] = useState<SoundLabChip>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLessons.filter((lesson) => {
      if (!categorizLesson(lesson, soundProgressMap).includes(activeChip)) return false;
      if (!q) return true;
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q)
      );
    });
  }, [allLessons, activeChip, search, soundProgressMap]);

  const sections = useMemo<LessonSection[]>(() => {
    if (filtered.length === 0) return [];

    if (activeChip !== "all") {
      return [
        {
          id: activeChip,
          title: CHIP_SECTION_TITLES[activeChip],
          count: filtered.length,
          lessons: filtered,
        },
      ];
    }

    const buckets = new Map<string, Lesson[]>(
      ALL_GROUP_SECTIONS.map((g) => [g.id, []]),
    );

    for (const lesson of filtered) {
      const groupId = resolveGroupId(lesson);
      const list = buckets.get(groupId) ?? buckets.get("consonants")!;
      list.push(lesson);
      buckets.set(groupId, list);
    }

    return ALL_GROUP_SECTIONS.map((g) => ({
      id: g.id,
      title: g.title,
      count: buckets.get(g.id)?.length ?? 0,
      lessons: buckets.get(g.id) ?? [],
    })).filter((s) => s.lessons.length > 0);
  }, [filtered, activeChip]);

  function handleResume() {
    if (!heroLesson.lesson?.href) return;
    router.push(heroLesson.lesson.href);
  }

  return (
    <div className="sound-lab min-h-screen">
      <div className="sound-lab__wrap">
        <header className="sound-lab__hero">
          <SoundLabHeader />

          {heroLesson.lesson && (
            <SoundLabContinuingBar
              lesson={heroLesson.lesson}
              progress={heroLesson.progress}
              onResume={handleResume}
            />
          )}

          <SoundLabStatsStrip
            totalCount={allLessons.length}
            completedCount={completedCount}
            inProgressCount={inProgressCount}
          />

          <SoundLabFilterRow
            activeChip={activeChip}
            search={search}
            onChipChange={setActiveChip}
            onSearchChange={setSearch}
          />
        </header>

        <SoundLabLessonGrid
          sections={sections}
          heroLessonId={heroLesson.lesson?.id}
          soundProgressMap={soundProgressMap}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
