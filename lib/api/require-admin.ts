import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicErrorResponse, requireUser } from "@/lib/api/guards";

export type AdminAuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Validates the session and checks user_profiles.role === "admin".
 * Returns 401 if unauthenticated, 403 if not admin.
 */
export async function requireAdmin(request?: Request): Promise<AdminAuthResult> {
  const { user, error: authError } = await requireUser(request);
  if (authError) return { user: null, error: authError };

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { user: null, error: publicErrorResponse(403, "Forbidden") };
  }

  return { user, error: null };
}
