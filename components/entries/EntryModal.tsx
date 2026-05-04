"use client";

import { Entry } from "@/lib/types";
import { useEntryModal } from "@/hooks/useEntryModal";
import EntryHeader from "./EntryHeader";
import EntryDifficulty from "./EntryDifficulty";
import EntryNotes from "./EntryNotes";
import EntryTags from "./EntryTags";

interface EntryModalProps {
  entry: Entry;
  onClose: () => void;
  onSave?: () => void;
}

export default function EntryModal({ entry, onClose, onSave }: EntryModalProps) {
  const {
    isEditing,
    editedEntry,
    currentEntry,
    startEditing,
    handleDifficultyChange,
    handleNotesChange,
    handleSave,
    handleCancel,
    handleRecordingComplete,
    handleTagsChange,
  } = useEntryModal({ entry, onSave });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center m-0"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <EntryHeader
          currentEntry={currentEntry}
          isEditing={isEditing}
          onRecordingComplete={handleRecordingComplete}
          onEditStart={startEditing}
          onSave={handleSave}
          onCancel={handleCancel}
          onClose={onClose}
        />

        <div className="p-6 space-y-6">
          <EntryDifficulty
            isEditing={isEditing}
            currentDifficulty={currentEntry.difficulty}
            editedDifficulty={editedEntry.difficulty}
            onDifficultyChange={handleDifficultyChange}
          />

          {currentEntry.ipa && (
            <div>
              <h3 className="text-sm font-semibold text-fg-muted mb-2">
                IPA (International Phonetic Alphabet)
              </h3>
              <p className="text-2xl text-fg font-mono">
                {currentEntry.ipa}
              </p>
            </div>
          )}

          {currentEntry.meanings && currentEntry.meanings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-fg-muted mb-3">
                Meanings
              </h3>
              <div className="space-y-4">
                {currentEntry.meanings.map((meaning, meaningIndex) => (
                  <div key={meaningIndex} className="border-l-4 border-info pl-4">
                    <h4 className="text-sm font-semibold text-info dark:text-info mb-2 italic">
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
                          {def.synonyms && def.synonyms.length > 0 && (
                            <p className="ml-6 mt-1 text-sm text-fg-muted">
                              <span className="font-medium">Synonyms:</span> {def.synonyms.join(", ")}
                            </p>
                          )}
                          {def.antonyms && def.antonyms.length > 0 && (
                            <p className="ml-6 mt-1 text-sm text-fg-muted">
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

          <EntryNotes
            isEditing={isEditing}
            currentNotes={currentEntry.notes}
            editedNotes={editedEntry.notes}
            onNotesChange={handleNotesChange}
          />

          <EntryTags
            isEditing={isEditing}
            currentTags={currentEntry.tags}
            editedTags={editedEntry.tags}
            onTagsChange={handleTagsChange}
          />

          <div className="pt-4 border-t border-border-subtle">
            <div className="flex flex-col gap-2 text-sm text-fg-subtle">
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


