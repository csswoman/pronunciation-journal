"use client";

import { Search } from "lucide-react";

export type SoundLabChip = "all" | "basics" | "vowels" | "consonants" | "diphthongs" | "weak";

interface Props {
  activeChip: SoundLabChip;
  search: string;
  lessonCount: number;
  onChipChange: (chip: SoundLabChip) => void;
  onSearchChange: (query: string) => void;
}

const CHIPS: { id: SoundLabChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "basics", label: "Basics" },
  { id: "vowels", label: "Vowels" },
  { id: "consonants", label: "Consonants" },
  { id: "diphthongs", label: "Diphthongs" },
  { id: "weak", label: "Weak for you" },
];

export function SoundLabFilterRow({ activeChip, search, lessonCount, onChipChange, onSearchChange }: Props) {
  return (
    <div className="mb-space-8 flex flex-wrap items-end justify-between gap-space-6">
      {/* Left */}
      <div>
        <h2 className="font-heading text-h2 text-fg leading-tight">Available lessons</h2>
        <p className="mt-1 text-caption text-fg-subtle">
          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} available
        </p>
      </div>

      {/* Right: search + chips */}
      <div className="flex flex-wrap items-center gap-space-4">
        {/* Bottom-border-only search */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-1 h-4 w-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search sounds…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-40 bg-transparent pb-1 pl-6 pr-2 text-body-sm text-fg outline-none placeholder:text-fg-subtle
              border-0 border-b border-border-subtle focus:border-border-focus transition-colors"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-space-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={[
                "flex items-center gap-1.5 rounded-full px-space-4 py-space-2 text-body-sm transition-all duration-150",
                activeChip === chip.id
                  ? "bg-primary text-on-primary"
                  : "border border-border-default bg-transparent text-fg-muted hover:border-border-strong",
              ].join(" ")}
            >
              {chip.id === "weak" && (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error animate-weak-pulse" />
              )}
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
