"use client";

import { Entry } from "@/lib/types";

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold">{entry.word}</h3>
          {entry.audioUrl && (
            <button
              onClick={() => playAudio(entry.audioUrl!)}
              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              title="Play pronunciation"
              aria-label="Play pronunciation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
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
              ? "bg-green-100 text-green-800"
              : entry.difficulty === "medium"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {entry.difficulty}
        </span>
      </div>
      {entry.ipa && (
        <p className="text-gray-600 mb-2">IPA: {entry.ipa}</p>
      )}
      {entry.notes && (
        <p className="text-gray-700 mb-2">Notes: {entry.notes}</p>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4">
        Created: {new Date(entry.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

