// Planned structure:
// <CoursePathRealLife>
//   <button (toggle header)>
//   <grid of CoursePathRealLifeCard />
// </CoursePathRealLife>

"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RealLifeScenario } from "@/lib/courses/types";
import CoursePathRealLifeCard from "@/components/courses/CoursePathRealLifeCard";

interface CoursePathRealLifeProps {
  scenarios: RealLifeScenario[];
}

export default function CoursePathRealLife({ scenarios }: CoursePathRealLifeProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("course-path__irl", open && "course-path__irl--open")}>
      <button
        type="button"
        className="course-path__irl-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>🌍 English for every day</span>
        <ChevronRight className="course-path__irl-chev" size={16} aria-hidden />
      </button>
      <div className="course-path__irl-body-wrap">
        <div className="course-path__irl-grid">
          {scenarios.map((s) => (
            <CoursePathRealLifeCard key={s.id} scenario={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
