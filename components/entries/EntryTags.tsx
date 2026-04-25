"use client";

export interface EntryTagsProps {
  isEditing: boolean;
  currentTags?: string[];
  editedTags?: string[];
  onTagsChange: (value: string) => void;
}

export default function EntryTags({
  isEditing,
  currentTags,
  editedTags,
  onTagsChange,
}: EntryTagsProps) {
  if (!isEditing && (!currentTags || currentTags.length === 0)) return null;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Tags
      </label>
      {!isEditing ? (
        <div className="flex flex-wrap gap-2">
          {currentTags?.map((tag, index) => (
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
          value={editedTags?.join(", ") || ""}
          onChange={(e) => onTagsChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="Add tags separated by commas (e.g., business, travel)"
        />
      )}
    </div>
  );
}
