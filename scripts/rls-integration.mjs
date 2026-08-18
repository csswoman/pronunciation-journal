import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cleanupAdditionalRlsRows, runAdditionalRlsCases } from "./rls-integration-cases.mjs";

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
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function createTempUser(label) {
  const suffix = randomUUID();
  const email = `rls-${label}-${suffix}@example.invalid`;
  const password = `Rls-${suffix}!`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assertNoError(created, `create ${label} user`);

  const signedIn = await createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).auth.signInWithPassword({ email, password });
  assertNoError(signedIn, `sign in ${label} user`);

  const user = created.data.user;
  const accessToken = signedIn.data.session?.access_token;
  assert(user?.id, `missing ${label} user id`);
  assert(accessToken, `missing ${label} access token`);

  return {
    id: user.id,
    email,
    client: clientWithToken(accessToken),
  };
}

async function cleanup(users) {
  await cleanupAdditionalRlsRows(admin, users);
  for (const user of users) {
    const wordIds =
      (await admin.from("word_bank").select("id").eq("user_id", user.id)).data?.map((row) => row.id) ?? [];
    if (wordIds.length > 0) {
      await admin.from("word_bank_decks").delete().in("word_id", wordIds);
    }
    await admin.from("word_bank").delete().eq("user_id", user.id);
    await admin.from("decks").delete().eq("user_id", user.id);
    await admin.from("stt_transcription_cache").delete().eq("user_id", user.id);
    await admin.from("sentence_transcription_cache").delete().eq("user_id", user.id);
    await admin.from("text_fragments").delete().eq("user_id", user.id);
    await admin.from("tracked_items").delete().eq("user_id", user.id);
    await admin.from("pronunciation_assessments").delete().eq("user_id", user.id);
    await admin.from("user_profiles").delete().eq("id", user.id);
    await admin.auth.admin.deleteUser(user.id);
  }
}

async function insertSingle(client, table, row, label) {
  const result = await client.from(table).insert(row).select().single();
  assertNoError(result, label);
  assert(result.data, `${label}: missing returned data`);
  return result.data;
}

