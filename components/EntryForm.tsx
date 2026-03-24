"use client";

import { useState, useEffect, useRef } from "react";
import { Entry, Difficulty } from "@/lib/types";
import { fetchPronunciation } from "@/lib/dictionary";
import { saveEntry } from "@/lib/storage";
import { getWordSuggestions, WordSuggestion } from "@/lib/dictionarySearch";
import { playAudio } from "@/lib/audio-utils";

interface EntryFormProps {
  onSave?: (entry: Entry) => void;
  onCancel?: () => void;
}

export default function EntryForm({ onSave, onCancel }: EntryFormProps) {
  const [word, setWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("");
  const [meanings, setMeanings] = useState<any>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);
  // Track which fields were set by API to avoid clearing user input
  const [apiSetFields, setApiSetFields] = useState<{
    ipa: boolean;
    audioUrl: boolean;
    meanings: boolean;
  }>({ ipa: false, audioUrl: false, meanings: false });

  const handleFetchPronunciation = async (wordToFetch?: string) => {
    const wordToUse = wordToFetch || word;
    if (!wordToUse.trim()) {
      setError("Please enter a word first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Store current values before API call to detect user input
    const previousIpa = ipa;
    const previousAudioUrl = audioUrl;
    const previousMeanings = meanings;

    try {
      const data = await fetchPronunciation(wordToUse.trim());
      
      // Track which fields were set by API
      const newApiSetFields = { ...apiSetFields };
      
      if (data.ipa) {
        setIpa(data.ipa);
        newApiSetFields.ipa = true;
      }
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        newApiSetFields.audioUrl = true;
      }
      if (data.meanings) {
        setMeanings(data.meanings);
        newApiSetFields.meanings = true;
      }
      if (data.sourceUrl) {
        setSourceUrl(data.sourceUrl);
      }
      
      setApiSetFields(newApiSetFields);

      if (data.ipa || data.audioUrl || data.meanings) {
        setSuccess("Pronunciation data fetched successfully!");
      } else {
        setError("No pronunciation data found for this word");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch pronunciation";
      setError(errorMessage);
      
      // Only clear fields that were set by the API, preserve user input
      if (apiSetFields.ipa) {
        setIpa("");
      }
      if (apiSetFields.audioUrl) {
        setAudioUrl("");
      }
      if (apiSetFields.meanings) {
        setMeanings(null);
      }
      setSourceUrl(null);
      
      // Reset API tracking since we cleared API-set fields
      setApiSetFields({ ipa: false, audioUrl: false, meanings: false });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch word suggestions while typing
  useEffect(() => {
    async function fetchSuggestions() {
      if (word.length >= 2) {
        const words = await getWordSuggestions(word);
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
  }, [word]);

  const handleSuggestionClick = (suggestion: WordSuggestion) => {
    setWord(suggestion.word);
    setShowSuggestions(false);
    // Automatically fetch pronunciation when a suggestion is selected
    if (suggestion.word.trim()) {
      handleFetchPronunciation(suggestion.word);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!word.trim()) {
      setError("Word is required");
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      word: word.trim(),
      ipa: ipa.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      difficulty,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      meanings: meanings || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save to localStorage
      await saveEntry(newEntry);

      // Callback if provided
      if (onSave) {
        onSave(newEntry);
      }

      // Reset form
      setWord("");
      setIpa("");
      setAudioUrl("");
      setNotes("");
      setDifficulty("medium");
      setTags("");
      setMeanings(null);
      setSourceUrl(null);
      setApiSetFields({ ipa: false, audioUrl: false, meanings: false });
      setShowDetails(false);
      setSuccess("Entry saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
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
                  // Si hay sugerencias, seleccionar la primera
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
                // Delay hiding suggestions to allow clicking on them
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent"
              placeholder="Enter word"
              required
            />
            <button
              type="button"
              onClick={() => handleFetchPronunciation()}
              disabled={isLoading || !word.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed accent-button"
              title="Fetch pronunciation"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="ipa"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            IPA
          </label>
          <div className="flex items-center gap-2">
            {ipa && apiSetFields.ipa ? (
              <p className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 font-mono text-lg">
                {ipa}
              </p>
            ) : (
              <input
                type="text"
                id="ipa"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent font-mono text-lg"
                placeholder="/prəˌnʌnsiˈeɪʃən/"
              />
            )}
            {audioUrl && (
              <button
                type="button"
                onClick={() => playAudio(audioUrl, { showAlerts: false })}
                className="p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors flex-shrink-0"
                title="Play pronunciation"
                aria-label="Play pronunciation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}


      {sourceUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Diccionario
          </label>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            <span>Ver en diccionario</span>
          </a>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          {showDetails ? "Hide details" : "Add details"}
        </button>
        <div className="relative group">
          <button
            type="button"
            className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none transition-colors flex items-center justify-center"
            aria-label="Help"
          >
            ?
          </button>
          <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            Aquí se puede añadir notas de tus palabras
            <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div>
            <label
              htmlFor="audioUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Audio URL
            </label>
            <input
              type="text"
              id="audioUrl"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent"
              placeholder="https://..."
            />
          </div>

          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent"
              placeholder="Add your notes here..."
            />
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent"
              placeholder="vowels, stress, greetings"
            />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 accent-button"
        >
          Save Entry
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

