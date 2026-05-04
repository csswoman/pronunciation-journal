"use client";

import Badge from "@/components/ui/Badge";

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
      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
        Tags
      </label>
      {!isEditing ? (
        <div className="flex flex-wrap gap-2">
          {currentTags?.map((tag, index) => (
            <Badge key={index} label={tag} variant="info" />
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={editedTags?.join(", ") || ""}
          onChange={(e) => onTagsChange(e.target.value)}
          className="w-full px-4 py-2 border border-border-default rounded-lg bg-surface-sunken text-fg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          placeholder="Add tags separated by commas (e.g., business, travel)"
        />
      )}
    </div>
  );
}
