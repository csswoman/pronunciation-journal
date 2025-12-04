"use client";

import { useState } from "react";
import { Entry } from "@/lib/types";
import EntryCard from "./EntryCard";
import EntryModal from "./EntryModal";

interface EntriesListProps {
  entries: Entry[];
}

export default function EntriesList({ entries }: EntriesListProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

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
            onClick={() => setSelectedEntry(entry)}
          />
        ))}
      </div>
      
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

