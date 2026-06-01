"use client";

import { Search } from "lucide-react";

export type SoundLabChip = "all" | "basics" | "vowels" | "consonants" | "diphthongs" | "weak";

interface Props {
  activeChip: SoundLabChip;
  search: string;
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

export function SoundLabFilterRow({
  activeChip,
  search,
  onChipChange,
  onSearchChange,
}: Props) {
  return (
    <div className="sound-lab__toolbar">
      <div className="sound-lab__chips">
        {CHIPS.map((chip) => {
          const isOn = activeChip === chip.id;
          const isWeak = chip.id === "weak";
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipChange(chip.id)}
              className={[
                "sound-lab__chip",
                isOn && "sound-lab__chip--on",
                isWeak && "sound-lab__chip--weak",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isWeak && !isOn && <span aria-hidden>● </span>}
              {chip.label}
            </button>
          );
        })}
      </div>

      <label className="sound-lab__search">
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
