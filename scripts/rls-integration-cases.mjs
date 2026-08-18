// Additional RLS cases for tables that audit-rls.mjs requires in this file
// via `.from("<table>")`. Access models:
//   own-row  — caller can insert/read self; other users cannot
//   catalog  — authenticated can read; writes stay service_role
//   denied   — anon/authenticated cannot read or write
import { randomUUID } from "node:crypto";

const SEED_PREFIX = "rls-int-";

function assertInaccessible(result, message) {
  const visible = !result.error && Array.isArray(result.data) && result.data.length > 0;
  if (visible) throw new Error(message);
}

async function assertOwnRowIsolation(ctx, table, rowFor, lookup = "id") {
  const { userA, userB, insertSingle, assert, assertNoError, assertHasError } = ctx;
  const row = await insertSingle(userA.client, table, rowFor(userA), `user A creates own ${table}`);
  const value = row[lookup];
  const bReads = await userB.client.from(table).select(lookup).eq(lookup, value);
  assertNoError(bReads, `user B reads user A ${table} query`);
  assert(bReads.data.length === 0, `user B can read user A ${table} row`);
  const bWrites = await userB.client.from(table).insert(rowFor(userA));
  assertHasError(bWrites, `user B can write ${table} for user A`);
  return row;
}

async function assertAuthenticatedReadOnly(ctx, table, seedRow, writeRow) {
  const { userA, userB, admin, assert, assertNoError, assertHasError } = ctx;
  const seeded = await admin.from(table).insert(seedRow).select().single();
  assertNoError(seeded, `admin seeds ${table}`);
  const id = seeded.data.id;
  const aReads = await userA.client.from(table).select("id").eq("id", id);
  assertNoError(aReads, `user A reads ${table}`);
  assert(aReads.data.length === 1, `user A cannot read seeded ${table} row`);
  const bWrites = await userB.client.from(table).insert(writeRow);
  assertHasError(bWrites, `authenticated user can write ${table}`);
  return seeded.data;
}

export async function cleanupAdditionalRlsRows(admin, users) {
  await admin.from("word_definitions").delete().like("normalized_text", `${SEED_PREFIX}%`);
  await admin.from("deck_suggestions_cache").delete().like("cache_key", `${SEED_PREFIX}%`);
  await admin.from("rate_limits").delete().like("key", `${SEED_PREFIX}%`);

  for (const user of users) {
    await admin.from("srs_review_events").delete().eq("user_id", user.id);
    await admin.from("attempt_logs").delete().eq("user_id", user.id);
    await admin.from("learning_items").delete().eq("user_id", user.id);
    await admin.from("word_enrichment_jobs").delete().eq("user_id", user.id);
    await admin.from("srs_rating_events").delete().eq("user_id", user.id);
    await admin.from("journal_entries").delete().eq("user_id", user.id);
    await admin.from("lesson_completions").delete().eq("user_id", user.id);
    await admin.from("pronunciation_feedback_evidence").delete().eq("user_id", user.id);
    await admin.from("essential_word_contrast_observations").delete().eq("user_id", user.id);
    await admin.from("essential_word_blank_quality").delete().eq("user_id", user.id);
  }
}

