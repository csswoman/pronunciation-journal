import Button from "@/components/ui/Button";
interface SuggestionChip {
  label: string;
  prompt: string;
}

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
  onSelect: (prompt: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <Button
          key={s.label}
          onClick={() => onSelect(s.prompt)}
          className="text-xs px-3 py-1.5 rounded-full border transition-colors"
          style={{
            borderColor: "var(--line-divider)",
            color: "var(--text-secondary)",
            backgroundColor: "var(--card-bg)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--line-divider)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}

