"use client";

import Button from "@/components/ui/Button";

interface EntryFormActionsProps {
  onCancel?: () => void;
}

export default function EntryFormActions({ onCancel }: EntryFormActionsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        type="submit"
        className="flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 accent-button"
      >
        Save Entry
      </Button>
      {onCancel && (
        <Button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
