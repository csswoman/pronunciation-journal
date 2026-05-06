"use client";
import Button from "@/components/ui/Button";

import { useState, useEffect } from "react";
import { Entry, Meaning } from "@/lib/types";
import { fetchPronunciation } from "@/lib/dictionary";
import { saveEntry } from "@/lib/storage";
import { playAudio } from "@/lib/audio-utils";

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
    sourceUrl?: string;
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

  const handleAddWord = async () => {
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

    try {
      await saveEntry(newEntry);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Error saving entry. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 left-64 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center m-0"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-raised border-b border-border-subtle p-6 flex justify-between items-start">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-3xl font-bold text-fg">
              {word}
            </h2>
            {data?.audioUrl && (
              <Button
                onClick={() => playAudio(data.audioUrl!, { showAlerts: false })}
                className="p-3 bg-info-soft hover:bg-info-soft rounded-full transition-colors"
                title="Play pronunciation"
                aria-label="Play pronunciation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-info"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            )}
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-surface-sunken rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-fg-subtle"
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
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fg"></div>
              <p className="mt-4 text-fg-muted">Loading word data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-error">{error}</p>
            </div>
          ) : data ? (
            <>
              {data.ipa && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-fg-muted mb-2">
                    Pronunciación (IPA)
                  </p>
                  <p className="text-2xl text-fg font-mono">
                    {data.ipa}
                  </p>
                </div>
              )}

              {data.sourceUrl && (
                <div className="mb-4">
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-info hover:text-info transition-colors"
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
                    <span className="text-sm">Ver en diccionario</span>
                  </a>
                </div>
              )}

              {data.meanings && data.meanings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-fg-muted mb-3">
                    Meanings
                  </h3>
                  <div className="space-y-4">
                    {data.meanings.map((meaning, meaningIndex) => (
                      <div key={meaningIndex} className="border-l-4 border-info pl-4">
                        <h4 className="text-sm font-semibold text-info mb-2 italic">
                          {meaning.partOfSpeech}
                        </h4>
                        <ol className="list-decimal list-inside space-y-3">
                          {meaning.definitions.map((def, defIndex) => (
                            <li key={defIndex} className="text-fg">
                              <span className="ml-2">{def.definition}</span>
                              {def.example && (
                                <p className="ml-6 mt-1 text-sm text-fg-muted italic">
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
              <div className="pt-6 border-t border-border-subtle">
                <Button
                  onClick={handleAddWord}
                  className="w-full px-6 py-3 rounded-lg font-medium accent-button"
                >
                  Agregar palabra a mi vocabulario
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}


