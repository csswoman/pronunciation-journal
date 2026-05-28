// Planned structure:
// <CourseTocSidebar>
//   <TocList />     (H2 only, max 6, no emojis, accent bar indicator)
// </CourseTocSidebar>

"use client";

import { useEffect, useMemo, useState } from "react";
import type { TocEntry } from "@/components/courses/courseContentHelpers";

interface CourseTocSidebarProps {
  toc:         TocEntry[];
  wordCount:   number;     // kept for API compatibility; meta now lives in hero
  readTimeMin: number;
}

const TOC_LIMIT = 6;

export default function CourseTocSidebar({ toc }: CourseTocSidebarProps) {
  const items = useMemo(
    () => toc.filter((e) => e.level === 2).map(stripDecorative).slice(0, TOC_LIMIT),
    [toc]
  );
  const activeId = useActiveHeading(items);

  if (items.length === 0) return null;

  return (
    <aside
      className="hidden lg:flex flex-col sticky"
      style={{
        top: "calc(var(--space-12) + 1rem)",
        maxHeight: "calc(100vh - 6rem)",
        overflowY: "auto",
        gap: "var(--space-3)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui), 'DM Sans', system-ui, sans-serif",
          fontSize: "0.6875rem",
          fontWeight: 500,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
        }}
      >
        Contents
      </span>

      <nav>
        <ul className="flex flex-col list-none p-0 m-0" style={{ gap: "2px" }}>
          {items.map((entry) => {
            const isActive = entry.id === activeId;
            return (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="block transition-colors"
                  style={{
                    fontFamily: "var(--font-ui), 'DM Sans', system-ui, sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    padding: "6px 8px",
                    backgroundColor: isActive ? "color-mix(in oklch, var(--primary) 12%, transparent)" : "transparent",
                    borderRadius: "4px",
                    textDecoration: "none",
                    lineHeight: 1.4,
                    transition: "color var(--transition-fast), background-color var(--transition-fast)",
                  }}
                >
                  {entry.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function stripDecorative(entry: TocEntry): TocEntry {
  return {
    ...entry,
    text: entry.text
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Component}‍︎️]/gu, "")
      .replace(/\s+/g, " ")
      .trim(),
  };
}

function useActiveHeading(toc: TocEntry[]): string | null {
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    );
    toc.forEach((entry) => {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  return active;
}
