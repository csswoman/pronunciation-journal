import type { BlankDefinition } from "@/components/mini-lessons/ExerciseBlock";

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡'’"]/g, "");
}

export function normalizeContractions(s: string): string {
  return s
    .replace(/\bdo not\b/g, "dont")
    .replace(/\bdoes not\b/g, "doesnt")
    .replace(/\bdid not\b/g, "didnt")
    .replace(/\bwould not\b/g, "wouldnt")
    .replace(/\bwill not\b/g, "wont")
    .replace(/\bcannot\b/g, "cant")
    .replace(/\bis not\b/g, "isnt")
    .replace(/\bare not\b/g, "arent")
    .replace(/\bhave not\b/g, "havent")
    .replace(/\bhas not\b/g, "hasnt")
    .replace(/\b'm\b/g, "am")
    .replace(/\b're\b/g, "are")
    .replace(/\b've\b/g, "have")
    .replace(/\b'll\b/g, "will")
    .replace(/\b'd\b/g, "would");
}

export function checkAnswer(
  userVal: string,
  correctTarget: string | string[] | BlankDefinition | undefined
): boolean {
  if (!correctTarget) return false;

  const normalizedUser = normalize(userVal);
  const normalizedUserContractions = normalizeContractions(normalizedUser);

  let acceptedList: string[] = [];
  if (typeof correctTarget === "string") {
    const clean = correctTarget.replace(/\([^)]*\)/g, "");
    acceptedList = clean.split("/").map((s) => s.trim());
  } else if (Array.isArray(correctTarget)) {
    acceptedList = correctTarget.flatMap((item) =>
      typeof item === "string" ? [item] : (item as BlankDefinition).accepted ?? []
    );
  } else if (typeof correctTarget === "object" && "accepted" in correctTarget) {
    acceptedList = correctTarget.accepted;
  }

  return acceptedList.some((candidate) => {
    const norm = normalize(candidate);
    const normContractions = normalizeContractions(norm);
    return (
      norm === normalizedUser ||
      normContractions === normalizedUser ||
      norm === normalizedUserContractions ||
      normContractions === normalizedUserContractions
    );
  });
}

export function resolveBlankAnswers(
  rawAnswer: string | string[] | BlankDefinition[] | undefined,
  blanksCount: number
): Array<string | string[] | BlankDefinition> {
  if (!rawAnswer) return [];

  if (Array.isArray(rawAnswer)) {
    return rawAnswer;
  }

  if (typeof rawAnswer === "string") {
    if (rawAnswer.includes("//")) {
      return rawAnswer.split("//").map((s) => s.trim());
    }
    if (blanksCount > 1 && rawAnswer.includes("/")) {
      const parts = rawAnswer.split("/").map((s) => s.trim());
      if (parts.length === blanksCount) {
        return parts;
      }
    }
    return [rawAnswer.trim()];
  }

  return [rawAnswer];
}
