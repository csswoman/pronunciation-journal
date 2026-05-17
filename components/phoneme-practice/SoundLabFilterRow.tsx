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

function chipClass(id: SoundLabChip, activeChip: SoundLabChip): string {
  if (activeChip === id) return "bg-primary text-on-primary border border-primary";
  if (id === "weak") return "border border-error-deco bg-error-soft text-error-value hover:border-error-border";
  return "border border-border-default bg-transparent text-fg-muted hover:border-border-strong";
}

export function SoundLabFilterRow({ activeChip, search, lessonCount, onChipChange, onSearchChange }: Props) {
  return (
    <div className="mb-space-6 flex flex-wrap items-start gap-space-4">
      {/* Left: heading + count */}
      <div>
        <h2 className="text-h3 text-fg whitespace-nowrap leading-tight">Available lessons</h2>
        <span className="text-caption text-fg-subtle">
          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
        </span>
      </div>

      {/* Right: search (above) + filter chips (below) */}
      <div className="ml-auto flex flex-col items-end gap-space-2">
        {/* Search with filled background */}
        <div className="relative w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search sounds…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-border-subtle bg-surface-sunken py-[6px] pl-9 pr-4 text-body-sm text-fg outline-none placeholder:text-fg-subtle transition-colors focus:border-border-focus"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap justify-end gap-space-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={[
                "flex items-center gap-1.5 rounded-full px-space-3 py-space-1 text-body-sm transition-all duration-150",
                chipClass(chip.id, activeChip),
              ].join(" ")}
            >
              {chip.id === "weak" && activeChip !== "weak" && (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error-value" />
              )}
              {chip.id === "weak" && activeChip === "weak" && (
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-on-primary" />
              )}
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
