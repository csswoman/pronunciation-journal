"use client";

import { useEffect, useState } from "react";
import type { Course } from "@/lib/notion/types";
import CourseCard from "@/components/courses/CourseCard";

export default function HomeCoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notion/courses")
      .then((r) => r.json())
      .then((data) => { setCourses(data.slice(0, 4)); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] h-40 overflow-hidden relative">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return <p className="text-[var(--text-secondary)] text-sm col-span-2">No courses available yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {courses.map((course, i) => (
        <CourseCard key={course.id} course={course} priority={i < 2} />
      ))}
    </div>
  );
}
