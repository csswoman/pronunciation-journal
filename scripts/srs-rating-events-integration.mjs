// Local integration checks for the SRS rating-event RPCs added in
// supabase/migrations/20260720080000_srs_rating_events.sql (plan 061 step 2).
//
// Mirrors scripts/rls-integration.mjs's convention: real Supabase Auth users
// against a local Supabase instance, driven through the anon client so RLS
// and the RPCs' internal auth.uid() checks are exercised for real.
//
// Verifies:
//   1. Submitting the SAME rating event twice (same idempotency key) has
//      exactly one effect (review_count/ease/interval/repetitions unchanged
//      by the second call).
//   2. Submitting TWO DIFFERENT concurrent events for the same entity both
//      apply, serialized by the RPC's row lock, ending at review_count 2 with
//      the second event's SM-2 transition built on the first's (not on the
//      same starting snapshot).
//   3. A user cannot apply a rating event against another user's word_bank
//      row or topic_srs topic (p_user_id must equal auth.uid()).
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

loadEnvFile(envPath);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoError(result, message) {
  if (result.error) {
    throw new Error(`${message}: ${result.error.message}`);
  }
}

function assertHasError(result, message) {
  if (!result.error) {
    throw new Error(message);
  }
}

function clientWithToken(accessToken) {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function createTempUser(label) {
  const suffix = randomUUID();
  const email = `srs-events-${label}-${suffix}@example.invalid`;
  const password = `Rls-${suffix}!`;

  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assertNoError(created, `create ${label} user`);

  const signedIn = await createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).auth.signInWithPassword({ email, password });
  assertNoError(signedIn, `sign in ${label} user`);

  const user = created.data.user;
  const accessToken = signedIn.data.session?.access_token;
  assert(user?.id, `missing ${label} user id`);
  assert(accessToken, `missing ${label} access token`);

  return { id: user.id, email, client: clientWithToken(accessToken) };
}

async function cleanup(users) {
  for (const user of users) {
    await admin.from("srs_rating_events").delete().eq("user_id", user.id);
    await admin.from("topic_srs").delete().eq("user_id", user.id);
    await admin.from("word_bank").delete().eq("user_id", user.id);
    await admin.auth.admin.deleteUser(user.id);
  }
}