export async function runAdditionalRlsCases(ctx) {
  const { userA, userB, admin, wordA, assertNoError, assertHasError } = ctx;
  let journalDay = 1;
  const journalRow = (user) => ({
    id: randomUUID(),
    user_id: user.id,
    entry_date: `2099-12-${String(journalDay++).padStart(2, "0")}`,
    prompt: "RLS",
    content: "temporary",
  });

  await assertOwnRowIsolation(ctx, "journal_entries", journalRow);
  await assertOwnRowIsolation(ctx, "lesson_completions", (user) => ({
    user_id: user.id,
    course_slug: "rls-course",
    lesson_slug: `rls-lesson-${randomUUID()}`,
  }));
  await assertOwnRowIsolation(ctx, "word_enrichment_jobs", (user) => ({
    user_id: user.id,
    word_id: wordA.id,
    status: "queued",
  }));
  await assertOwnRowIsolation(ctx, "srs_rating_events", (user) => ({
    idempotency_key: randomUUID(),
    user_id: user.id,
    entity_type: "word_bank",
    entity_id: wordA.id,
    grade: 4,
  }));
  await assertOwnRowIsolation(ctx, "pronunciation_feedback_evidence", (user) => ({
    user_id: user.id,
    target_id: `rls-target-${randomUUID()}`,
    evaluator_kind: "stt_intelligibility",
    evaluator_version: "rls-test",
    outcome: "unscored",
  }));

  const learningItem = await assertOwnRowIsolation(ctx, "learning_items", (user) => ({
    id: `rls-item-${randomUUID()}`,
    user_id: user.id,
    word_id: "the",
    skill: "meaning",
    content_origin: "authored",
    schedule: { kind: "none" },
    schedule_kind: "none",
    due_at: null,
  }));
  const attemptLog = await assertOwnRowIsolation(ctx, "attempt_logs", (user) => ({
    id: `rls-attempt-${randomUUID()}`,
    user_id: user.id,
    session_id: `rls-session-${randomUUID()}`,
    word_id: "the",
    assessment: {},
    observations: [],
    event_type: "practice",
    occurred_at: new Date().toISOString(),
  }));
  await assertOwnRowIsolation(ctx, "srs_review_events", (user) => ({
    id: `rls-review-${randomUUID()}`,
    user_id: user.id,
    attempt_log_id: attemptLog.id,
    learning_item_id: learningItem.id,
    grade: "Good",
    assessment: {},
    prior_schedule: { kind: "none" },
    resulting_schedule: { kind: "none" },
    fsrs_audit: { schedulerVersion: "rls-test", desiredRetention: 0.9 },
    occurred_at: new Date().toISOString(),
  }));

  await assertOwnRowIsolation(ctx, "essential_word_contrast_observations", (user) => ({
    user_id: user.id,
    attempt_id: randomUUID(),
    contrast_id: "rls-contrast",
    weight: 0.5,
    is_correct: true,
  }));
  await assertOwnRowIsolation(
    ctx,
    "essential_word_blank_quality",
    (user) => ({
      sentence_id: `rls-sentence-${randomUUID()}`,
      token_index: 0,
      user_id: user.id,
    }),
    "sentence_id"
  );

  await assertAuthenticatedReadOnly(
    ctx,
    "deck_suggestions_cache",
    { cache_key: `${SEED_PREFIX}${randomUUID()}`, suggestions: [{ word: "resilient" }] },
    { cache_key: `${SEED_PREFIX}${randomUUID()}`, suggestions: [{ word: "boundary" }] }
  );
  await assertAuthenticatedReadOnly(
    ctx,
    "word_definitions",
    {
      text: `${SEED_PREFIX}alpha`,
      normalized_text: `${SEED_PREFIX}${randomUUID()}`,
      meaning: "temporary",
      translation: "temporal",
      source: "curated",
    },
    {
      text: `${SEED_PREFIX}beta`,
      normalized_text: `${SEED_PREFIX}${randomUUID()}`,
      meaning: "cross write",
      translation: "escritura cruzada",
      source: "curated",
    }
  );

  const rateKey = `${SEED_PREFIX}${randomUUID()}`;
  const rateSeed = await admin.from("rate_limits").insert({
    key: rateKey,
    count: 1,
    window_start: new Date().toISOString(),
  });
  assertNoError(rateSeed, "admin seeds rate_limits");
  assertInaccessible(
    await userA.client.from("rate_limits").select("key").eq("key", rateKey),
    "authenticated user can read rate_limits"
  );
  const rateWrite = await userB.client.from("rate_limits").insert({
    key: `${SEED_PREFIX}${randomUUID()}`,
    count: 1,
    window_start: new Date().toISOString(),
  });
  assertHasError(rateWrite, "authenticated user can write rate_limits");
}
