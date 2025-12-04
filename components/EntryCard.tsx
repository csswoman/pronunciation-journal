"use client";

import { Entry } from "@/lib/types";

interface EntryCardProps {
  entry: Entry;
  onClick?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
}

export default function EntryCard({ 
  entry, 
  onClick, 
  isSelectionMode = false,
  isSelected = false 
}: EntryCardProps) {
  const playAudio = (e: React.MouseEvent, audioUrl: string) => {
    e.stopPropagation();
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  return (
    <div 
      onClick={onClick}
      className={`border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer relative ${
        isSelectionMode && isSelected
          ? "border-[#5468FF] ring-2 ring-[#5468FF] ring-opacity-50"
          : "border-gray-300 dark:border-gray-700"
      }`}
    >
      {isSelectionMode && (
        <div className="absolute top-4 left-4">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? "bg-[#5468FF] border-[#5468FF]" 
              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          }`}>
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}
      <div className={`flex items-start justify-between mb-2 ${isSelectionMode ? "ml-8" : ""}`}>
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">{entry.word}</h3>
          {entry.audioUrl && !isSelectionMode && (
            <button
              onClick={(e) => playAudio(e, entry.audioUrl!)}
              className="p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
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
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            entry.difficulty === "easy"
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              : entry.difficulty === "medium"
              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
          }`}
        >
          {entry.difficulty}
        </span>
      </div>
      {entry.ipa && (
        <p className="text-gray-600 dark:text-gray-400 mb-2">{entry.ipa}</p>
      )}
      {entry.notes && (
        <p className="text-gray-700 dark:text-gray-300 mb-2">Notes: {entry.notes}</p>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Created: {new Date(entry.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

