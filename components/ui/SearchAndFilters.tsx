"use client";
import Button from "@/components/ui/Button";
import { ExternalLink, Search } from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { getWordSuggestions, WordSuggestion } from "@/lib/dictionarySearch";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onWordSelect: (word: string) => void;
}

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  onWordSelect,
}: SearchAndFiltersProps) {
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      if (searchTerm.length >= 2) {
        const words = await getWordSuggestions(searchTerm);
        setSuggestions(words);
        setShowSuggestions(words.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
    
    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSuggestionClick = (suggestion: WordSuggestion) => {
    onWordSelect(suggestion.word);
    setShowSuggestions(false);
    onSearchChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim().length > 0) {
      // Si hay sugerencias, seleccionar la primera
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      } else {
        // Si no hay sugerencias pero hay texto, intentar buscar directamente
        onWordSelect(searchTerm.trim());
        onSearchChange("");
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar palabra..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className="w-full sm:w-64 rounded-lg border border-border-default bg-surface-sunken px-4 py-2 pl-10 text-sm text-fg placeholder:text-fg-placeholder transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-0"
      />
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full sm:w-64 mt-1 bg-surface-raised border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-surface-sunken transition-colors text-fg border-b border-border-subtle last:border-b-0"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{suggestion.word}</span>
                  {suggestion.sourceUrl && (
                    <a
                      href={suggestion.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-info hover:text-info"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {suggestion.ipa && (
                  <span className="text-xs text-fg-muted font-mono">
                    {suggestion.ipa}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}




