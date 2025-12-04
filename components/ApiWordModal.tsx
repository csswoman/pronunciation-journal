"use client";

import { useState, useEffect } from "react";
import { Entry, Meaning } from "@/lib/types";
import { fetchPronunciation } from "@/lib/dictionary";
import { saveEntry } from "@/lib/storage";

interface ApiWordModalProps {
  word: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ApiWordModal({ word, onClose, onSave }: ApiWordModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    ipa?: string;
    audioUrl?: string;
    meanings?: Meaning[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchPronunciation(word);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [word]);

  const handleAddWord = () => {
    if (!data) return;

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      word: word,
      ipa: data.ipa,
      audioUrl: data.audioUrl,
      meanings: data.meanings,
      difficulty: "medium",
      createdAt: new Date().toISOString(),
    };

    saveEntry(newEntry);
    onSave();
    onClose();
  };

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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {word}
            </h2>
            {data?.audioUrl && (
              <button
                onClick={() => playAudio(data.audioUrl!)}
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
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading word data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : data ? (
            <>
              {data.ipa && (
                <div>
                  <p className="text-2xl text-gray-900 dark:text-gray-100 font-mono">
                    {data.ipa}
                  </p>
                </div>
              )}

              {data.meanings && data.meanings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Meanings
                  </h3>
                  <div className="space-y-4">
                    {data.meanings.map((meaning, meaningIndex) => (
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
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add word button */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleAddWord}
                  className="w-full px-6 py-3 text-white rounded-lg transition-colors font-medium"
                  style={{ backgroundColor: "#5468FF" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4a5ae8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5468FF")}
                >
                  Agregar palabra a mi vocabulario
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

