"use client";

import { Search } from "lucide-react";

export type SoundLabChip = "all" | "easy" | "medium" | "hard";

interface Props {
  activeChip: SoundLabChip;
  search: string;
  onChipChange: (chip: SoundLabChip) => void;
  onSearchChange: (query: string) => void;
}

const CHIPS: { id: SoundLabChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

export function SoundLabFilterRow({
  activeChip,
  search,
  onChipChange,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center gap-2">
        {CHIPS.map((chip) => {
          const isOn = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={["sound-lab__chip", isOn && "sound-lab__chip--on"]
                .filter(Boolean)
                .join(" ")}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <label className="sound-lab__search flex w-full items-center gap-2 sm:w-auto sm:min-w-[260px]">
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <input
          type="search"
          placeholder="Search sounds…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search sounds"
        />
      </label>
    </div>
  );
}
