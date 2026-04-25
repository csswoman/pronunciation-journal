"use client";
import Button from "@/components/ui/Button";

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
        className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors text-sm"
        style={{ "--tw-ring-color": "var(--color-accent)" } as React.CSSProperties & { "--tw-ring-color"?: string }}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clipRule="evenodd"
        />
      </svg>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full sm:w-64 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
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
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  )}
                </div>
                {suggestion.ipa && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
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


