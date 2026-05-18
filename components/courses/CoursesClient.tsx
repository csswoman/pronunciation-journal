"use client";

import { useRef, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import MiniLessonsGrid from "@/components/courses/MiniLessonsGrid";
import LibraryGrid from "@/components/courses/LibraryGrid";
import type { MiniLesson } from "@/lib/content/schemas";

type ActiveTab = "library" | "mini-lessons";

const tabs: { value: ActiveTab; label: string }[] = [
  { value: "library",      label: "Library"      },
  { value: "mini-lessons", label: "Mini Lessons" },
];

export default function CoursesClient({ miniLessons }: { miniLessons: MiniLesson[] }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("library");
  const sectionRef = useRef<HTMLDivElement | null>(null);

  return (
    <PageLayout
      hero={
        <PageHeader
          badge="Courses"
          title="Continue your"
          subtitle="learning path"
          description="Your synced Notion notes, curated courses, and quick mini lessons."
          primaryCta={{
            label: "Browse lessons",
            onClick: () => {
              sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            },
          }}
          variant="compact"
        />
      }
    >
      <div
        ref={sectionRef}
        className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] shadow-[0_1px_3px_var(--line-divider)] overflow-hidden"
      >
        {/* Tab selector */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-[var(--line-divider)]">
          {tabs.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2"
                style={
                  active
                    ? { color: "var(--primary)", borderColor: "var(--primary)" }
                    : { color: "var(--text-secondary)", borderColor: "transparent" }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Library tab — theory_lessons (Notion notes + manual courses) */}
        {activeTab === "library" && <LibraryGrid />}

        {/* Mini Lessons tab */}
        {activeTab === "mini-lessons" && <MiniLessonsGrid lessons={miniLessons} />}
      </div>
    </PageLayout>
  );
}
