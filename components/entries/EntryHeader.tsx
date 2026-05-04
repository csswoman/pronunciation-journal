"use client";

import Button from "@/components/ui/Button";
import { Entry } from "@/lib/types";
import CompactRecorder from "@/components/ui/CompactRecorder";
import AudioButton from "@/components/ui/AudioButton";

export interface EntryHeaderProps {
  currentEntry: Entry;
  isEditing: boolean;
  onRecordingComplete: (audioUrl: string) => void;
  onEditStart: () => void;
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export default function EntryHeader({
  currentEntry,
  isEditing,
  onRecordingComplete,
  onEditStart,
  onSave,
  onCancel,
  onClose,
}: EntryHeaderProps) {
  return (
    <div className="sticky top-0 bg-surface-raised border-b border-border-subtle p-6 flex justify-between items-start">
      <div className="flex items-center gap-3 flex-1">
        <h2 className="text-3xl font-bold text-fg capitalize">
          {currentEntry.word}
        </h2>
        <div className="flex items-center gap-2">
          {currentEntry.audioUrl && (
            <AudioButton audioUrl={currentEntry.audioUrl} variant="dictionary" />
          )}
          <CompactRecorder
            onRecordingComplete={onRecordingComplete}
            existingAudioUrl={currentEntry.userAudioUrl}
          />
          {currentEntry.userAudioUrl && (
            <AudioButton audioUrl={currentEntry.userAudioUrl} variant="user" />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {!isEditing ? (
          <Button
            onClick={onEditStart}
            className="p-2 hover:bg-surface-sunken rounded-lg transition-colors"
            aria-label="Edit"
            title="Edit"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
        ) : (
          <>
            <Button
              onClick={onSave}
              className="px-4 py-2 rounded-lg text-sm font-medium accent-button"
            >
              Save
            </Button>
            <Button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-on-primary rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </Button>
          </>
        )}
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
    </div>
  );
}
