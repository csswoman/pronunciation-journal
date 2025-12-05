"use client";

import { Entry, Difficulty } from "@/lib/types";
import { useState, useCallback } from "react";
import { saveEntry } from "@/lib/storage";
import CompactRecorder from "./CompactRecorder";

interface EntryModalProps {
  entry: Entry;
  onClose: () => void;
  onSave?: () => void;
}

export default function EntryModal({ entry, onClose, onSave }: EntryModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState<Entry>(entry);
  const [currentEntry, setCurrentEntry] = useState<Entry>(entry);

  const playAudio = (audioUrl: string) => {
    // Check if it's a blob URL (invalid after refresh)
    if (audioUrl.startsWith('blob:')) {
      console.error("Cannot play blob URL - audio not available");
      alert("This audio recording is no longer available. Please record again.");
      return;
    }
    
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
      alert("Error playing audio. The recording may be corrupted.");
    });
  };

  const handleSave = () => {
    const updatedEntry = {
      ...editedEntry,
      updatedAt: new Date().toISOString(),
    };
    saveEntry(updatedEntry);
    setCurrentEntry(updatedEntry);
    setIsEditing(false);
    if (onSave) {
      onSave();
    }
  };

  const handleCancel = () => {
    setEditedEntry(currentEntry);
    setIsEditing(false);
  };

  const handleRecordingComplete = useCallback((audioUrl: string) => {
    // Immediately save the recording to the entry
    const updatedEntry = {
      ...currentEntry,
      userAudioUrl: audioUrl,
      updatedAt: new Date().toISOString(),
    };
    saveEntry(updatedEntry);
    setCurrentEntry(updatedEntry);
    setEditedEntry(updatedEntry);
    if (onSave) {
      onSave();
    }
  }, [currentEntry, onSave]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center m-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 capitalize">
              {currentEntry.word}
            </h2>
            <div className="flex items-center gap-2">
              {currentEntry.audioUrl && (
                <button
                  onClick={() => playAudio(currentEntry.audioUrl!)}
                  className="p-3 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
                  title="Dictionary Pronunciation"
                  aria-label="Play dictionary pronunciation"
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
              
              {/* Compact Recorder - Always visible */}
              <CompactRecorder
                onRecordingComplete={handleRecordingComplete}
                existingAudioUrl={currentEntry.userAudioUrl}
              />

              {currentEntry.userAudioUrl && (
                <button
                  onClick={() => playAudio(currentEntry.userAudioUrl!)}
                  className="p-3 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded-full transition-colors"
                  title="Your Pronunciation"
                  aria-label="Play your pronunciation"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Edit"
                title="Edit"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                  style={{ backgroundColor: "#5468FF" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4a5ae8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5468FF")}
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}
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
        </div>

        <div className="p-6 space-y-6">
          {/* Difficulty - Always show current entry, edit mode allows changes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Difficulty:
            </label>
            {!isEditing ? (
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  currentEntry.difficulty === "easy"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : currentEntry.difficulty === "medium"
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}
              >
                {currentEntry.difficulty}
              </span>
            ) : (
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setEditedEntry({ ...editedEntry, difficulty: diff })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editedEntry.difficulty === diff
                        ? "text-white"
                        : diff === "easy"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:opacity-80"
                        : diff === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:opacity-80"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:opacity-80"
                    }`}
                    style={editedEntry.difficulty === diff ? { backgroundColor: "#5468FF" } : {}}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentEntry.ipa && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                IPA (International Phonetic Alphabet)
              </h3>
              <p className="text-2xl text-gray-900 dark:text-gray-100 font-mono">
                {currentEntry.ipa}
              </p>
            </div>
          )}

          {currentEntry.meanings && currentEntry.meanings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Meanings
              </h3>
              <div className="space-y-4">
                {currentEntry.meanings.map((meaning, meaningIndex) => (
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

          {/* Notes */}
          {((!isEditing && currentEntry.notes) || isEditing) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              {!isEditing ? (
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {currentEntry.notes}
                </p>
              ) : (
                <textarea
                  value={editedEntry.notes || ""}
                  onChange={(e) => setEditedEntry({ ...editedEntry, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5468FF] focus:border-transparent"
                  placeholder="Add notes about this word..."
                />
              )}
            </div>
          )}

          {/* Tags */}
          {((!isEditing && currentEntry.tags && currentEntry.tags.length > 0) || isEditing) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {currentEntry.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={editedEntry.tags?.join(", ") || ""}
                  onChange={(e) => 
                    setEditedEntry({ 
                      ...editedEntry, 
                      tags: e.target.value.split(",").map(t => t.trim()).filter(t => t.length > 0)
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5468FF] focus:border-transparent"
                  placeholder="Add tags separated by commas (e.g., business, travel)"
                />
              )}
            </div>
          )}


          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
              <p>
                Created: {new Date(currentEntry.createdAt).toLocaleDateString()} at{" "}
                {new Date(currentEntry.createdAt).toLocaleTimeString()}
              </p>
              {currentEntry.updatedAt && (
                <p>
                  Updated: {new Date(currentEntry.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(currentEntry.updatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

