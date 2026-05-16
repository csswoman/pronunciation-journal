// Planned structure:
// <SoundLabPage>
//   <SoundLabHeader />
//   <SoundLabContinuingBar />
//   <SoundLabStatsStrip />
//   <SoundLabFilterRow />
//   <SoundLabLessonGrid />
// </SoundLabPage>

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SoundLabHeader } from "./SoundLabHeader";
import { SoundLabContinuingBar } from "./SoundLabContinuingBar";
import { SoundLabStatsStrip } from "./SoundLabStatsStrip";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";

const PAGE_SIZE = 9;

function categorizLesson(lesson: Lesson, soundProgressMap: Map<number, number>): SoundLabChip[] {
  const title = lesson.title.toLowerCase();
  const chips: SoundLabChip[] = ["all"];

  if (lesson.difficulty === "easy" || lesson.category === "basics") chips.push("basics");
  if (title.includes("diphthong")) chips.push("diphthongs");
  if (title.includes("vowel") || lesson.category === "vowels") chips.push("vowels");
  if (title.includes("consonant") || lesson.category === "consonants") chips.push("consonants");
  if (title.includes("/")) chips.push("vowels", "consonants");

  if (lesson.id.startsWith("sound-")) {
    const pct = soundProgressMap.get(Number(lesson.id.replace("sound-", "")));
    if (pct !== undefined && pct > 0 && pct < 50) chips.push("weak");
  }

  return chips;
}

export default function SoundLabPage() {
  const router = useRouter();
  const { allLessons, soundProgressMap, completedCount, inProgressCount, heroLesson, isLoading } =
    useSoundLabData();

  const [activeChip, setActiveChip] = useState<SoundLabChip>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function handleChipChange(chip: SoundLabChip) {
    setActiveChip(chip);
    setPage(1);
  }

  function handleSearchChange(q: string) {
    setSearch(q);
    setPage(1);
  }

  function handleResume() {
    if (!heroLesson.lesson) return;
    const dest = heroLesson.lesson.href ?? `/practice/lesson/${heroLesson.lesson.id}`;
    router.push(dest);
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-[1280px] px-space-8 py-space-12">
        <SoundLabHeader onResume={heroLesson.lesson ? handleResume : undefined} />
        <SoundLabContinuingBar lesson={heroLesson.lesson} progress={heroLesson.progress} />
        <SoundLabStatsStrip
          totalCount={allLessons.length}
          currentPage={page}
          totalPages={totalPages}
          completedCount={completedCount}
          inProgressCount={inProgressCount}
        />
        <SoundLabFilterRow
          activeChip={activeChip}
          search={search}
          lessonCount={filtered.length}
          onChipChange={handleChipChange}
          onSearchChange={handleSearchChange}
        />
        <SoundLabLessonGrid
          lessons={paginated}
          soundProgressMap={soundProgressMap}
          totalCount={filtered.length}
          currentPage={page}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
