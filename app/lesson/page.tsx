"use client";

import { useState } from "react";
import { getAllLessons } from "@/lib/lesson-generator";
import LessonCard from "@/components/lesson/LessonCard";
import Link from "next/link";

export default function LessonsPage() {
  const lessons = getAllLessons();
  const [activeTab, setActiveTab] = useState("all");

  const categories = [...new Set(lessons.map((l) => l.category))];

  // Get unique categories for tabs
  const tabs = [
    { id: "all", label: "All" },
    ...categories.map((cat) => ({ id: cat, label: cat.replace(/-/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") })),
  ];

  // Filter lessons based on active tab
  const filteredLessons = activeTab === "all"
    ? lessons
    : lessons.filter((l) => l.category === activeTab);

  // Get recommended lessons (first 3 from filtered)
  const recommendedLessons = filteredLessons.slice(0, 3);

  // Get lessons grouped by category for the grid
  const lessonsByCategory = categories.map((category) => ({
    category,
    lessons: filteredLessons.filter((l) => l.category === category),
  })).filter((group) => group.lessons.length > 0);

  return (
    <div className="min-h-screen" style={{
      backgroundColor: 'var(--page-bg)',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--page-bg)',
      }} className="">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2" style={{
                color: 'var(--text-primary)',
              }}>
                Lessons
              </h1>
              <p className="text-lg" style={{
                color: 'var(--text-secondary)',
              }}>
                Improve your pronunciation with structured practice
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap justify-end">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 rounded-full font-medium transition-all text-sm"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'var(--card-bg)',
                    color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                    borderColor: activeTab === tab.id ? 'transparent' : 'var(--line-divider)',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Recommended Section */}
        {recommendedLessons.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{
                color: 'var(--text-primary)',
              }}>
                Recommended for you
              </h2>
              <Link
                href="#"
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{
                  color: 'var(--primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                View all
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="space-y-12">
          {lessonsByCategory.map((group) => (
            <div key={group.category} className="">
              <h2 className="text-2xl font-bold mb-6 pb-4 border-l-4 pl-4" style={{
                color: 'var(--text-primary)',
                borderLeftColor: 'var(--primary)',
              }}>
                {group.category.replace(/-/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
