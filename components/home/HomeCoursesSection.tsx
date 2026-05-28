"use client";

// Planned structure:
// <HomeCoursesSection>
//   <header row: title + "View all" link />
//   <list: up to 3 CourseRow items />
//   <skeleton while loading />
// </HomeCoursesSection>

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Course } from "@/lib/notion/types";

function courseIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (/audio|listen|shadow/.test(t)) return Headphones;
  if (/convers|speak|chat/.test(t)) return MessageSquare;
  return BookOpen;
}

interface CourseRowProps {
  course: Course;
}

function CourseRow({ course }: CourseRowProps) {
  const Icon = courseIcon(course.title);
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="flex items-center gap-3 py-2.5 rounded-xl hover:bg-[var(--hue-icon-bg)] transition-colors px-1 -mx-1 group"
    >
      <span className="icon-wrap-hue flex items-center justify-center w-9 h-9 rounded-lg shrink-0">
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{course.title}</p>
        <p className="text-[11px] text-[var(--text-tertiary)] truncate">{course.description ?? "—"}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--hue-bar)]" style={{ width: "0%" }} />
        </div>
        <ArrowRight size={13} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

function CourseRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <div className="w-9 h-9 rounded-lg bg-[var(--border-subtle)] animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-3 w-2/3 rounded bg-[var(--border-subtle)] animate-pulse" />
        <div className="h-2.5 w-1/2 rounded bg-[var(--border-subtle)] animate-pulse" />
      </div>
    </div>
  );
}

export default function HomeCoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notion/courses")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Course[]) => { setCourses(data.slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
          Your courses
        </p>
        <Link
          href="/courses"
          className="text-[11px] font-medium text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          View all <ArrowRight size={11} />
        </Link>
      </div>

      {loading ? (
        <>
          <CourseRowSkeleton />
          <CourseRowSkeleton />
          <CourseRowSkeleton />
        </>
      ) : courses.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)] py-3">No courses available yet.</p>
      ) : (
        courses.map((course) => <CourseRow key={course.id} course={course} />)
      )}
    </div>
  );
}
