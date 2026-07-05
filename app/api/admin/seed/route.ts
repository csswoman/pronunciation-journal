import { NextRequest, NextResponse } from "next/server";
import {
  publicErrorResponse,
  rateLimit,
  requireSameOrigin,
  SECURE_HEADERS,
  validateBody,
} from "@/lib/api/guards";
import { requireAdmin } from "@/lib/api/require-admin";
import { AdminSeedBodySchema } from "@/lib/admin/seed/mutation-schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/logging";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireAdmin(request);
  if (authError) return authError;

  const { limited, error: rateLimitError } = await rateLimit(`/api/admin/seed:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/admin/seed", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, AdminSeedBodySchema);
  if (validationError) return validationError;

  const supabase = await createSupabaseServerClient();
  let dbError: { code?: string } | null = null;

  switch (body.action) {
    case "insertSound":
      ({ error: dbError } = await supabase.from("sounds").insert(body.payload));
      break;
    case "insertWord":
      ({ error: dbError } = await supabase.from("words").insert(body.payload));
      break;
    case "insertPattern":
      ({ error: dbError } = await supabase.from("patterns").insert(body.payload));
      break;
    case "insertPatternWord":
      ({ error: dbError } = await supabase.from("pattern_words").insert(body.payload));
      break;
    case "insertMinimalPair":
      ({ error: dbError } = await supabase.from("minimal_pairs").insert(body.payload));
      break;
  }

  if (dbError) {
    logServerError("Admin seed insert failed", dbError, {
      endpoint: "/api/admin/seed",
      operation: body.action,
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to save seed data");
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: SECURE_HEADERS });
}
