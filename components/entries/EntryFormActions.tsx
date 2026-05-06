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
          className="px-4 py-2 bg-surface-sunken text-fg-muted rounded-md hover:bg-border-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-default transition-colors"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
