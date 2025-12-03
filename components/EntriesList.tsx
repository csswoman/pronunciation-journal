"use client";

import { Entry } from "@/lib/types";
import EntryCard from "./EntryCard";

interface EntriesListProps {
  entries: Entry[];
}

export default function EntriesList({ entries }: EntriesListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No entries yet.</p>
        <p className="text-sm mt-2">
          Click "Agregar palabra" to add your first word!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

