import {
  CANONICAL_SOUNDS,
  canonicalizeSoundIpa,
  getCanonicalSound,
} from "./inventory";
import { ipaContainsSound, parseIpa } from "./ipa-parser";

/**
 * Pure audit passes over `sounds` / `words` content.
 *
 * Kept free of I/O so the rules are unit-testable; `scripts/audit-sound-content.ts`
 * supplies the rows and renders the findings.
 */

export interface SoundRow {
  id: number;
  ipa: string | null;
  type: string | null;
  example: string | null;
}

export interface WordRow {
  id: number;
  word: string | null;
  ipa: string | null;
  sound_id: number | null;
  sound_focus: string | null;
}

export type Severity = "ok" | "error" | "review";

export interface Finding {
  severity: Severity;
  scope: "sound" | "word";
  /** Canonical sound this finding belongs to, or the raw value if unmapped. */
  sound: string;
  subject: string;
  detail: string;
}

/** Pass 1 — sound rows against the canonical inventory. */
export function auditSounds(sounds: SoundRow[]): {
  findings: Finding[];
  canonicalIdToIpa: Map<number, string>;
} {
  const findings: Finding[] = [];
  const canonicalIdToIpa = new Map<number, string>();
  const byCanonical = new Map<string, SoundRow[]>();

  for (const row of sounds) {
    if (!row.ipa?.trim()) {
      findings.push({
        severity: "error",
        scope: "sound",
        sound: `(sound id ${row.id})`,
        subject: `id ${row.id}`,
        detail: "sound row has no IPA",
      });
      continue;
    }

    const canonicalIpa = canonicalizeSoundIpa(row.ipa);
    const phoneme = getCanonicalSound(canonicalIpa);

    if (!phoneme) {
      findings.push({
        severity: "error",
        scope: "sound",
        sound: canonicalIpa,
        subject: `id ${row.id} ${row.ipa}`,
        detail: "not in the canonical GA inventory",
      });
      continue;
    }

    canonicalIdToIpa.set(row.id, canonicalIpa);
    byCanonical.set(canonicalIpa, [
      ...(byCanonical.get(canonicalIpa) ?? []),
      row,
    ]);

    if (row.ipa !== canonicalIpa) {
      findings.push({
        severity: "review",
        scope: "sound",
        sound: canonicalIpa,
        subject: `id ${row.id}`,
        detail: `stored as ${row.ipa}, normalizes to ${canonicalIpa}`,
      });
    }

    if (row.type !== phoneme.type) {
      findings.push({
        severity: "error",
        scope: "sound",
        sound: canonicalIpa,
        subject: `id ${row.id}`,
        detail: `class is "${row.type ?? "null"}", canonical is "${phoneme.type}"`,
      });
    }
  }

  // Duplicates: several rows collapsing onto one canonical phoneme.
  for (const [canonicalIpa, rows] of byCanonical) {
    if (rows.length > 1) {
      findings.push({
        severity: "error",
        scope: "sound",
        sound: canonicalIpa,
        subject: rows.map((row) => `id ${row.id} (${row.ipa})`).join(", "),
        detail: `${rows.length} rows normalize to the same phoneme`,
      });
    }
  }

  // Anchor coverage: every canonical phoneme needs a row, and that row's
  // `example` must be one of the inventory's anchor words.
  for (const phoneme of CANONICAL_SOUNDS) {
    const rows = byCanonical.get(phoneme.symbol);
    if (!rows?.length) {
      findings.push({
        severity: "error",
        scope: "sound",
        sound: phoneme.symbol,
        subject: "anchor",
        detail: "no sound row for this canonical phoneme",
      });
      continue;
    }

    const [row] = rows;
    const anchor = row.example?.trim().toLowerCase();
    if (!anchor) {
      findings.push({
        severity: "review",
        scope: "sound",
        sound: phoneme.symbol,
        subject: "anchor",
        detail: `no example word (inventory suggests "${phoneme.examples[0]}")`,
      });
    } else if (!phoneme.examples.includes(anchor)) {
      findings.push({
        severity: "review",
        scope: "sound",
        sound: phoneme.symbol,
        subject: "anchor",
        detail: `example "${anchor}" is not an inventory anchor (${phoneme.examples.join(", ")})`,
      });
    } else {
      findings.push({
        severity: "ok",
        scope: "sound",
        sound: phoneme.symbol,
        subject: "anchor",
        detail: `"${anchor}" present`,
      });
    }
  }

  return { findings, canonicalIdToIpa };
}

/** Pass 2 — each word's transcription against the sound it is filed under. */
export function auditWords(
  words: WordRow[],
  canonicalIdToIpa: Map<number, string>,
): Finding[] {
  const findings: Finding[] = [];

  for (const row of words) {
    const label = row.word?.trim() || `(word id ${row.id})`;
    const soundIpa =
      row.sound_id !== null ? canonicalIdToIpa.get(row.sound_id) : undefined;

    if (!soundIpa) {
      findings.push({
        severity: "error",
        scope: "word",
        sound: `(sound id ${row.sound_id ?? "null"})`,
        subject: label,
        detail:
          row.sound_id === null
            ? "word has no sound_id"
            : `sound_id ${row.sound_id} does not resolve to a canonical sound`,
      });
      continue;
    }

    // sound_focus is a denormalized copy of the parent sound; it must agree.
    if (row.sound_focus) {
      const focus = canonicalizeSoundIpa(row.sound_focus);
      if (focus !== soundIpa) {
        findings.push({
          severity: "error",
          scope: "word",
          sound: soundIpa,
          subject: label,
          detail: `sound_focus ${row.sound_focus} disagrees with sound_id (${soundIpa})`,
        });
      }
    }

    if (!row.ipa?.trim()) {
      findings.push({
        severity: "review",
        scope: "word",
        sound: soundIpa,
        subject: label,
        detail: "no IPA",
      });
      continue;
    }

    const { tokens, unknown } = parseIpa(row.ipa);
    if (unknown.length) {
      findings.push({
        severity: "review",
        scope: "word",
        sound: soundIpa,
        subject: label,
        detail: `${row.ipa} contains unrecognized symbols: ${[...new Set(unknown)].join(" ")}`,
      });
    }

    if (ipaContainsSound(row.ipa, soundIpa)) {
      findings.push({
        severity: "ok",
        scope: "word",
        sound: soundIpa,
        subject: label,
        detail: `${row.ipa} → ${tokens.join(" ")}`,
      });
    } else {
      findings.push({
        severity: "error",
        scope: "word",
        sound: soundIpa,
        subject: label,
        detail: `${row.ipa} does not contain ${soundIpa} (parsed: ${tokens.join(" ") || "∅"})`,
      });
    }
  }

  return findings;
}
