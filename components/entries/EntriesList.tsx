"use client";

import { useState } from "react";
import { Entry } from "@/lib/types";
import EntryCard from "./EntryCard";
import EntryModal from "./EntryModal";

interface EntriesListProps {
  entries: Entry[];
  isSelectionMode?: boolean;
  selectedEntries?: string[];
  onSelectEntry?: (id: string) => void;
  onEntryUpdated?: () => void;
}

export default function EntriesList({ 
  entries, 
  isSelectionMode = false,
  selectedEntries = [],
  onSelectEntry,
  onEntryUpdated
}: EntriesListProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const handleCardClick = (entry: Entry) => {
    if (isSelectionMode && onSelectEntry) {
      onSelectEntry(entry.id);
    } else {
      setSelectedEntry(entry);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No entries yet.</p>
        <p className="text-sm mt-2">
          Click "Agregar palabra" to add your first word!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-4">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onClick={() => handleCardClick(entry)}
            isSelectionMode={isSelectionMode}
            isSelected={selectedEntries.includes(entry.id)}
          />
        ))}
      </div>

      {selectedEntry && !isSelectionMode && (
        <EntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onSave={() => {
            if (onEntryUpdated) {
              onEntryUpdated();
            }
          }}
        />
      )}
    </div>
  );
}
