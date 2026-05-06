"use client";
import Button from "@/components/ui/Button";

import { Entry } from "@/lib/types";
import { playAudio } from "@/lib/audio-utils";

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
  const handlePlayAudio = (e: React.MouseEvent, audioUrl: string) => {
    e.stopPropagation();
    playAudio(audioUrl, { showAlerts: false });
  };

  return (
    <div 
      onClick={onClick}
      className={`border rounded-lg p-6 bg-surface-raised shadow-sm hover:shadow-md transition-all cursor-pointer relative ${
        isSelectionMode && isSelected
          ? "border-accent ring-2 ring-accent ring-opacity-50"
          : "border-border-default"
      }`}
    >
      {isSelectionMode && (
        <div className="absolute top-4 left-4">
          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? "bg-accent border-accent"
              : "bg-surface-sunken border-border-default"
          }`}>
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-on-primary"
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
          <h3 className="text-xl font-bold text-fg capitalize">{entry.word}</h3>
          {entry.audioUrl && !isSelectionMode && (
            <Button
              onClick={(e) => handlePlayAudio(e, entry.audioUrl!)}
              className="p-2 bg-info-soft hover:bg-info-soft rounded-full transition-colors"
              title="Play pronunciation"
              aria-label="Play pronunciation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-info"
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
        <span className="badge">
          <span className={entry.difficulty === "easy" ? "dot-success" : "dot-warning"} />
          {entry.difficulty}
        </span>
      </div>
      {entry.ipa && (
        <p className="text-fg-muted mb-2">{entry.ipa}</p>
      )}
      {entry.notes && (
        <p className="text-fg-muted mb-2">Notes: {entry.notes}</p>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-info-soft text-info rounded text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-fg-subtle mt-4">
        Created: {new Date(entry.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}