async function run() {
  const users = [];
  try {
    const userA = await createTempUser("a");
    const userB = await createTempUser("b");
    users.push(userA, userB);

    const deckA = await insertSingle(
      userA.client,
      "decks",
      { user_id: userA.id, name: "RLS Deck A", description: "temporary", is_system: false },
      "user A creates own deck"
    );
    const wordA = await insertSingle(
      userA.client,
      "word_bank",
      { user_id: userA.id, text: "resilient", context: "temporary RLS test" },
      "user A creates own word"
    );
    const wordB = await insertSingle(
      userB.client,
      "word_bank",
      { user_id: userB.id, text: "boundary", context: "temporary RLS test" },
      "user B creates own word"
    );

    await insertSingle(
      userA.client,
      "word_bank_decks",
      { word_id: wordA.id, deck_id: deckA.id },
      "user A links own word to own deck"
    );

    const bReadsAWord = await userB.client.from("word_bank").select("id").eq("id", wordA.id);
    assertNoError(bReadsAWord, "user B reads user A word query");
    assert(bReadsAWord.data.length === 0, "user B can read user A word_bank row");

    const bReadsADeck = await userB.client.from("decks").select("id").eq("id", deckA.id);
    assertNoError(bReadsADeck, "user B reads user A deck query");
    assert(bReadsADeck.data.length === 0, "user B can read user A private deck");

    const bReadsALink = await userB.client.from("word_bank_decks").select("word_id").eq("word_id", wordA.id);
    assertNoError(bReadsALink, "user B reads user A word/deck link query");
    assert(bReadsALink.data.length === 0, "user B can read user A word_bank_decks row");

    const bLinksOwnWordToADeck = await userB.client
      .from("word_bank_decks")
      .insert({ word_id: wordB.id, deck_id: deckA.id });
    assertHasError(bLinksOwnWordToADeck, "user B can link own word to user A deck");

    const sttKey = `rls-stt-${randomUUID()}`;
    await insertSingle(
      userA.client,
      "stt_transcription_cache",
      {
        user_id: userA.id,
        cache_key: sttKey,
        target_word: "resilient",
        mime_type: "audio/webm",
        transcript: "resilient",
        payload_size: 10,
      },
      "user A creates own STT cache"
    );
    const bReadsStt = await userB.client.from("stt_transcription_cache").select("cache_key").eq("cache_key", sttKey);
    assertNoError(bReadsStt, "user B reads user A STT cache query");
    assert(bReadsStt.data.length === 0, "user B can read user A STT cache");

    const sentenceKey = `rls-sentence-${randomUUID()}`;
    await insertSingle(
      userA.client,
      "sentence_transcription_cache",
      {
        user_id: userA.id,
        cache_key: sentenceKey,
        mime_type: "audio/webm",
        transcript: "The boundary is clear.",
        payload_size: 10,
      },
      "user A creates own sentence transcription cache"
    );
    const bWritesSentenceForA = await userB.client.from("sentence_transcription_cache").insert({
      user_id: userA.id,
      cache_key: `rls-sentence-cross-${randomUUID()}`,
      mime_type: "audio/webm",
      transcript: "cross user",
      payload_size: 10,
    });
    assertHasError(bWritesSentenceForA, "user B can write sentence cache for user A");

    const fragmentId = randomUUID();
    await insertSingle(
      userA.client,
      "text_fragments",
      {
        id: fragmentId,
        user_id: userA.id,
        title: "RLS fragment",
        content: "A private sentence for RLS testing.",
        source: "rls-integration",
        fragment_type: "sentence",
      },
      "user A creates own text fragment"
    );
    const bReadsFragment = await userB.client.from("text_fragments").select("id").eq("id", fragmentId);
    assertNoError(bReadsFragment, "user B reads user A text fragment query");
    assert(bReadsFragment.data.length === 0, "user B can read user A text_fragments row");

    const trackedItemA = await insertSingle(
      userA.client,
      "tracked_items",
      { user_id: userA.id, kind: "phrase", ref: `rls-phrase-${randomUUID()}`, title: "RLS tracked item" },
      "user A creates own tracked item"
    );
    const bReadsTrackedItem = await userB.client.from("tracked_items").select("id").eq("id", trackedItemA.id);
    assertNoError(bReadsTrackedItem, "user B reads user A tracked item query");
    assert(bReadsTrackedItem.data.length === 0, "user B can read user A tracked_items row");

    const bWritesTrackedItemForA = await userB.client.from("tracked_items").insert({
      user_id: userA.id,
      kind: "lesson",
      ref: `rls-cross-${randomUUID()}`,
    });
    assertHasError(bWritesTrackedItemForA, "user B can write tracked item for user A");

    // pronunciation_assessments (plan 067 step 6): own-row CRUD + cross-user
    // read/write denial. No update policy exists (append-only by design —
    // see the migration comment), so only select/insert/delete are checked.
    const pronunciationAssessmentA = await insertSingle(
      userA.client,
      "pronunciation_assessments",
      {
        user_id: userA.id,
        schema_version: 1,
        result: { note: "rls-integration-fixture" },
        completed_at: new Date().toISOString(),
      },
      "user A creates own pronunciation assessment"
    );

    const aReadsOwnAssessment = await userA.client
      .from("pronunciation_assessments")
      .select("id")
      .eq("id", pronunciationAssessmentA.id);
    assertNoError(aReadsOwnAssessment, "user A reads own pronunciation assessment query");
    assert(aReadsOwnAssessment.data.length === 1, "user A cannot read own pronunciation_assessments row");

    const bReadsAssessmentA = await userB.client
      .from("pronunciation_assessments")
      .select("id")
      .eq("id", pronunciationAssessmentA.id);
    assertNoError(bReadsAssessmentA, "user B reads user A pronunciation assessment query");
    assert(bReadsAssessmentA.data.length === 0, "user B can read user A pronunciation_assessments row");

    const bWritesAssessmentForA = await userB.client.from("pronunciation_assessments").insert({
      user_id: userA.id,
      schema_version: 1,
      result: { note: "cross-user-write-attempt" },
      completed_at: new Date().toISOString(),
    });
    assertHasError(bWritesAssessmentForA, "user B can write pronunciation assessment for user A");

    const aDeletesOwnAssessment = await userA.client
      .from("pronunciation_assessments")
      .delete()
      .eq("id", pronunciationAssessmentA.id);
    assertNoError(aDeletesOwnAssessment, "user A deletes own pronunciation assessment");
    const aReadsAfterDelete = await userA.client
      .from("pronunciation_assessments")
      .select("id")
      .eq("id", pronunciationAssessmentA.id);
    assertNoError(aReadsAfterDelete, "user A reads own pronunciation assessment after delete");
    assert(aReadsAfterDelete.data.length === 0, "user A's pronunciation_assessments row survived its own delete");

    await runAdditionalRlsCases({
      userA,
      userB,
      admin,
      wordA,
      insertSingle,
      assert,
      assertNoError,
      assertHasError,
    });

    console.log("RLS integration checks passed.");
  } finally {
    await cleanup(users);
  }
}

run().catch(async (error) => {
  console.error(`RLS integration checks failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
