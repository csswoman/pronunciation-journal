"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Headphones } from "@/components/icons";
import PageLayout from "@/components/layout/PageLayout";
import { SoundLabHeader } from "./SoundLabHeader";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import type { LessonSection } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";

const IPA_VOWEL_RE = /[aeiouæɑɒɔɛɜɪɐəʌʊ]/;

const ALL_GROUP_SECTIONS = [
  { id: "vowels", title: "Vocales" },
  { id: "diphthongs", title: "Diptongos" },
  { id: "consonants", title: "Consonantes" },
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
      title: `Sonidos de tu lección · ${focusTokens.join(" · ")}`,
      count: lessons.length,
      lessons,
    };
  }, [allLessons, focusTokens]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLessons.filter((lesson) => {
      if (!matchesDifficultyChip(lesson, activeChip)) return false;
      if (!q) return true;
      if (lesson.title.toLowerCase().includes(q)) return true;
      if (lesson.description.toLowerCase().includes(q)) return true;
      const ipa = lesson.title.match(/^\/+([^/]+)\/+/)?.[1]?.toLowerCase();
      if (ipa && ipa.includes(q.replaceAll("/", ""))) return true;
      return (
        lesson.words?.some((w) => {
          if (w.word?.toLowerCase().includes(q)) return true;
          if (w.ipa?.toLowerCase().includes(q)) return true;
          return false;
        }) ?? false
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
    <PageLayout className="sound-lab min-h-screen">
      <header className="sound-lab__page-header">
        <SoundLabHeader
          totalCount={allLessons.length}
          inProgressCount={inProgressCount}
          heroLesson={heroLesson.lesson}
          onResume={handleResume}
        />

        <SoundLabFilterRow
          activeChip={activeChip}
          search={search}
          resultCount={filtered.length}
          onChipChange={setActiveChip}
          onSearchChange={setSearch}
          onClearFilters={handleClearFilters}
        />

        {focusTokens.length > 0 && (
          <div
            className="sound-lab__focus-banner flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3"
            role="status"
          >
            <Headphones size={14} className="sound-lab__focus-banner-icon shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 text-body-sm text-[color:var(--text-secondary)]">
              Enfoque:{" "}
              <span className="sound-lab__focus-tokens font-ipa">{focusTokens.join(" · ")}</span>
              {!focusSection && (
                <span className="text-[color:var(--text-secondary)]">
                  . Aún no hay lecciones que coincidan.
                </span>
              )}
            </span>
            {focusSection?.lessons[0]?.href ? (
              <Link
                href={focusSection.lessons[0].href}
                className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-[var(--cta-bg)] px-3 text-caption font-semibold text-[var(--cta-fg)]"
              >
                Abrir este sonido
              </Link>
            ) : null}
            <Link
              href="/practice/sounds"
              className="sound-lab__focus-banner-link shrink-0 text-caption hover:underline"
            >
              Ver todos
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
    </PageLayout>
  );
}
