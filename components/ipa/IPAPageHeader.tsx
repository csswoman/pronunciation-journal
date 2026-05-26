"use client";

import Link from "next/link";
import { Play, FileText, Timer } from "lucide-react";

export default function IPAPageHeader({
  onStartPractice,
  onOpenCheatsheet,
  onStartDrill,
}: {
  onStartPractice?: () => void;
  onOpenCheatsheet?: () => void;
  onStartDrill?: () => void;
}) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Link
            href="/learning"
            className="hover:underline transition-opacity hover:opacity-80"
          >
            Learning
          </Link>
          <span aria-hidden>/</span>
          <span style={{ color: "var(--text-secondary)" }}>IPA Chart</span>
        </nav>

        <h1 className="text-3xl font-bold leading-tight text-fg mb-2">
          English Sound Chart
        </h1>
        <p
          className="text-sm leading-relaxed max-w-2xl"
          style={{ color: "var(--text-secondary)" }}
        >
          44 phonemes of English — explore each one&apos;s articulation, examples,
          and how it differs from Spanish.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCheatsheet}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--surface-sunken)]"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          <FileText size={14} />
          Cheatsheet
        </button>

        <button
          type="button"
          onClick={onStartDrill}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-[var(--surface-sunken)]"
          style={{
            backgroundColor: "var(--surface-raised)",
            borderColor: "var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          <Timer size={14} />
          5-min drill
        </button>

        <button
          type="button"
          onClick={onStartPractice}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          <Play size={14} fill="currentColor" />
          Start practice
        </button>
      </div>
    </header>
  );
}
