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

  const isEditing = isEditingState;
  const editedEntry = draftEntry ?? currentEntry;

  const setIsEditing = useCallback(
    (value: boolean) => {
      setIsEditingState(value);
      if (value) {
        setDraftEntry(currentEntry);
      } else {
        setDraftEntry(null);
      }
    },
    [currentEntry]
  );

  const setEditedEntry = useCallback(
    (value: Entry) => {
      setDraftEntry(value);
    },
    []
  );

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
      setDraftEntry({
        ...(draftEntry ?? currentEntry),
        tags: value
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      });
    },
    [draftEntry, currentEntry]
  );

  return {
    isEditing,
    setIsEditing,
    editedEntry,
    setEditedEntry,
    currentEntry,
    handleSave,
    handleCancel,
    handleRecordingComplete,
    handleTagsChange,
  };
}
