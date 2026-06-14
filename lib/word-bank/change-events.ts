import type { WordBankEntry } from "@/lib/word-bank/types";

export type WordBankChangeEvent =
  | { type: "INSERT"; new: WordBankEntry }
  | { type: "UPDATE"; new: WordBankEntry }
  | { type: "DELETE"; old: { id: string } };
