import { Clapperboard, BookOpen, Theater, MessageCircle, Sparkles, Minus, Lightbulb } from "@/components/icons";
import type { LucideIcon } from "@/components/icons";

interface SuggestionChip {
  label: string;
  prompt: string;
}

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
  onSelect: (prompt: string) => void;
}

const ICON_MAP: Array<{ keywords: string[]; Icon: LucideIcon }> = [
  { keywords: ["ejemplo", "example", "dame"], Icon: Sparkles },
  { keywords: ["simple", "más simple", "facil", "fácil"], Icon: Minus },
  { keywords: ["respondo", "respuesta", "como", "cómo"], Icon: Lightbulb },
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
    <div className="flex flex-wrap gap-2 px-1 pt-1">
      {suggestions.map((s) => {
        const Icon = chipIcon(s.label);
        return (
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            title={s.prompt}
            className="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-border-subtle bg-surface-raised px-3.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-primary hover:bg-surface-base hover:text-primary focus-ring active:scale-[0.99]"
          >
            <Icon size={13} strokeWidth={2} className="shrink-0 text-fg-muted" />
            <span className="truncate">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
