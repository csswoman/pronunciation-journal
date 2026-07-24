import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PronunciationDiagnosticResultSchema } from "@/lib/pronunciation/assessment/schema";
import {
  persistPronunciationAssessmentServer,
  PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION,
} from "@/lib/pronunciation/assessment/persistence-server";

export const runtime = "nodejs";

/**
 * Request wrapper: the diagnostic result plus the client-generated row `id`
 * used for idempotent retries (see persistence-server.ts). `schemaVersion`
 * is optional and defaults to the current version — clients don't need to
 * know it, but the offline/outbox path may pin the version it captured the
 * result under.
 */
export const PronunciationAssessmentRequestSchema = z
  .object({
    id: z.string().uuid(),
    schemaVersion: z.number().int().positive().optional(),
    result: PronunciationDiagnosticResultSchema,
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(req);
  if (authError) return authError;

  const { limited, error: rateLimitError } = await rateLimit(`/api/pronunciation-assessment:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/pronunciation-assessment", userId: user.id },
  });
  if (limited) return rateLimitError;

  const { data: body, error: validationError } = await validateBody(req, PronunciationAssessmentRequestSchema);
  if (validationError) return validationError;

  if (body.result.userId !== user.id) {
    return publicErrorResponse(403, "Result userId does not match the authenticated user");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const outcome = await persistPronunciationAssessmentServer(supabase, {
      id: body.id,
      userId: user.id,
      result: body.result,
      schemaVersion: body.schemaVersion ?? PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION,
    });

    if (!outcome.ok) {
      if (outcome.error === "invalid_result") {
        return publicErrorResponse(400, "Invalid diagnostic result");
      }
      if (outcome.error === "user_mismatch") {
        return publicErrorResponse(403, "Result userId does not match the authenticated user");
      }
      throw new Error(outcome.detail ?? "Failed to persist pronunciation assessment");
    }
  } catch (error) {
    logServerError("Pronunciation assessment save failed", error, {
      endpoint: "/api/pronunciation-assessment",
      operation: "persistPronunciationAssessmentServer",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to save pronunciation assessment");
  }

  return NextResponse.json({ ok: true }, { headers: SECURE_HEADERS });
}
