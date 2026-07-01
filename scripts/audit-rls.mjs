import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const ALLOWED_LEGACY_FILES = new Set([
  "supabase/migrations/20260329230234_remote_schema.sql",
  "supabase/migrations/20260409093000_add_stt_transcription_cache.sql",
  "supabase/migrations/20260409120000_theory_lessons.sql",
  "supabase/migrations/20260410120000_add_keep_permanent_to_entries.sql",
  "supabase/migrations/20260423120000_word_bank.sql",
  "supabase/migrations/20260423130000_word_bank_add_columns.sql",
  "supabase/migrations/20260424120000_word_bank_enrichment_hardening.sql",
  "supabase/migrations/20260424130000_word_bank_add_audio_url.sql",
  "supabase/migrations/20260424140000_word_bank_audio_retry_tracking.sql",
  "supabase/migrations/20260428100000_deck_entry_progress.sql",
  "supabase/migrations/20260511120000_word_bank_srs.sql",
  "supabase/migrations/20260511120100_word_bank_decks.sql",
  "supabase/migrations/20260517000000_create_user_word_progress.sql",
  "supabase/migrations/20260517120000_generic_exercise_types.sql",
  "supabase/migrations/20260517130000_seed_sounds_content.sql",
  "supabase/migrations/20260519_add_cefr_level.sql",
  "supabase/migrations/20260519090000_add_cefr_level.sql",
  "supabase/migrations/20260519120000_practice_engine.sql",
  "supabase/migrations/20260521000000_drop_user_word_progress.sql",
  "supabase/migrations/20260521103000_answer_history_context_check.sql",
  "supabase/migrations/20260521104000_answer_history_grade.sql",
  "supabase/migrations/20260523120000_word_bank_source.sql",
  "supabase/migrations/20260528120000_add_is_favorite_to_word_bank.sql",
  "supabase/migrations/20260601000000_drop_notion_integration.sql",
  "supabase/migrations/20260602000000_seed_text_fragments_sentences.sql",
  "supabase/migrations/20260602100000_contrast_progress.sql",
  "supabase/migrations/20260610120000_general_american_accent.sql",
  "supabase/migrations/20260610150000_user_learning_state.sql",
  "supabase/migrations/20260610160000_seed_biz_code_review_fragments.sql",
  "supabase/migrations/20260611120000_fix_stt_cache_rls.sql",
  "supabase/migrations/20260616120000_answer_history_contexts.sql",
  "supabase/migrations/20260616130000_activity_sessions.sql",
  "supabase/migrations/20260616140000_contrast_mastery_pct.sql",
  "supabase/migrations/20260618120000_topic_srs.sql",
  "supabase/migrations/20260618130000_answer_history_topic.sql",
  "supabase/migrations/20260619120000_production_exercise_types.sql",
  "supabase/migrations/20260619180000_reader_passages.sql",
  "supabase/migrations/20260619230000_recategorize_nonsentence_fragments.sql",
  "supabase/migrations/20260621120000_multiple_choice_exercise_type.sql",
  "supabase/migrations/20260621130000_sentence_context_exercise_type.sql",
  "supabase/migrations/20260621140000_stt_cache_scope_per_user.sql",
  "supabase/migrations/20260622160000_assessment_results.sql",
  "supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql",
]);

function readSqlFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => path.join(dir, file));
}

function findCreatedTables(sql) {
  return [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)\s*\(/gi)].map((match) => match[1]);
}

function hasRlsEnabled(sql, tableName) {
  const tablePattern = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`enable\\s+row\\s+level\\s+security\\s+on\\s+table\\s+${tablePattern}`, "i").test(sql);
}

function hasPolicy(sql, tableName) {
  const tablePattern = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`create\\s+policy[\\s\\S]+on\\s+${tablePattern}`, "i").test(sql);
}

const issues = [];

for (const file of readSqlFiles(MIGRATIONS_DIR)) {
  const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");
  if (ALLOWED_LEGACY_FILES.has(relative)) continue;

  const sql = fs.readFileSync(file, "utf8");
  const tables = findCreatedTables(sql);

  for (const tableName of tables) {
    if (!hasRlsEnabled(sql, tableName)) {
      issues.push(`${relative}: missing ENABLE ROW LEVEL SECURITY for ${tableName}`);
    }
    if (!hasPolicy(sql, tableName)) {
      issues.push(`${relative}: missing CREATE POLICY for ${tableName}`);
    }
  }
}

if (issues.length > 0) {
  console.error("RLS audit failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("RLS audit passed for migration files.");
