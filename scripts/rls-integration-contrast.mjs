// Plan 048: RLS + RPC contract for contrast_session_events and
// user_contrast_progress. Exercises the live transactional writer:
//   - a replayed attempt is counted once
//   - concurrent sessions with distinct attempts each add their delta once
//   - consecutive sessions at a constant 80% never lower the projection
//   - a stale offline event adds evidence without rolling back newer SRS state
//   - users cannot read or forge another user's events/progress
// Run only against a disposable local Supabase (see plans/048).
import { randomUUID } from "node:crypto";

const RPC = "apply_contrast_session_result";
const CONTRAST_ID = "rls-a|rls-b";
const DAY_MS = 86_400_000;

function sessionArgs(overrides = {}) {
  return {
    p_contrast_id: CONTRAST_ID,
    p_session_correct: 8,
    p_session_total: 10,
    // Legacy positional fields kept in the signature for rolling compatibility.
    p_streak: 0,
    p_ease_factor: 2.5,
    p_interval_days: 1,
    p_next_review: new Date(Date.now() + DAY_MS).toISOString(),
    p_mastery_pct: 0,
    p_attempt_id: randomUUID(),
    p_raw_mastery: null,
    p_session_accuracy: 80,
    p_occurred_at: new Date().toISOString(),
    p_session_passed: true,
    ...overrides,
  };
}

function near(actual, expected, tolerance = 0.01) {
  return Math.abs(Number(actual) - expected) <= tolerance;
}

async function readProgress(admin, userId, assertNoError) {
  const result = await admin
    .from("user_contrast_progress")
    .select("total_attempts, correct_answers, raw_mastery, mastery_pct, mastery_session_count, streak, next_review")
    .eq("user_id", userId)
    .eq("contrast_id", CONTRAST_ID)
    .single();
  assertNoError(result, "service role reads contrast progress");
  return result.data;
}

export async function cleanupContrastRlsRows(admin, users) {
  for (const user of users) {
    await admin.from("contrast_session_events").delete().eq("user_id", user.id);
    await admin.from("user_contrast_progress").delete().eq("user_id", user.id);
  }
}

