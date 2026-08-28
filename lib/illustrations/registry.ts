import type React from "react";
import PlaceholderIllustration from "@/components/illustrations/PlaceholderIllustration";

// ── Empty states ────────────────────────────────────────────────────────────
import EmptyTracking from "@/components/illustrations/empty-state-for-file.svg";
import EmptyVocabulario from "@/components/illustrations/empty-basket.svg";
import EmptyChat from "@/components/illustrations/empty-state-for-chat.svg";
import EmptyDeck from "@/components/illustrations/revising-flashcards.svg";
import EmptySearch from "@/components/illustrations/search.svg";

// ── Achievement / completion ────────────────────────────────────────────────
import StateCompletado from "@/components/illustrations/celebration-burst.svg";
import StateTrophy from "@/components/illustrations/trophy.svg";
import StateStreak from "@/components/illustrations/streak-flame.svg";

// ── Skill domains (home cards, daily steps) ─────────────────────────────────
import DomainVocabulary from "@/components/illustrations/dictionary-book.svg";
import DomainSpeaking from "@/components/illustrations/person-speaking-into-microphone.svg";
import DomainListening from "@/components/illustrations/earbuds.svg";
import DomainReading from "@/components/illustrations/person-reading-huge-open.svg";
import DomainWriting from "@/components/illustrations/notebook.svg";
import DomainDictionary from "@/components/illustrations/looking-up-word-dictionary.svg";
import DomainProgress from "@/components/illustrations/staircase-growth.svg";
import DomainTip from "@/components/illustrations/bulb.svg";

export type IllustrationKey =
  // empty states
  | "emptyTracking"
  | "emptyVocabulario"
  | "emptyChat"
  | "emptyDeck"
  | "emptySearch"
  // achievement
  | "stateCompletado"
  | "stateTrophy"
  | "stateStreak"
  // skill domains
  | "domainVocabulary"
  | "domainSpeaking"
  | "domainListening"
  | "domainReading"
  | "domainWriting"
  | "domainDictionary"
  | "domainProgress"
  | "domainTip";

type IllustrationComponent = React.FC<React.SVGProps<SVGSVGElement>>;

/**
 * Koboyo hand-drawn icons (koboyo.com/icons). Every icon ships monochrome with
 * `fill="currentColor"` and no width/height, so it inherits theme color from
 * its container and scales from its own viewBox — no SVGR color rewriting
 * needed (unlike the unDraw set this replaced).
 *
 * SIZING: these are NOT a fixed grid — under 4% are square and extents vary
 * per icon. Never constrain both axes: set one dimension and let the other
 * follow (`h-16 w-auto`), or the drawing distorts.
 *
 * A `null` entry means "no bespoke art yet" — `getIllustration` falls back to
 * `PlaceholderIllustration` for those keys.
 */
export const ILLUSTRATIONS: Record<IllustrationKey, IllustrationComponent | null> = {
  emptyTracking: EmptyTracking,
  emptyVocabulario: EmptyVocabulario,
  emptyChat: EmptyChat,
  emptyDeck: EmptyDeck,
  emptySearch: EmptySearch,
  stateCompletado: StateCompletado,
  stateTrophy: StateTrophy,
  stateStreak: StateStreak,
  domainVocabulary: DomainVocabulary,
  domainSpeaking: DomainSpeaking,
  domainListening: DomainListening,
  domainReading: DomainReading,
  domainWriting: DomainWriting,
  domainDictionary: DomainDictionary,
  domainProgress: DomainProgress,
  domainTip: DomainTip,
};

export function getIllustration(key: IllustrationKey): IllustrationComponent {
  return ILLUSTRATIONS[key] ?? PlaceholderIllustration;
}
