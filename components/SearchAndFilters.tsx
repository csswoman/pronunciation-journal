"use client";

import { useState, useEffect, useRef } from "react";
import { getWordSuggestions } from "@/lib/dictionarySearch";

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  const handleSuggestionClick = (word: string) => {
    onWordSelect(word);
    setShowSuggestions(false);
    onSearchChange("");
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Mi vocabulario
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Buscar
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar palabra..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
            style={{ "--tw-ring-color": "#5468FF" } as React.CSSProperties & { "--tw-ring-color"?: string }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(word)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{word}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Click to view
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

