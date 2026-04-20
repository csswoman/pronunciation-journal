"use client";

import { useCallback, useState } from "react";
import { saveEntry } from "@/lib/storage";
import { Entry } from "@/lib/types";

interface UseEntryModalProps {
  entry: Entry;
  onSave?: () => void;
}

export function useEntryModal({ entry, onSave }: UseEntryModalProps) {
  const [isEditingState, setIsEditingState] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Entry>(entry);
  const [draftEntry, setDraftEntry] = useState<Entry | null>(null);

  const editedEntry = draftEntry ?? currentEntry;

  const startEditing = useCallback(() => {
    setIsEditingState(true);
    setDraftEntry(currentEntry);
  }, [currentEntry]);

  const handleDifficultyChange = useCallback((difficulty: Entry["difficulty"]) => {
    setDraftEntry((d) => ({ ...(d ?? currentEntry), difficulty }));
  }, [currentEntry]);

  const handleNotesChange = useCallback((notes: string) => {
    setDraftEntry((d) => ({ ...(d ?? currentEntry), notes }));
  }, [currentEntry]);

  const handleSave = async () => {
    const updatedEntry = {
      ...(draftEntry ?? currentEntry),
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveEntry(updatedEntry);
      setCurrentEntry(updatedEntry);
      setIsEditingState(false);
      setDraftEntry(null);
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Error saving entry. Please try again.");
    }
  };

  const handleCancel = () => {
    setDraftEntry(null);
    setIsEditingState(false);
  };

  const handleRecordingComplete = useCallback(
    async (audioUrl: string) => {
      // Immediately save the recording to the entry
      const updatedEntry = {
        ...currentEntry,
        userAudioUrl: audioUrl,
        updatedAt: new Date().toISOString(),
      };
      try {
        await saveEntry(updatedEntry);
        setCurrentEntry(updatedEntry);
        setDraftEntry(updatedEntry);
        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error("Error saving recording:", error);
        alert("Error saving recording. Please try again.");
      }
    },
    [currentEntry, onSave]
  );

  const handleTagsChange = useCallback(
    (value: string) => {
      setDraftEntry((d) => ({
        ...(d ?? currentEntry),
        tags: value
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      }));
    },
    [currentEntry]
  );

  return {
    isEditing: isEditingState,
    editedEntry,
    currentEntry,
    startEditing,
    handleDifficultyChange,
    handleNotesChange,
    handleSave,
    handleCancel,
    handleRecordingComplete,
    handleTagsChange,
  };
}
