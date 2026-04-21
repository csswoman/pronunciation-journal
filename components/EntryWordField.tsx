"use client";

import Button from "@/components/ui/Button";
import SuggestionsDropdown from "@/components/SuggestionsDropdown";
import { WordSuggestion } from "@/lib/dictionarySearch";
import { RefObject } from "react";

interface EntryWordFieldProps {
  word: string;
  setWord: (value: string) => void;
  isLoading: boolean;
  suggestions: WordSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (value: boolean) => void;
  handleSuggestionClick: (suggestion: WordSuggestion) => void;
  handleFetchPronunciation: (wordToFetch?: string) => void;
  wordInputRef: RefObject<HTMLInputElement | null>;
}

export default function EntryWordField({
  word,
  setWord,
  isLoading,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  handleSuggestionClick,
  handleFetchPronunciation,
  wordInputRef,
}: EntryWordFieldProps) {
  return (
    <div>
      <label
        htmlFor="word"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Word *
      </label>
      <div className="relative">
        <input
          ref={wordInputRef}
          type="text"
          id="word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions.length > 0) {
                handleSuggestionClick(suggestions[0]);
              } else if (word.trim() && !isLoading) {
                handleFetchPronunciation();
              }
            } else if (e.key === "Escape") {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent"
          placeholder="Enter word"
          required
        />
        <Button
          type="button"
          onClick={() => handleFetchPronunciation()}
          disabled={isLoading || !word.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed accent-button"
          title="Fetch pronunciation"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </Button>

        <SuggestionsDropdown
          showSuggestions={showSuggestions}
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>
    </div>
  );
}
