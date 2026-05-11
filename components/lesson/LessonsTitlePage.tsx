"use client";

import { H1 } from "@/components/ui/Typography";

export default function LessonsTitlePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      <header style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <H1 className="text-h1">
            Lessons
          </H1>
        </div>
      </header>
    </div>
  );
}
