"use client";

import { Entry } from "@/lib/types";

interface EntryModalProps {
  entry: Entry;
  onClose: () => void;
}

export default function EntryModal({ entry, onClose }: EntryModalProps) {
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  return (
    <div
      className="fixed inset-y-0 right-0 left-64 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center m-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 capitalize">
              {entry.word}
            </h2>
            {entry.audioUrl && (
              <button
                onClick={() => playAudio(entry.audioUrl!)}
                className="p-3 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
                title="Play pronunciation"
                aria-label="Play pronunciation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600 dark:text-blue-400"
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Difficulty:
            </span>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
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
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                IPA (International Phonetic Alphabet)
              </h3>
              <p className="text-2xl text-gray-900 dark:text-gray-100 font-mono">
                {entry.ipa}
              </p>
            </div>
          )}

          {entry.meanings && entry.meanings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Meanings
              </h3>
              <div className="space-y-4">
                {entry.meanings.map((meaning, meaningIndex) => (
                  <div key={meaningIndex} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 italic">
                      {meaning.partOfSpeech}
                    </h4>
                    <ol className="list-decimal list-inside space-y-3">
                      {meaning.definitions.map((def, defIndex) => (
                        <li key={defIndex} className="text-gray-900 dark:text-gray-100">
                          <span className="ml-2">{def.definition}</span>
                          {def.example && (
                            <p className="ml-6 mt-1 text-sm text-gray-600 dark:text-gray-400 italic">
                              Example: "{def.example}"
                            </p>
                          )}
                          {def.synonyms && def.synonyms.length > 0 && (
                            <p className="ml-6 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Synonyms:</span> {def.synonyms.join(", ")}
                            </p>
                          )}
                          {def.antonyms && def.antonyms.length > 0 && (
                            <p className="ml-6 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Antonyms:</span> {def.antonyms.join(", ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </h3>
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {entry.notes}
              </p>
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
              <p>
                Created: {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                {new Date(entry.createdAt).toLocaleTimeString()}
              </p>
              {entry.updatedAt && (
                <p>
                  Updated: {new Date(entry.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(entry.updatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

