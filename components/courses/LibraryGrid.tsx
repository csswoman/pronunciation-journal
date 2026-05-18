"use client";
// Planned structure:
// <LibraryGrid>
//   <SourceFilter />
//   <LibraryCard />   ← one per theory_lesson, badged Notes / Course
// </LibraryGrid>
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { getAllTheoryLessons } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";
import { cn } from "@/lib/cn";

type SourceFilter = "all" | "manual" | "notion";

const FILTERS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "manual", label: "Courses" },
  { value: "notion", label: "Notes" },
];

export default function LibraryGrid() {
  const [items, setItems] = useState<TheoryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SourceFilter>("all");

  useEffect(() => {
    getAllTheoryLessons()
      .then((all) => setItems(all.filter((l) => l.is_published)))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load library"))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.source === filter);
  }, [items, filter]);

  const countFor = (value: SourceFilter) =>
    value === "all" ? items.length : items.filter((i) => i.source === value).length;

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-on-primary"
                : "bg-surface-raised text-fg-muted border border-border-subtle hover:bg-btn-plain-hover"
            )}
          >
            {f.label} ({countFor(f.value)})
          </Button>
        ))}
      </div>

      <div className="p-4">
        {error && (
          <div className="rounded-xl p-3 mb-4 bg-error-soft text-error text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border-subtle px-8 text-center">
            <p className="text-sm text-fg-muted">Nothing here yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <LibraryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryCard({ item }: { item: TheoryLesson }) {
  const cat = LESSON_CATEGORIES.find((c) => c.value === item.category);
  const isNotion = item.source === "notion";

  return (
    <Link
      href={`/courses/library/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-raised transition-all duration-200 hover:border-border-default hover:-translate-y-px"
    >
      <div className="relative h-32 bg-[var(--btn-regular-bg)] flex items-center justify-center shrink-0">
        <Badge
          label={isNotion ? "Notes" : "Course"}
          color={isNotion ? "violet" : "teal"}
          className="absolute top-2 left-2 z-10"
        />
        {item.cover_image_url ? (
          <Image src={item.cover_image_url} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
          </svg>
        )}
      </div>
      <div className="p-4 space-y-2">
        <p className="text-sm font-semibold text-fg group-hover:text-[var(--primary)] transition-colors line-clamp-2">
          {item.title}
        </p>
        <span className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)] text-fg-subtle inline-block">
          {cat?.label ?? item.category}
        </span>
      </div>
    </Link>
  );
}
