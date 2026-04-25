"use client";

import { Difficulty } from "@/lib/types";

interface EntryDetailsProps {
  showDetails: boolean;
  audioUrl: string;
  setAudioUrl: (value: string) => void;
  difficulty: Difficulty;
  setDifficulty: (value: Difficulty) => void;
  notes: string;
  setNotes: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
}

export default function EntryDetails({
  showDetails,
  audioUrl,
  setAudioUrl,
  difficulty,
  setDifficulty,
  notes,
  setNotes,
  tags,
  setTags,
}: EntryDetailsProps) {
  if (!showDetails) {
    return null;
  }

  return (
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
  );
}
