"use client";

import { Plus } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";

export function WordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent-dim text-primary"
        >
          <Plus size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">No words saved yet</p>
          <p className="text-xs mt-1 max-w-sm text-fg-subtle">
            Add any word and get its definition, IPA pronunciation, and an example sentence automatically.
          </p>
        </div>
        <Button onClick={onAdd} icon={<Plus size={16} />}>Add your first word</Button>
        <p className="text-xs text-fg-muted">
          Tip: press <kbd className="px-1.5 py-0.5 rounded bg-surface-sunken border border-border-subtle font-mono text-xs text-fg-secondary">N</kbd> anywhere to add a word
        </p>
      </div>
    </Card>
  );
}
