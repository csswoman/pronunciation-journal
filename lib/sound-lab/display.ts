import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

const GENERIC_SOUND_SUFFIX = /^(vowel|consonant|diphthong)\s+sound$/i;

/** Parse IPA from a lesson title like `/iː/ — ship` (tolerates extra slashes). */
export function ipaFromLessonTitle(title: string): string | null {
  const m = title.match(/^\/+([^/]+)\/+/);
  if (!m) return null;
  return formatIpaDisplay(m[1]);
}

/** Human subtitle after the em dash; hides generic “Vowel Sound” labels. */
export function lessonSubtitleFromTitle(title: string): string | null {
  const m = title.match(/^\/+[^/]+\/+\s*[—–-]\s*(.+)$/i);
  if (!m) return null;
  const sub = m[1].trim();
  if (!sub || GENERIC_SOUND_SUFFIX.test(sub)) return null;
  return sub;
}
