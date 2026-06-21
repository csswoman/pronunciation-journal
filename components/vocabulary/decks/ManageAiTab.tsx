"use client";

import type { DeckListItem } from "@/lib/decks/queries";
import type { Tables } from "@/lib/supabase/types";
import { GeminiSuggestPanel } from "./GeminiSuggestPanel";

type Entry = Tables<"entries">;

interface ManageAiTabProps {
  deck: DeckListItem;
  entries: Entry[];
  onAddEntry: (word?: string, meaning?: string) => Promise<void>;
}

export function ManageAiTab({ deck, entries, onAddEntry }: ManageAiTabProps) {
  return <div className="p-4">
    <GeminiSuggestPanel deck={deck} existingWords={entries.map((entry) => entry.word)} onAddEntry={onAddEntry} />
  </div>;
}
