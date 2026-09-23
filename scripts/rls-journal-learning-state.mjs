import { randomUUID } from "node:crypto";

export async function runJournalLearningStateRlsCases(ctx) {
  const { userA, userB, insertSingle, assert, assertNoError, assertHasError } = ctx;
  const entry = await insertSingle(userA.client, "journal_entries", {
    id: randomUUID(),
    user_id: userA.id,
    entry_date: "2099-11-01",
    prompt: "RLS correction",
    content: "temporary",
    status: "submitted",
  }, "user A creates journal correction entry");

  const correctionArgs = {
    p_user_id: userA.id,
    p_entry_id: entry.id,
    p_corrected_content: "I used an article.",
    p_feedback: { errors: [], newWords: [] },
    p_pattern_ids: ["article_use"],
    p_initial_state: { userId: userA.id, errorRecurrence: { entries: [] } },
  };
  const correction = await userA.client.rpc("apply_journal_correction", correctionArgs);
  assertNoError(correction, "user A applies journal correction atomically");
  assert(correction.data?.applied === true, "user A journal correction was not applied");

  const aReads = await userA.client.from("journal_error_pattern_events").select("entry_id").eq("entry_id", entry.id);
  assertNoError(aReads, "user A reads own journal pattern event");
  assert(aReads.data.length === 1, "user A cannot read own journal pattern event");
  const bReads = await userB.client.from("journal_error_pattern_events").select("entry_id").eq("entry_id", entry.id);
  assertNoError(bReads, "user B reads journal pattern event query");
  assert(bReads.data.length === 0, "user B can read user A journal pattern event");
  const directWrite = await userA.client.from("journal_error_pattern_events").insert({
    user_id: userA.id,
    entry_id: entry.id,
    pattern_id: "spelling",
  });
  assertHasError(directWrite, "authenticated user can directly write journal pattern events");

  const retry = await userA.client.rpc("apply_journal_correction", {
    ...correctionArgs,
    p_corrected_content: "duplicate",
  });
  assertNoError(retry, "retry journal correction");
  assert(retry.data?.applied === false, "retry re-applied an already corrected entry");

  const staleJournalSnapshot = await userA.client.from("journal_entries").upsert({
    id: entry.id,
    user_id: userA.id,
    entry_date: entry.entry_date,
    prompt: entry.prompt,
    content: "stale submitted snapshot",
    status: "submitted",
  }, { onConflict: "id" }).select("status, corrected_content").single();
  assertNoError(staleJournalSnapshot, "sync stale journal entry snapshot");
  assert(
    staleJournalSnapshot.data.status === "corrected" && staleJournalSnapshot.data.corrected_content === "I used an article.",
    "stale journal outbox snapshot undid the confirmed correction"
  );

  const delayedOutbox = await userA.client.rpc("merge_user_learning_state_snapshot", {
    p_user_id: userA.id,
    p_state: { userId: userA.id, updatedAt: "2020-01-01T00:00:00.000Z", errorRecurrence: { entries: [] } },
    p_updated_at: "2020-01-01T00:00:00.000Z",
  });
  assertNoError(delayedOutbox, "merge delayed learning-state outbox snapshot");

  const secondDevice = await userA.client.rpc("merge_user_learning_state_snapshot", {
    p_user_id: userA.id,
    p_state: {
      userId: userA.id,
      updatedAt: "2099-01-01T00:00:00.000Z",
      deviceId: "second-device",
      errorRecurrence: { entries: [] },
    },
    p_updated_at: "2099-01-01T00:00:00.000Z",
  });
  assertNoError(secondDevice, "merge second-device learning state");
  assert(
    secondDevice.data?.errorRecurrence.entries.some((item) => item.patternId === "article_use" && item.failCount === 1),
    "a device snapshot erased or duplicated journal recurrence"
  );

  const foreignCorrection = await userA.client.rpc("apply_journal_correction", {
    ...correctionArgs,
    p_user_id: userB.id,
    p_initial_state: { userId: userB.id },
  });
  assertHasError(foreignCorrection, "user A can apply journal correction as user B");
}
