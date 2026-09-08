// Client-safe types and guards for Word of Day.
//
// Kept separate from index.ts so client code (e.g. hooks/useWordOfDay.ts) can
// import the shape and validator without pulling in the server-only loader
// chain (lib/word-of-day → lib/essential-words/data → node:fs).

export interface WordOfDay {
  word: string;
  ipa: string;
  part_of_speech?: string;
  definition: string;
  example_sentence: string;
  example_translation?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export function isWordOfDay(value: unknown): value is WordOfDay {
  if (!value || typeof value !== "object") return false;
  const candidate = value as WordOfDay;
  return (
    typeof candidate.word === "string" &&
    candidate.word.length > 0 &&
    typeof candidate.definition === "string" &&
    typeof candidate.difficulty === "string"
  );
}