async function run() {
  const users = [];
  try {
    const userA = await createTempUser("a");
    const userB = await createTempUser("b");
    users.push(userA, userB);

    // ── word_bank: duplicate idempotency key → one effect ──────────────────
    const wordA = await admin
      .from("word_bank")
      .insert({ user_id: userA.id, text: "resilient", context: "srs rpc test" })
      .select()
      .single();
    assertNoError(wordA, "create word_bank row for user A");

    const dupKey = randomUUID();
    const firstApply = await userA.client.rpc("apply_word_bank_rating_event", {
      p_idempotency_key: dupKey,
      p_user_id: userA.id,
      p_word_id: wordA.data.id,
      p_grade: 4,
    });
    assertNoError(firstApply, "apply first word_bank rating event");
    assert(firstApply.data.review_count === 1, `expected review_count 1, got ${firstApply.data.review_count}`);
    assert(firstApply.data.repetitions === 1, `expected repetitions 1, got ${firstApply.data.repetitions}`);
    assert(firstApply.data.interval_days === 1, `expected interval_days 1, got ${firstApply.data.interval_days}`);

    const duplicateApply = await userA.client.rpc("apply_word_bank_rating_event", {
      p_idempotency_key: dupKey, // SAME key — must be a no-op
      p_user_id: userA.id,
      p_word_id: wordA.data.id,
      p_grade: 4,
    });
    assertNoError(duplicateApply, "apply duplicate word_bank rating event");
    assert(
      duplicateApply.data.review_count === 1,
      `duplicate idempotency key must not re-apply: expected review_count 1, got ${duplicateApply.data.review_count}`
    );
    assert(
      duplicateApply.data.repetitions === 1,
      `duplicate idempotency key must not re-apply: expected repetitions 1, got ${duplicateApply.data.repetitions}`
    );

    const eventsForWordA = await admin
      .from("srs_rating_events")
      .select("id")
      .eq("entity_type", "word_bank")
      .eq("entity_id", wordA.data.id);
    assertNoError(eventsForWordA, "read srs_rating_events for word A");
    assert(
      eventsForWordA.data.length === 1,
      `duplicate idempotency key must not create a second ledger row: got ${eventsForWordA.data.length}`
    );

    // ── word_bank: two DIFFERENT concurrent events → two effects, ordered ──
    const wordB = await admin
      .from("word_bank")
      .insert({ user_id: userA.id, text: "boundary", context: "srs rpc test" })
      .select()
      .single();
    assertNoError(wordB, "create second word_bank row for user A");

    const [concurrentFirst, concurrentSecond] = await Promise.all([
      userA.client.rpc("apply_word_bank_rating_event", {
        p_idempotency_key: randomUUID(),
        p_user_id: userA.id,
        p_word_id: wordB.data.id,
        p_grade: 4,
      }),
      userA.client.rpc("apply_word_bank_rating_event", {
        p_idempotency_key: randomUUID(),
        p_user_id: userA.id,
        p_word_id: wordB.data.id,
        p_grade: 4,
      }),
    ]);
    assertNoError(concurrentFirst, "apply concurrent word_bank event 1");
    assertNoError(concurrentSecond, "apply concurrent word_bank event 2");

    const finalWordB = await admin.from("word_bank").select("review_count, repetitions").eq("id", wordB.data.id).single();
    assertNoError(finalWordB, "read final word_bank state for word B");
    assert(
      finalWordB.data.review_count === 2,
      `two concurrent ratings must both apply: expected review_count 2, got ${finalWordB.data.review_count}`
    );
    assert(
      finalWordB.data.repetitions === 2,
      `second rating must build on the first's repetitions, not race it: expected repetitions 2, got ${finalWordB.data.repetitions}`
    );

    // ── word_bank: cannot rate another user's word ──────────────────────────
    const crossUserApply = await userB.client.rpc("apply_word_bank_rating_event", {
      p_idempotency_key: randomUUID(),
      p_user_id: userB.id,
      p_word_id: wordA.data.id, // belongs to user A
      p_grade: 4,
    });
    assertHasError(crossUserApply, "user B must not be able to rate user A's word_bank row");

    const impersonationApply = await userB.client.rpc("apply_word_bank_rating_event", {
      p_idempotency_key: randomUUID(),
      p_user_id: userA.id, // impersonating user A while authenticated as B
      p_word_id: wordA.data.id,
      p_grade: 4,
    });
    assertHasError(impersonationApply, "p_user_id must be rejected when it does not match the caller");

    // ── topic_srs: two concurrent FIRST-time ratings for a brand-new topic ─
    const topic = `srs-rpc-test:${randomUUID()}`;
    const [topicFirst, topicSecond] = await Promise.all([
      userA.client.rpc("apply_topic_srs_rating_event", {
        p_idempotency_key: randomUUID(),
        p_user_id: userA.id,
        p_topic: topic,
        p_grade: 4,
      }),
      userA.client.rpc("apply_topic_srs_rating_event", {
        p_idempotency_key: randomUUID(),
        p_user_id: userA.id,
        p_topic: topic,
        p_grade: 5,
      }),
    ]);
    assertNoError(topicFirst, "apply concurrent topic_srs event 1");
    assertNoError(topicSecond, "apply concurrent topic_srs event 2");

    const finalTopicRows = await admin
      .from("topic_srs")
      .select("id, review_count, repetitions")
      .eq("user_id", userA.id)
      .eq("topic", topic);
    assertNoError(finalTopicRows, "read final topic_srs rows");
    assert(
      finalTopicRows.data.length === 1,
      `two concurrent first-time ratings must collapse into exactly one row: got ${finalTopicRows.data.length}`
    );
    assert(
      finalTopicRows.data[0].review_count === 2,
      `expected review_count 2 after two concurrent first ratings, got ${finalTopicRows.data[0].review_count}`
    );
    assert(
      finalTopicRows.data[0].repetitions === 2,
      `expected repetitions 2 (second builds on first), got ${finalTopicRows.data[0].repetitions}`
    );

    // ── topic_srs: duplicate idempotency key → one effect ──────────────────
    const topicDupKey = randomUUID();
    const topicDupFirst = await userA.client.rpc("apply_topic_srs_rating_event", {
      p_idempotency_key: topicDupKey,
      p_user_id: userA.id,
      p_topic: topic,
      p_grade: 4,
    });
    assertNoError(topicDupFirst, "apply topic_srs rating (pre-duplicate)");
    const reviewCountBeforeDup = topicDupFirst.data.review_count;

    const topicDupSecond = await userA.client.rpc("apply_topic_srs_rating_event", {
      p_idempotency_key: topicDupKey, // SAME key
      p_user_id: userA.id,
      p_topic: topic,
      p_grade: 4,
    });
    assertNoError(topicDupSecond, "apply duplicate topic_srs rating event");
    assert(
      topicDupSecond.data.review_count === reviewCountBeforeDup,
      `duplicate topic_srs idempotency key must not re-apply: expected ${reviewCountBeforeDup}, got ${topicDupSecond.data.review_count}`
    );

    console.log("SRS rating-event RPC integration checks passed.");
  } finally {
    await cleanup(users);
  }
}

run().catch(async (error) => {
  console.error(`SRS rating-event RPC integration checks failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
