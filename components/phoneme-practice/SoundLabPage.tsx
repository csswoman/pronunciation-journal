"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Headphones } from "lucide-react";
import { SoundLabHeader } from "./SoundLabHeader";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import type { LessonSection } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";

const IPA_VOWEL_RE = /[aeiouæɑɒɔɛɜɪɐəʌʊ]/;

const ALL_GROUP_SECTIONS = [
  { id: "vowels", title: "Vowels" },
  { id: "diphthongs", title: "Diphthongs" },
  { id: "consonants", title: "Consonants" },
] as const;

function getLessonSectionId(lesson: Lesson): string {
  const ipaMatch = lesson.title.match(/^\/+([^/]+)\/+/);
  const title = lesson.title.toLowerCase();
  if (title.includes("diphthong")) return "diphthongs";
  return ipaMatch && IPA_VOWEL_RE.test(ipaMatch[1]) ? "vowels" : "consonants";
}

function matchesDifficultyChip(lesson: Lesson, chip: SoundLabChip): boolean {
  if (chip === "all") return true;
  return lesson.difficulty === chip;
}

function resolveGroupId(lesson: Lesson): string {
  return getLessonSectionId(lesson);
}

/** True when a lesson teaches any of the focused IPA symbols (from a course handoff). */
function matchesFocus(lesson: Lesson, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const title = lesson.title.toLowerCase();
  return tokens.some((t) => {
    const tok = t.toLowerCase();
    if (title.includes(tok)) return true;
    return lesson.words?.some((w) => w.ipa?.toLowerCase().includes(tok)) ?? false;
  });
}

export default function SoundLabPage() {
  const router = useRouter();
  const { allLessons, soundProgressMap, inProgressCount, heroLesson, isLoading } =
    useSoundLabData();

  const searchParams = useSearchParams();
  const focusTokens = useMemo(() => {
    const raw = searchParams.get("focus");
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }, [searchParams]);

  const [activeChip, setActiveChip] = useState<SoundLabChip>("all");
  const [search, setSearch] = useState("");

  const focusSection = useMemo<LessonSection | null>(() => {
    if (focusTokens.length === 0) return null;
    const lessons = allLessons.filter((l) => matchesFocus(l, focusTokens));
    if (lessons.length === 0) return null;
    return {
      id: "focus",
      title: `Sounds from your lesson · ${focusTokens.join(" · ")}`,
      count: lessons.length,
      lessons,
    };
  }, [allLessons, focusTokens]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLessons.filter((lesson) => {
      if (!matchesDifficultyChip(lesson, activeChip)) return false;
      if (!q) return true;
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.description.toLowerCase().includes(q)
      );
    });
  }, [allLessons, activeChip, search]);

  const sections = useMemo<LessonSection[]>(() => {
    if (filtered.length === 0) return [];

    if (activeChip !== "all") {
      return [
        {
          id: activeChip,
          title: "",
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

  function handleClearFilters() {
    setActiveChip("all");
    setSearch("");
  }

  return (
    <div className="sound-lab min-h-screen">
      <div className="px-4 pt-5 pb-14 sm:px-6 sm:pt-10 lg:px-10">
        <header className="sound-lab__page-header">

          <SoundLabHeader
            totalCount={allLessons.length}
            inProgressCount={inProgressCount}
            heroLesson={heroLesson.lesson}
            heroProgress={heroLesson.progress}
            onResume={handleResume}
          />

          <SoundLabFilterRow
            activeChip={activeChip}
            search={search}
            onChipChange={setActiveChip}
            onSearchChange={setSearch}
          />

          {focusTokens.length > 0 && (
            <div
              className="sound-lab__focus-banner flex items-center gap-2 rounded-xl border px-4 py-3"
              role="status"
            >
              <Headphones size={14} className="sound-lab__focus-banner-icon shrink-0" aria-hidden />
              <span className="text-sm text-[color:var(--text-secondary)]">
                From your course: practicing{" "}
                <span className="sound-lab__focus-tokens">{focusTokens.join(" · ")}</span>
                {!focusSection && (
                  <span className="text-[color:var(--text-tertiary)]">. No matching lessons yet.</span>
                )}
              </span>
              <Link
                href="/practice/sounds"
                className="sound-lab__focus-banner-link ml-auto shrink-0 text-xs hover:underline"
              >
                View all sounds
              </Link>
            </div>
          )}
        </header>

        <SoundLabLessonGrid
          sections={focusSection ? [focusSection, ...sections] : sections}
          heroLessonId={heroLesson.lesson?.id}
          soundProgressMap={soundProgressMap}
          isLoading={isLoading}
          onClearFilters={handleClearFilters}
        />
      </div>
    </div>
  );
}
