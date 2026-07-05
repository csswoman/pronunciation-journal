import { NextRequest, NextResponse } from "next/server";
import { enqueueWordEnrichmentJob } from "@/lib/word-bank/jobs";
import {
  createUserScopedClient,
  requireSameOrigin,
  requireUser,
  SECURE_HEADERS,
  publicErrorResponse,
  rateLimit,
} from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError, accessToken } = await requireUser(req);
  if (authError) return authError;

  if (!accessToken) {
    return publicErrorResponse(401, "Authorization token is required");
  }

  const { limited, error: rateLimitError } = await rateLimit(`/api/words/${id}/enrich:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/words/[id]/enrich", userId: user.id },
  });
  if (limited) return rateLimitError;

  // Verify ownership through RLS.
  const userClient = createUserScopedClient(accessToken);
  const { data: row, error: selectErr } = await userClient
    .from("word_bank")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (selectErr) {
    logServerError("Word enrichment lookup failed", selectErr, {
      endpoint: "/api/words/[id]/enrich",
      operation: "lookup",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to load word");
  }

  if (!row) {
    return publicErrorResponse(404, "Not found");
  }

  if (row.status === "processing") {
    return NextResponse.json({ ok: true, alreadyProcessing: true });
  }

  const { error: resetErr } = await userClient
    .from("word_bank")
    .update({ status: "processing", error_reason: null })
    .eq("id", id)
    .neq("status", "processing");

  if (resetErr) {
    logServerError("Word enrichment reset failed", resetErr, {
      endpoint: "/api/words/[id]/enrich",
      operation: "reset",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to start enrichment");
  }

  const jobId = await enqueueWordEnrichmentJob(userClient, user.id, id);

  return NextResponse.json({ ok: true, jobId }, { headers: SECURE_HEADERS });
}
