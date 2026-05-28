import { Clapperboard, BookOpen, Theater, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SuggestionChip {
  label: string;
  prompt: string;
}

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
  onSelect: (prompt: string) => void;
}

const ICON_MAP: Array<{ keywords: string[]; Icon: LucideIcon }> = [
  { keywords: ["movie", "film", "watch", "watched", "cinema"], Icon: Clapperboard },
  { keywords: ["book", "read", "reading", "novel"], Icon: BookOpen },
  { keywords: ["role", "roleplay", "play", "act"], Icon: Theater },
];

function chipIcon(label: string): LucideIcon {
  const lower = label.toLowerCase();
  const match = ICON_MAP.find(({ keywords }) => keywords.some(k => lower.includes(k)));
  return match?.Icon ?? MessageCircle;
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s) => {
        const Icon = chipIcon(s.label);
        return (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors bg-surface-sunken text-fg-muted hover:bg-[var(--primary-100)] hover:text-[color:var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40"
          >
            <Icon size={12} strokeWidth={1.8} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