export async function runContrastProgressRlsCases(ctx) {
  const { userA, userB, admin, assert, assertNoError, assertHasError } = ctx;
  const progressOf = (userId) => readProgress(admin, userId, assertNoError);

  // 1. First session, then a replay of the same attempt: counted once.
  const first = sessionArgs();
  assertNoError(await userA.client.rpc(RPC, first), "user A applies first contrast session");
  assertNoError(await userA.client.rpc(RPC, first), "user A replays the same contrast session");
  let progress = await progressOf(userA.id);
  assert(progress.total_attempts === 10, `replay double-counted attempts: ${progress.total_attempts}`);
  assert(progress.mastery_session_count === 1, `replay double-counted sessions: ${progress.mastery_session_count}`);
  assert(near(progress.raw_mastery, 80), `raw EMA after one 80% session: ${progress.raw_mastery}`);
  assert(near(progress.mastery_pct, 25.3), `projection after one 80% session: ${progress.mastery_pct}`);
  const projectionAfterFirst = Number(progress.mastery_pct);

  // 2. Concurrent sessions with distinct attempts, then a concurrent replay.
  const concurrent = [sessionArgs(), sessionArgs(), sessionArgs()];
  const applied = await Promise.all(concurrent.map((args) => userA.client.rpc(RPC, args)));
  applied.forEach((result, i) => assertNoError(result, `user A applies concurrent session ${i + 1}`));
  const replayed = await Promise.all(concurrent.map((args) => userA.client.rpc(RPC, args)));
  replayed.forEach((result, i) => assertNoError(result, `user A replays concurrent session ${i + 1}`));
  progress = await progressOf(userA.id);
  assert(progress.total_attempts === 40, `concurrent deltas lost or duplicated: ${progress.total_attempts}`);
  assert(progress.correct_answers === 32, `concurrent correct deltas wrong: ${progress.correct_answers}`);
  assert(progress.mastery_session_count === 4, `concurrent session count wrong: ${progress.mastery_session_count}`);
  assert(near(progress.raw_mastery, 80), `raw EMA drifted at constant 80%: ${progress.raw_mastery}`);
  // Regression for the double repScale: sqrt(4/10) * 80 = 50.60, never below session 1.
  assert(near(progress.mastery_pct, 50.6), `projection after four 80% sessions: ${progress.mastery_pct}`);
  assert(Number(progress.mastery_pct) > projectionAfterFirst, "projection fell at constant 80% accuracy");

  const ownEvents = await userA.client
    .from("contrast_session_events")
    .select("attempt_id")
    .eq("contrast_id", CONTRAST_ID);
  assertNoError(ownEvents, "user A reads own contrast session events");
  assert(ownEvents.data.length === 4, `expected 4 deduplicated events, got ${ownEvents.data.length}`);

  // 3. A stale offline event adds evidence but keeps the newer SRS state.
  const beforeStale = await progressOf(userA.id);
  const stale = sessionArgs({
    p_session_correct: 0,
    p_session_accuracy: 0,
    p_session_passed: false,
    p_occurred_at: new Date(Date.now() - 7 * DAY_MS).toISOString(),
  });
  assertNoError(await userA.client.rpc(RPC, stale), "user A syncs a stale offline session");
  const afterStale = await progressOf(userA.id);
  assert(afterStale.total_attempts === 50, `stale event counters wrong: ${afterStale.total_attempts}`);
  assert(afterStale.mastery_session_count === 5, `stale event session count wrong: ${afterStale.mastery_session_count}`);
  assert(afterStale.streak === beforeStale.streak, "stale event rolled back the streak");
  assert(afterStale.next_review === beforeStale.next_review, "stale event rolled back next_review");
  assert(Number(afterStale.raw_mastery) < 80, `stale 0% evidence was discarded: ${afterStale.raw_mastery}`);

  // 4. Invalid evidence is rejected before any write.
  assertHasError(
    await userA.client.rpc(RPC, sessionArgs({ p_session_correct: 11 })),
    "RPC accepted p_session_correct > p_session_total"
  );
  assertHasError(
    await userA.client.rpc(RPC, sessionArgs({ p_attempt_id: null })),
    "RPC accepted a session without attempt identity"
  );
  const afterInvalid = await progressOf(userA.id);
  assert(afterInvalid.total_attempts === 50, "rejected RPC calls changed counters");

  // 5. Cross-user isolation for events and progress.
  const bReadsEvents = await userB.client.from("contrast_session_events").select("id").eq("user_id", userA.id);
  assertNoError(bReadsEvents, "user B reads user A contrast events query");
  assert(bReadsEvents.data.length === 0, "user B can read user A contrast_session_events rows");
  const bReadsProgress = await userB.client.from("user_contrast_progress").select("id").eq("user_id", userA.id);
  assertNoError(bReadsProgress, "user B reads user A contrast progress query");
  assert(bReadsProgress.data.length === 0, "user B can read user A user_contrast_progress rows");
  const bForgesEvent = await userB.client.from("contrast_session_events").insert({
    user_id: userA.id,
    attempt_id: randomUUID(),
    contrast_id: CONTRAST_ID,
    session_total: 10,
    session_correct: 10,
    session_accuracy: 100,
  });
  assertHasError(bForgesEvent, "user B can write contrast_session_events for user A");

  // Reusing A's attempt id as B must write B's own row, never touch A's.
  assertNoError(
    await userB.client.rpc(RPC, sessionArgs({ p_attempt_id: first.p_attempt_id, p_session_correct: 2 })),
    "user B applies a session with a colliding attempt id"
  );
  const bProgress = await progressOf(userB.id);
  assert(bProgress.total_attempts === 10 && bProgress.correct_answers === 2, "user B session not isolated");
  const aFinal = await progressOf(userA.id);
  assert(aFinal.total_attempts === 50, "user B session changed user A progress");
}
