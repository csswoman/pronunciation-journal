"use client";

import { useState } from "react";
import { Entry, Difficulty } from "@/lib/types";
import { fetchPronunciation } from "@/lib/dictionary";
import { saveEntry } from "@/lib/storage";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchPronunciation = async () => {
    if (!word.trim()) {
      setError("Please enter a word first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await fetchPronunciation(word.trim());
      
      if (data.ipa) {
        setIpa(data.ipa);
      }
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      }

      if (data.ipa || data.audioUrl) {
        setSuccess("Pronunciation data fetched successfully!");
      } else {
        setError("No pronunciation data found for this word");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch pronunciation";
      setError(errorMessage);
      setIpa("");
      setAudioUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    saveEntry(newEntry);

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
    setSuccess("Entry saved successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div>
        <label
          htmlFor="word"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Word *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter word"
            required
          />
          <button
            type="button"
            onClick={handleFetchPronunciation}
            disabled={isLoading || !word.trim()}
            className="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: "#5468FF" }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = "#4a5ae8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5468FF")}
          >
            {isLoading ? "Loading..." : "Fetch pronunciation"}
          </button>
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

      <div>
        <label
          htmlFor="ipa"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          IPA
        </label>
        <input
          type="text"
          id="ipa"
          value={ipa}
          onChange={(e) => setIpa(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/prəˌnʌnsiˈeɪʃən/"
        />
      </div>

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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          placeholder="vowels, stress, greetings"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
          style={{ backgroundColor: "#5468FF" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4a5ae8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5468FF")}
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

