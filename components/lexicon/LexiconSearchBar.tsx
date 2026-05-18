import { Search } from "lucide-react";

interface LexiconSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LexiconSearchBar({
  value,
  onChange,
  placeholder = "Search a word...",
}: LexiconSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border-default bg-surface-raised text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );
}
