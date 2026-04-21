"use client";

import Button from "@/components/ui/Button";
import { WordSuggestion } from "@/lib/dictionarySearch";

interface SuggestionsDropdownProps {
  showSuggestions: boolean;
  suggestions: WordSuggestion[];
  onSuggestionClick: (suggestion: WordSuggestion) => void;
}

export default function SuggestionsDropdown({
  showSuggestions,
  suggestions,
  onSuggestionClick,
}: SuggestionsDropdownProps) {
  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          type="button"
          onClick={() => onSuggestionClick(suggestion)}
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
  );
}
