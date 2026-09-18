import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";
import { logServerError } from "@/lib/api/logging";

export const runtime = "nodejs";

const ProfileLevelSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "a1", "a2", "b1", "b2", "c1", "c2"]).transform(
    (val) => val.toUpperCase() as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  ),
}).strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(req);
  if (authError) return authError;

  const { limited, error: rateLimitError } = await rateLimit(`/api/profile/level:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/profile/level", userId: user.id },
  });
  if (limited) return rateLimitError;

  const { data: body, error: validationError } = await validateBody(req, ProfileLevelSchema);
  if (validationError) return validationError;

  const admin = tryGetSupabaseAdminClient();
  if (!admin) {
    return publicErrorResponse(500, "Service role client unavailable");
  }

  try {
    const { error } = await admin
      .from("user_profiles")
      .upsert({
        id: user.id,
        cefr_level: body.level,
        cefr_level_source: "manual",
        cefr_level_updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (error) throw error;
  } catch (error) {
    logServerError("Manual level update failed", error, {
      endpoint: "/api/profile/level",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to update level");
  }

  return NextResponse.json({ ok: true }, { headers: SECURE_HEADERS });
}
