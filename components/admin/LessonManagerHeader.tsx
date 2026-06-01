"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface LessonManagerHeaderProps {
  total: number;
  published: number;
  drafts: number;
}

export default function LessonManagerHeader({
  total,
  published,
  drafts,
}: LessonManagerHeaderProps) {
  return (
    <header>
      <div className="max-w-5xl mx-auto px-space-6 pt-space-8 pb-space-5">
        <nav className="flex items-center gap-space-2 text-caption text-fg-subtle mb-space-3">
          <span>Workspace</span>
          <span className="text-border-strong">•</span>
          <span>Library</span>
          <span className="text-border-strong">•</span>
          <span className="text-fg-muted font-medium">Lessons</span>
        </nav>

        <div className="flex items-start justify-between gap-space-6 flex-wrap">
          <div className="max-w-xl">
            <h1 className="font-display text-h1 text-fg leading-tight">
              Lesson <span className="italic text-primary">Manager</span>
            </h1>
            <p className="text-body-sm mt-space-2 text-fg-muted">
              Create, edit and publish theory lessons for your library.
            </p>
          </div>

          <div className="flex items-center gap-space-2">
            <Link
              href="/admin/lessons/new"
              className="flex items-center gap-1.5 px-space-3 py-space-2 rounded-xl text-body-xs font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New lesson
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-space-3 mt-space-5 pt-space-4 border-t border-border-subtle flex-wrap text-caption">
          <Stat label="Total" value={total} />
          <Divider />
          <Stat label="Published" value={published} accent />
          <Divider />
          <Stat label="Drafts" value={drafts} />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-body-sm font-bold tabular-nums ${accent ? "text-primary" : "text-fg"}`}>
        {value}
      </span>
      <span className="uppercase tracking-widest text-fg-subtle">{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="w-px h-3 bg-border-default" />;
}
