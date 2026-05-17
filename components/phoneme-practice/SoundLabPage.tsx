// Planned structure:
// <SoundLabPage>
//   Page bg #EEF3F8
//   Zone 1 — Hero (white card, rounded-md): SoundLabHeader, SoundLabContinuingBar, SoundLabStatsStrip
//   Zone 2 — Gap (transparent, h-6)
//   Zone 3 — Lessons (white card, rounded-md): SoundLabFilterRow, SoundLabLessonGrid
// </SoundLabPage>

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

const SECTION_DEFS: { id: string; title: string }[] = [
  { id: "vowels", title: "Vowel Sounds" },
  { id: "consonants", title: "Consonant Sounds" },
  { id: "patterns", title: "Spelling Patterns" },
];

function getLessonSectionId(lesson: Lesson): string {
  const ipaMatch = lesson.title.match(/^\/([^/]+)\//);
  if (ipaMatch) {
    return IPA_VOWEL_RE.test(ipaMatch[1]) ? "vowels" : "consonants";
  }
  return "patterns";
}

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
    if (pct !== undefined && pct > 0 && pct < 60) chips.push("weak");
  }

  return chips;
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
    const grouped = new Map<string, Lesson[]>();
    for (const lesson of filtered) {
      const sid = getLessonSectionId(lesson);
      if (!grouped.has(sid)) grouped.set(sid, []);
      grouped.get(sid)!.push(lesson);
    }
    return SECTION_DEFS
      .filter((def) => grouped.has(def.id))
      .map((def) => ({ id: def.id, title: def.title, lessons: grouped.get(def.id)! }));
  }, [filtered]);

  function handleResume() {
    if (!heroLesson.lesson) return;
    const dest = heroLesson.lesson.href ?? `/practice/lesson/${heroLesson.lesson.id}`;
    router.push(dest);
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-space-8 py-space-8">

        {/* ── Zone 1: Hero ─────────────────────────────────────── */}
        <div className="rounded-md border border-border-subtle bg-surface-raised px-space-12 py-space-10 shadow-sm">
          {/* Row 1: title + resume CTA */}
          <SoundLabHeader onResume={heroLesson.lesson ? handleResume : undefined} />

          {/* Row 2: Continuing bar — only when a lesson is in progress */}
          {heroLesson.lesson && (
            <div className="mt-space-5">
              <SoundLabContinuingBar
                lesson={heroLesson.lesson}
                progress={heroLesson.progress}
                onResume={handleResume}
              />
            </div>
          )}

          {/* Row 3: Stats strip */}
          <div className="mt-space-5">
            <SoundLabStatsStrip
              totalCount={allLessons.length}
              completedCount={completedCount}
              inProgressCount={inProgressCount}
            />
          </div>
        </div>

        {/* ── Zone 2: Divider ───────────────────────────────────── */}
        <div className="h-4" />

        {/* ── Zone 3: Lessons ──────────────────────────────────── */}
        <div className="rounded-md border border-border-subtle bg-surface-raised px-space-12 py-space-10 shadow-sm">
          <SoundLabFilterRow
            activeChip={activeChip}
            search={search}
            lessonCount={filtered.length}
            onChipChange={setActiveChip}
            onSearchChange={setSearch}
          />
          <SoundLabLessonGrid
            sections={sections}
            heroLessonId={heroLesson.lesson?.id}
            soundProgressMap={soundProgressMap}
            isLoading={isLoading}
          />
        </div>

      </div>
    </div>
  );
}
