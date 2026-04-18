"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import PageHeader from "@/components/layout/PageHeader";
import LessonCard from "@/components/LessonCard";
import LessonsSidebar, { type Filters } from "@/components/LessonsSidebar";
import Button from "@/components/ui/Button";
import {
  groupLessonsByLevel,
  LEVEL_ORDER,
  type LessonListItem,
} from "@/lib/groupLessonsByLevel";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";

type LessonsTab = "explore" | "my";

const INITIAL_FILTERS: Filters = {
  search: "",
  level: null,
  category: null,
  source: "all",
};

const LEVEL_SET = new Set(["A1", "A2", "B1", "B2", "C1"]);

function normalizeLessonRow(row: Record<string, unknown>): LessonListItem {
  const rowLevel = typeof row.level === "string" ? row.level.toUpperCase() : null;
  const category = typeof row.category === "string" ? row.category : null;
  const fallbackLevel = category ? category.toUpperCase() : null;
  const normalizedLevel = rowLevel ?? fallbackLevel;

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    content: typeof row.content === "string" ? row.content : null,
    level: normalizedLevel && LEVEL_SET.has(normalizedLevel) ? normalizedLevel : null,
    category,
    is_system: Boolean(row.is_system),
    created_by:
      typeof row.created_by === "string"
        ? row.created_by
        : typeof row.user_id === "string"
          ? row.user_id
          : null,
    image_url:
      typeof row.image_url === "string"
        ? row.image_url
        : typeof row.cover_image_url === "string"
          ? row.cover_image_url
          : null,
    slug: typeof row.slug === "string" ? row.slug : null,
  };
}

async function fetchLessonsFromSupabase(params: {
  filters: Filters;
  activeTab: LessonsTab;
  userId: string | null;
}): Promise<LessonListItem[]> {
  const { filters, activeTab, userId } = params;
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("theory_lessons")
    .select("id,title,content,category,is_system,user_id,cover_image_url,slug")
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.level) {
    query = query.eq("category", filters.level.toLowerCase());
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.source === "system") {
    query = query.eq("is_system", true);
  }
  if (filters.source === "mine") {
    query = query.eq("is_system", false);
  }
  if (activeTab === "my" && userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return ((data as Record<string, unknown>[] | null) ?? []).map(normalizeLessonRow);
}

export default function LessonsPage() {
  const { user, supabaseEnabled } = useAuth();
  const [activeTab, setActiveTab] = useState<LessonsTab>("explore");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLessons() {
      if (!supabaseEnabled) {
        if (!isMounted) return;
        setLessons([]);
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      if (activeTab === "my" && !user?.id) {
        if (!isMounted) return;
        setLessons([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await fetchLessonsFromSupabase({
          filters,
          activeTab,
          userId: user?.id ?? null,
        });
        if (!isMounted) return;
        setLessons(data);
      } catch (fetchError) {
        if (!isMounted) return;
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load lessons.";
        setError(message);
        setLessons([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLessons();
    return () => {
      isMounted = false;
    };
  }, [activeTab, filters, supabaseEnabled, user?.id]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        lessons
          .map((lesson) => lesson.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const groupedLessons = useMemo(() => groupLessonsByLevel(lessons), [lessons]);
  const lessonsWithoutLevel = useMemo(
    () => lessons.filter((lesson) => !lesson.level),
    [lessons],
  );
  const hasResults = LEVEL_ORDER.some(
    (level) => groupedLessons[level].length > 0,
  ) || lessonsWithoutLevel.length > 0;

  return (
    <div className="py-8 pb-24">
      <Container>
        <PageHeader
          badge="Study Path"
          title="Lessons"
          subtitle="Learn by Level"
          description="Find the right lesson and keep moving."
          primaryCta={{
            label: "New Lesson",
            icon: <Plus size={16} />,
            onClick: () => window.location.href = "/lessons/new",
          }}
          illustration={
            <Image
              src="/illustrations/exposition.svg"
              alt="Lessons exposition illustration"
              width={552}
              height={348}
              priority
              className="w-[300px] xl:w-[340px] h-auto"
            />
          }
        />
      </Container>

      <Container>
        <Section spacing="lg" className="mt-8">
          {/* Tabs */}
          <div className="inline-flex rounded-xl border p-1" style={{ borderColor: 'var(--line-divider)', backgroundColor: 'var(--card-bg)' }}>
            <Button
              type="button"
              onClick={() => setActiveTab("explore")}
              variant="segmented"
              size="sm"
              selected={activeTab === "explore"}
              className="rounded-lg px-4 py-2 text-sm font-medium"
            >
              Explore
            </Button>
            <Button
              type="button"
              onClick={() => setActiveTab("my")}
              variant="segmented"
              size="sm"
              selected={activeTab === "my"}
              className="rounded-lg px-4 py-2 text-sm font-medium"
            >
              My Lessons
            </Button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row mt-6">
            <main className="flex-1">
            {loading && (
              <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-8 text-center text-sm text-[var(--text-secondary)]">
                Loading lessons...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && !hasResults && (
              <div className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-10 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  No lessons found with the current filters.
                </p>
                <Link
                  href="/lessons/new"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--primary)]"
                >
                  Create your first lesson
                </Link>
              </div>
            )}

            {!loading && !error && hasResults && (
              <div className="space-y-10">
                {LEVEL_ORDER.map((level) => {
                  const rows = groupedLessons[level];
                  if (rows.length === 0) return null;
                  return (
                    <section key={level}>
                      <div className="mb-4 flex items-end justify-between">
                        <h2 className="text-xl font-semibold text-[var(--deep-text)]">{level}</h2>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {rows.length} lesson{rows.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {rows.map((lesson) => (
                          <LessonCard key={lesson.id} lesson={lesson} />
                        ))}
                      </div>
                    </section>
                  );
                })}

                {lessonsWithoutLevel.length > 0 && (
                  <section>
                    <div className="mb-4 flex items-end justify-between">
                      <h2 className="text-xl font-semibold text-[var(--deep-text)]">General</h2>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {lessonsWithoutLevel.length} lesson{lessonsWithoutLevel.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {lessonsWithoutLevel.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
            </main>

            <aside className="w-full lg:w-72">
              <LessonsSidebar
                filters={filters}
                categories={categories}
                onFiltersChange={setFilters}
              />
            </aside>
          </div>
        </Section>
      </Container>
    </div>
  );
}
