import "server-only";
import type { Json } from "@/lib/supabase/types";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";

export interface StoredAssessmentOralAttempt {
  id: string;
  user_id: string;
  level: string;
  answers: Json;
  self_ratings: Json;
  status: string;
  challenge_id: string | null;
  item_id: string | null;
  used_item_ids: string[];
  challenge_expires_at: string | null;
  expires_at: string;
  oral_audio_sha256: string | null;
  rubric_version: string | null;
  created_at: string;
  completed_at: string | null;
}

export function parseAssessmentOralAnswers(value: Json): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Saved oral checkpoint answers are invalid");
  }
  const answers = Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] =>
    typeof entry[1] === "number" && Number.isInteger(entry[1]),
  ));
  if (Object.keys(answers).length !== Object.keys(value).length) {
    throw new Error("Saved oral checkpoint answers are invalid");
  }
  return answers;
}

function getAdmin() {
  const admin = tryGetSupabaseAdminClient();
  if (!admin) throw new Error("Supabase admin client unavailable for oral assessment");
  return admin;
}

export async function createAssessmentOralAttempt(input: {
  id: string;
  userId: string;
  level: "a1" | "a2";
  answers: Record<string, number>;
  expiresAt: string;
}): Promise<StoredAssessmentOralAttempt> {
  const { data, error } = await getAdmin()
    .from("assessment_oral_attempts")
    .insert({
      id: input.id,
      user_id: input.userId,
      level: input.level,
      answers: input.answers,
      self_ratings: {},
      status: "oral_pending",
      expires_at: input.expiresAt,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function findPendingAssessmentOralAttempt(
  userId: string,
  level: "a1" | "a2",
  now: string,
): Promise<StoredAssessmentOralAttempt | null> {
  const { data, error } = await getAdmin()
    .from("assessment_oral_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("level", level)
    .eq("status", "oral_pending")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function recoverExpiredAssessmentOralChallenges(
  userId: string,
  level: "a1" | "a2",
  now: string,
): Promise<void> {
  const { error } = await getAdmin()
    .from("assessment_oral_attempts")
    .update({ status: "oral_pending", challenge_id: null, item_id: null, challenge_expires_at: null })
    .eq("user_id", userId)
    .eq("level", level)
    .eq("status", "oral_processing")
    .lte("challenge_expires_at", now);
  if (error) throw error;
}

export async function getAssessmentOralAttempt(
  userId: string,
  attemptId: string,
): Promise<StoredAssessmentOralAttempt | null> {
  const { data, error } = await getAdmin()
    .from("assessment_oral_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", attemptId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function issueAssessmentOralChallenge(input: {
  userId: string;
  attemptId: string;
  itemId: string;
  challengeId: string;
  challengeExpiresAt: string;
  now: string;
}): Promise<StoredAssessmentOralAttempt | null> {
  const current = await getAssessmentOralAttempt(input.userId, input.attemptId);
  if (!current || current.status !== "oral_pending" || current.expires_at <= input.now) return null;
  const usedItemIds = [...new Set([...current.used_item_ids, input.itemId])];
  const challengeUpdate = getAdmin()
    .from("assessment_oral_attempts")
    .update({
      challenge_id: input.challengeId,
      item_id: input.itemId,
      challenge_expires_at: input.challengeExpiresAt,
      used_item_ids: usedItemIds,
    })
    .eq("user_id", input.userId)
    .eq("id", input.attemptId)
    .eq("status", "oral_pending")
    .gt("expires_at", input.now);
  const compareAndSet = current.challenge_id
    ? challengeUpdate.eq("challenge_id", current.challenge_id)
    : challengeUpdate.is("challenge_id", null);
  const { data, error } = await compareAndSet.select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function claimAssessmentOralChallenge(input: {
  userId: string;
  attemptId: string;
  challengeId: string;
  now: string;
}): Promise<StoredAssessmentOralAttempt | null> {
  const { data, error } = await getAdmin()
    .from("assessment_oral_attempts")
    .update({ status: "oral_processing" })
    .eq("user_id", input.userId)
    .eq("id", input.attemptId)
    .eq("challenge_id", input.challengeId)
    .eq("status", "oral_pending")
    .gt("challenge_expires_at", input.now)
    .gt("expires_at", input.now)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function resetAssessmentOralChallenge(input: {
  userId: string;
  attemptId: string;
  challengeId: string;
}): Promise<void> {
  const { error } = await getAdmin()
    .from("assessment_oral_attempts")
    .update({
      status: "oral_pending",
      challenge_id: null,
      item_id: null,
      challenge_expires_at: null,
    })
    .eq("user_id", input.userId)
    .eq("id", input.attemptId)
    .eq("challenge_id", input.challengeId)
    .eq("status", "oral_processing");
  if (error) throw error;
}

export async function releaseAssessmentOralChallenge(input: {
  userId: string;
  attemptId: string;
  challengeId: string;
}): Promise<void> {
  const { error } = await getAdmin()
    .from("assessment_oral_attempts")
    .update({ status: "oral_pending" })
    .eq("user_id", input.userId)
    .eq("id", input.attemptId)
    .eq("challenge_id", input.challengeId)
    .eq("status", "oral_processing");
  if (error) throw error;
}

export async function acceptAssessmentOralEvidence(input: {
  userId: string;
  attemptId: string;
  challengeId: string;
  audioSha256: string;
  rubricVersion: "a1-a2-pilot-v1";
  completedAt: string;
}): Promise<{ attempt: StoredAssessmentOralAttempt | null; errorCode?: string }> {
  const { data, error } = await getAdmin()
    .from("assessment_oral_attempts")
    .update({
      status: "oral_passed",
      oral_audio_sha256: input.audioSha256,
      rubric_version: input.rubricVersion,
      completed_at: input.completedAt,
    })
    .eq("user_id", input.userId)
    .eq("id", input.attemptId)
    .eq("challenge_id", input.challengeId)
    .eq("status", "oral_processing")
    .select("*")
    .maybeSingle();
  if (error) return { attempt: null, errorCode: error.code };
  return { attempt: data };
}

export async function markAssessmentOralAttemptCompleted(
  userId: string,
  attemptId: string,
): Promise<void> {
  const { error } = await getAdmin()
    .from("assessment_oral_attempts")
    .update({ status: "completed" })
    .eq("user_id", userId)
    .eq("id", attemptId)
    .eq("status", "oral_passed");
  if (error) throw error;
}

export async function pruneExpiredAssessmentOralAttempts(userId: string, now: string): Promise<void> {
  const { error } = await getAdmin()
    .from("assessment_oral_attempts")
    .delete()
    .eq("user_id", userId)
    .lt("expires_at", now);
  if (error) throw error;
}
