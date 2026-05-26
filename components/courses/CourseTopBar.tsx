// Planned structure:
// <CourseTopBar>
//   <Breadcrumb />     (Courses / [title])
//   <Actions />         (search, bookmark, share, theme, Mark complete)
// </CourseTopBar>

"use client";

import Link from "next/link";
import { Bookmark, Check, Search, Share2, Sun } from "lucide-react";

interface CourseTopBarProps {
  title:       string;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export default function CourseTopBar({ title, isCompleted, onMarkComplete }: CourseTopBarProps) {
  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between flex-wrap"
      style={{
        gap: "var(--space-4)",
        padding: "var(--space-3) var(--space-6)",
        background: "color-mix(in srgb, var(--page-bg) 85%, transparent)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Breadcrumb title={title} />
      <Actions isCompleted={isCompleted} onMarkComplete={onMarkComplete} />
    </div>
  );
}

function Breadcrumb({ title }: { title: string }) {
  return (
    <nav className="flex items-center min-w-0" style={{ gap: "var(--space-2)", font: "var(--font-body-sm)" }}>
      <span aria-hidden style={{ color: "var(--text-tertiary)" }}>📖</span>
      <Link
        href="/courses"
        style={{ color: "var(--text-tertiary)", textDecoration: "none" }}
        className="hover:underline underline-offset-2"
      >
        Courses
      </Link>
      <span style={{ color: "var(--text-tertiary)" }} aria-hidden>/</span>
      <span className="truncate" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
        {title}
      </span>
    </nav>
  );
}

function Actions({ isCompleted, onMarkComplete }: { isCompleted: boolean; onMarkComplete: () => void }) {
  return (
    <div className="flex items-center" style={{ gap: "var(--space-1)" }}>
      <IconBtn label="Search">      <Search   size={16} /></IconBtn>
      <IconBtn label="Bookmark">    <Bookmark size={16} /></IconBtn>
      <IconBtn label="Share">       <Share2   size={16} /></IconBtn>
      <IconBtn label="Toggle theme"><Sun      size={16} /></IconBtn>

      <button
        type="button"
        onClick={onMarkComplete}
        className="inline-flex items-center"
        style={{
          gap: "var(--space-2)",
          marginLeft: "var(--space-2)",
          height: "32px",
          padding: "0 var(--space-3)",
          background: isCompleted ? "var(--success)" : "var(--text-primary)",
          color:      "var(--surface-raised)",
          borderRadius: "var(--radius-md)",
          font: "var(--font-body-sm)",
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
        }}
      >
        <Check size={14} />
        {isCompleted ? "Completed" : "Mark complete"}
      </button>
    </div>
  );
}

function IconBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      // TODO: wire to real actions (search/bookmark/share/theme)
      style={{
        width: "32px",
        height: "32px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        color: "var(--text-secondary)",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "background var(--transition-fast), color var(--transition-fast)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent";           e.currentTarget.style.color = "var(--text-secondary)"; }}
    >
      {children}
    </button>
  );
}
