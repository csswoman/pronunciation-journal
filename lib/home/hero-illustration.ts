import type { DailyStep } from "@/hooks/useDailyPlan";
import type { IllustrationKey } from "@/lib/illustrations/registry";

export function getHeroIllustrationKey(
  step: DailyStep | undefined,
  allDone: boolean
): IllustrationKey {
  if (allDone) return "stateCompletado";
  if (!step) return "domainProgress";
  switch (step.kind) {
    case "phoneme_focus":
    case "minimal_pairs":
    case "mission":
      return "domainSpeaking";
    case "listening":
    case "connected_speech":
      return "domainListening";
    case "reader":
      return "domainReading";
    case "concept":
    case "study_deck":
    case "grammar_focus":
      return "domainDictionary";
    case "sentence_builder":
      return "domainWriting";
    default:
      return "domainVocabulary";
  }
}
