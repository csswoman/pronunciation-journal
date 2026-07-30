/**
 * Read-only audit of `sounds` and `words` against the canonical GA inventory.
 *
 * Run with:  npx tsx scripts/audit-sound-content.ts
 *            npx tsx scripts/audit-sound-content.ts --json
 *            npx tsx scripts/audit-sound-content.ts --sound "/ɑ/"
 *            npx tsx scripts/audit-sound-content.ts --db      (local Docker)
 *
 * Reads through PostgREST by default. `--db` reads the local Supabase Postgres
 * container directly via psql, which works when Kong/PostgREST are down and
 * avoids adding a Postgres driver dependency for a read-only script.
 *
 * This script NEVER writes. Corrections belong in a separate migration that
 * requires explicit approval. Exit code is 1 when errors are found (0 when only
 * review items remain), so it can gate CI without failing on missing IPA.
 *
 * Pass 1 — sounds:  normalize /ɡ/→/g/, group aliases, detect duplicates,
 *                   verify the class matches the canonical inventory, and
 *                   confirm the anchor word exists.
 * Pass 2 — words:   compare sound_id/sound_focus against the full IPA using
 *                   the phoneme parser (not substring matching), tolerating
 *                   dialectal variants, and flag words with no IPA.
 */

import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import {
  auditSounds,
  auditWords,
  type Finding,
  type Severity,
  type SoundRow,
  type WordRow,
} from "../lib/sounds/audit";
import { CANONICAL_SOUNDS, canonicalizeSoundIpa } from "../lib/sounds/inventory";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const soundFilterArg = args.indexOf("--sound");
const soundFilter =
  soundFilterArg >= 0 ? canonicalizeSoundIpa(args[soundFilterArg + 1] ?? "") : null;

const useDb = args.includes("--db");
const DB_CONTAINER =
  process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_english-journal";

/** Read a table through PostgREST, paging past the row limit. */
async function fetchViaRest<T>(table: string, columns: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or pass --db)",
    );
  }

  const supabase = createClient(url, key);
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed to read ${table}: ${error.message}`);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/**
 * Read a table straight from the local Postgres container.
 *
 * Uses `json_agg` so values round-trip with their types intact and no ad-hoc
 * delimiter parsing is needed for IPA strings.
 */
function fetchViaDb<T>(table: string, columns: string): T[] {
  const sql = `select coalesce(json_agg(t order by t.id), '[]'::json)::text
               from (select ${columns} from public.${table}) t;`;
  const output = execFileSync(
    "docker",
    ["exec", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-Atc", sql],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(output.trim()) as T[];
}

async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  return useDb ? fetchViaDb<T>(table, columns) : fetchViaRest<T>(table, columns);
}

const SEVERITY_LABEL: Record<Severity, string> = {
  ok: "OK",
  error: "ERROR",
  review: "REVISAR",
};

const SEVERITY_ORDER: Severity[] = ["error", "review", "ok"];

function report(findings: Finding[]): void {
  const bySound = new Map<string, Finding[]>();
  for (const finding of findings) {
    bySound.set(finding.sound, [...(bySound.get(finding.sound) ?? []), finding]);
  }

  // Canonical inventory order first, then anything unmapped.
  const canonicalOrder = CANONICAL_SOUNDS.map((phoneme) => phoneme.symbol);
  const extras = [...bySound.keys()]
    .filter((sound) => !canonicalOrder.includes(sound))
    .sort();

  for (const sound of [...canonicalOrder, ...extras]) {
    const group = bySound.get(sound);
    if (!group) continue;

    console.log(sound);
    const sorted = [...group].sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
    );
    for (const finding of sorted) {
      const tag =
        finding.subject === "anchor"
          ? "ANCLA"
          : SEVERITY_LABEL[finding.severity];
      console.log(`  ${tag.padEnd(8)}${finding.subject.padEnd(18)}${finding.detail}`);
    }
    console.log("");
  }
}

async function main(): Promise<void> {
  const [sounds, words] = await Promise.all([
    fetchAll<SoundRow>("sounds", "id, ipa, type, example"),
    fetchAll<WordRow>("words", "id, word, ipa, sound_id, sound_focus"),
  ]);

  const { findings: soundFindings, canonicalIdToIpa } = auditSounds(sounds);
  const wordFindings = auditWords(words, canonicalIdToIpa);

  const all = [...soundFindings, ...wordFindings].filter(
    (finding) => !soundFilter || finding.sound === soundFilter,
  );

  const errors = all.filter((finding) => finding.severity === "error");
  const reviews = all.filter((finding) => finding.severity === "review");

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          scanned: { sounds: sounds.length, words: words.length },
          totals: {
            ok: all.length - errors.length - reviews.length,
            error: errors.length,
            review: reviews.length,
          },
          findings: all,
        },
        null,
        2,
      ),
    );
  } else {
    report(all);
    console.log(
      `Leídos ${sounds.length} sounds y ${words.length} words (read-only).`,
    );
    console.log(
      `ERROR: ${errors.length}  ·  REVISAR: ${reviews.length}  ·  OK: ${
        all.length - errors.length - reviews.length
      }`,
    );
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
