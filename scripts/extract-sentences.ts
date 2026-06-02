/**
 * Extracts reorder-words sentences from public/lessons/ and public/grammar-decks/
 * and upserts them into text_fragments via Supabase.
 *
 * Run with:  npx tsx scripts/extract-sentences.ts
 *
 * Safe to re-run — uses ON CONFLICT DO NOTHING (deterministic UUIDs from content hash).
 */

import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIN_TOKENS = 4;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Row {
  id: string;
  user_id: null;
  source: string;
  fragment_type: "sentence";
  content: string;
  title: string | null;
}

function deterministicId(source: string, ref: string, text: string): string {
  const h = createHash("sha256").update(`${source}:${ref}:${text}`).digest("hex").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function hasMinTokens(text: string): boolean {
  return text.trim().split(/\s+/).length >= MIN_TOKENS;
}

function extractFromLessons(dir: string): Row[] {
  const rows: Row[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const slug = file.replace(".json", "");
    const d = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    if (typeof d !== "object" || !Array.isArray(d?.examples)) continue;
    for (const ex of d.examples) {
      const text = String(ex?.english ?? "").trim();
      if (!text || !hasMinTokens(text)) continue;
      rows.push({
        id: deterministicId("lesson", slug, text),
        user_id: null,
        source: `lesson:${slug}`,
        fragment_type: "sentence",
        content: text,
        title: ex.note || ex.ipa || null,
      });
    }
  }
  return rows;
}

function extractFromDecks(dir: string): Row[] {
  const rows: Row[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const slug = file.replace(".json", "");
    const d = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    const cards = Array.isArray(d?.cards) ? d.cards : [];
    for (const card of cards) {
      for (const block of card?.blocks ?? []) {
        if (block.type === "pairs") {
          for (const line of block.lines ?? []) {
            const text = String(line?.text ?? "").trim();
            if (!text || !hasMinTokens(text)) continue;
            rows.push({
              id: deterministicId("deck", slug, text),
              user_id: null,
              source: `grammar-deck:${slug}`,
              fragment_type: "sentence",
              content: text,
              title: line.note || null,
            });
          }
        } else if (block.type === "pronunciation") {
          for (const ex of block.examples ?? []) {
            const text = String(ex?.text ?? "").trim();
            if (!text || !hasMinTokens(text)) continue;
            rows.push({
              id: deterministicId("deck", slug, text),
              user_id: null,
              source: `grammar-deck:${slug}`,
              fragment_type: "sentence",
              content: text,
              title: ex.es || ex.ipa || null,
            });
          }
        }
      }
    }
  }
  return rows;
}

async function main() {
  const root = path.join(process.cwd());
  const lessonRows = extractFromLessons(path.join(root, "public", "lessons"));
  const deckRows = extractFromDecks(path.join(root, "public", "grammar-decks"));

  // Dedupe by id
  const seen = new Set<string>();
  const allRows: Row[] = [];
  for (const r of [...lessonRows, ...deckRows]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      allRows.push(r);
    }
  }

  console.log(`Extracted ${allRows.length} sentences (${lessonRows.length} lessons, ${deckRows.length} decks)`);

  // Upsert in batches of 200
  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("text_fragments")
      .upsert(batch, { onConflict: "id", ignoreDuplicates: true });
    if (error) {
      console.error(`Batch ${i}–${i + BATCH} failed:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r  ${inserted}/${allRows.length} upserted...`);
  }
  console.log(`\nDone. ${allRows.length} sentences in text_fragments.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
