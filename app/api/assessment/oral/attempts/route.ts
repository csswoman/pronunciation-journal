import { randomInt, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";
import { AssessmentOralAttemptRequestSchema } from "@/lib/courses/assessment-schema";
import { scoreAssessment } from "@/lib/courses/assessment";
import { getAssessmentProfileLevel, persistAssessmentOutcome } from "@/lib/courses/assessment-queries";
import { buildServerAssessment } from "@/lib/courses/server-assessment";
import {
  createAssessmentOralAttempt,
  findPendingAssessmentOralAttempt,
  getAssessmentOralAttempt,
  issueAssessmentOralChallenge,
  pruneExpiredAssessmentOralAttempts,
} from "@/lib/courses/assessment-oral-queries";
import { getAssessmentOralTasks } from "@/lib/courses/assessment-oral-tasks";
import { ASSESSMENT_ORAL_ATTEMPT_TTL_MS, ASSESSMENT_ORAL_CHALLENGE_TTL_MS } from "@/lib/courses/assessment-oral-shared";
import type { CefrLevelId } from "@/lib/courses/types";

export const runtime = "nodejs";

async function checkpointIsAvailable(userId: string, level: "a1" | "a2"): Promise<boolean> {
  const currentLevel = (await getAssessmentProfileLevel(userId)) as CefrLevelId;
  const order: CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1", "c2"];
  const currentIndex = order.indexOf(currentLevel);
  const targetIndex = order.indexOf(level);
  return targetIndex >= 0
    && targetIndex >= (currentIndex >= 0 ? currentIndex : 0)
    && targetIndex - (currentIndex >= 0 ? currentIndex : 0) <= 1;
}

function answerSetIsValid(
  answers: Record<string, number>,
  questions: Array<{ id: string; options: string[] }>,
): boolean {
  return Object.keys(answers).length === questions.length
    && questions.every((question) => {
      const selected = answers[question.id];
      return Number.isInteger(selected) && selected >= 0 && selected < question.options.length;
    })
    && Object.keys(answers).every((questionId) => questions.some((question) => question.id === questionId));
}

function challengeResponse(attempt: {
  id: string;
  level: string;
  used_item_ids: string[];
}, prompt: string, challengeId: string, expiresAt: string) {
  return NextResponse.json({
    attemptId: attempt.id,
    challenge: { id: challengeId, level: attempt.level, prompt, expiresAt },
  }, { headers: SECURE_HEADERS });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError;
  const level = request.nextUrl.searchParams.get("level");
  if (level !== "a1" && level !== "a2") return publicErrorResponse(400, "Unsupported oral checkpoint level");

  try {
    const now = new Date().toISOString();
    const attempt = await findPendingAssessmentOralAttempt(user.id, level, now);
    return NextResponse.json({ attemptId: attempt?.id ?? null }, { headers: SECURE_HEADERS });
  } catch (error) {
    logServerError("Oral checkpoint lookup failed", error, { endpoint: "/api/assessment/oral/attempts", userId: user.id });
    return publicErrorResponse(503, "Could not check for a saved oral checkpoint");
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError;
  const { limited, error: rateLimitError } = await rateLimit(`/api/assessment/oral/attempts:${user.id}`, {
    max: 20,
    windowMs: 60_000,
    meta: { endpoint: "/api/assessment/oral/attempts", userId: user.id },
  });
  if (limited) return rateLimitError;
  const { data: body, error: validationError } = await validateBody(request, AssessmentOralAttemptRequestSchema);
  if (validationError) return validationError;

  try {
    const nowDate = new Date();
    const now = nowDate.toISOString();
    let attempt;

    if (body.assessmentAttemptId) {
      attempt = await getAssessmentOralAttempt(user.id, body.assessmentAttemptId);
      if (!attempt) return publicErrorResponse(404, "Saved oral checkpoint not found");
      if (attempt.level !== body.level) return publicErrorResponse(400, "Oral checkpoint level mismatch");
      if (attempt.status !== "oral_pending" || attempt.expires_at <= now) {
        return publicErrorResponse(409, "Saved oral checkpoint is no longer pending");
      }
    } else {
      if (!body.answers) return publicErrorResponse(400, "Answers required");
      if (!await checkpointIsAvailable(user.id, body.level)) {
        return publicErrorResponse(400, "Checkpoint level exceeds allowed progression limit");
      }
      await pruneExpiredAssessmentOralAttempts(user.id, now);
      const existing = await findPendingAssessmentOralAttempt(user.id, body.level, now);
      if (existing) {
        return NextResponse.json({ error: "An oral checkpoint is already pending", attemptId: existing.id }, { status: 409, headers: SECURE_HEADERS });
      }

      const { questions } = buildServerAssessment("checkpoint", body.level);
      if (!answerSetIsValid(body.answers, questions)) return publicErrorResponse(400, "Assessment answers were incomplete or invalid");
      const result = scoreAssessment(questions, body.answers, "checkpoint", body.level);
      const levelScore = result.levelScores?.find((item) => item.level === body.level);
      if (!levelScore?.writtenListeningMet) {
        await persistAssessmentOutcome(user.id, "checkpoint", result, body.level);
        return NextResponse.json({ eligible: false, result }, { headers: SECURE_HEADERS });
      }
      attempt = await createAssessmentOralAttempt({
        id: randomUUID(),
        userId: user.id,
        level: body.level,
        answers: body.answers,
        expiresAt: new Date(nowDate.getTime() + ASSESSMENT_ORAL_ATTEMPT_TTL_MS).toISOString(),
      });
    }

    const tasks = getAssessmentOralTasks(body.level);
    const unused = tasks.filter((task) => !attempt.used_item_ids.includes(task.id));
    const candidates = unused.length > 0 ? unused : tasks;
    const task = candidates[randomInt(candidates.length)];
    const challengeId = randomUUID();
    const challengeExpiresAt = new Date(nowDate.getTime() + ASSESSMENT_ORAL_CHALLENGE_TTL_MS).toISOString();
    const issued = await issueAssessmentOralChallenge({
      userId: user.id,
      attemptId: attempt.id,
      itemId: task.id,
      challengeId,
      challengeExpiresAt,
      now,
    });
    if (!issued) return publicErrorResponse(409, "Oral checkpoint changed; retry to continue");
    return challengeResponse(issued, task.prompt, challengeId, challengeExpiresAt);
  } catch (error) {
    logServerError("Oral checkpoint start failed", error, { endpoint: "/api/assessment/oral/attempts", userId: user.id });
    return publicErrorResponse(503, "Could not start the oral checkpoint");
  }
}
