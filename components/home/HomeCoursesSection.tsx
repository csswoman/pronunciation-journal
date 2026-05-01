"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Course } from "@/lib/notion/types";
import CourseCard from "@/components/courses/CourseCard";

const VISIBLE = 2;

export default function HomeCoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notion/courses")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const maxIndex = Math.max(0, courses.length - VISIBLE);
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(maxIndex, i + 1));

  // Scroll the track to the correct position using scrollLeft (no overflow on page)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[0] as HTMLElement | undefined;
    if (!card) return;
    const step = card.offsetWidth + 16;
    track.scrollTo({ left: index * step, behavior: "smooth" });
  }, [index]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] h-40 overflow-hidden relative">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return <p className="text-[var(--text-secondary)] text-sm">No courses available yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* overflow-hidden on THIS div clips the track without affecting page layout */}
      <div className="overflow-hidden rounded-xl">
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {courses.map((course, i) => (
            <div
              key={course.id}
              className="shrink-0"
              style={{ maxWidth: "320px", minWidth: "280px", width: "45vw", flexShrink: 0, scrollSnapAlign: "start" }}
            >
              <CourseCard course={course} priority={i < 2} />
            </div>
          ))}
        </div>
      </div>

      {courses.length > VISIBLE && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {courses.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(Math.min(i, maxIndex))}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i >= index && i < index + VISIBLE
                    ? "w-4 bg-[var(--primary)]"
                    : "w-1.5 bg-[var(--line-color)]"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={prev}
              disabled={index === 0}
              className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--line-divider)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--deep-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={next}
              disabled={index >= maxIndex}
              className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--line-divider)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--deep-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
