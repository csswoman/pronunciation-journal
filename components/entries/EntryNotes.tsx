"use client";

export interface EntryNotesProps {
  isEditing: boolean;
  currentNotes?: string;
  editedNotes?: string;
  onNotesChange: (value: string) => void;
}

export default function EntryNotes({
  isEditing,
  currentNotes,
  editedNotes,
  onNotesChange,
}: EntryNotesProps) {
  if (!isEditing && !currentNotes) return null;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Notes
      </label>
      {!isEditing ? (
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{currentNotes}</p>
      ) : (
        <textarea
          value={editedNotes || ""}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="Add notes about this word..."
        />
      )}
    </div>
  );
}
