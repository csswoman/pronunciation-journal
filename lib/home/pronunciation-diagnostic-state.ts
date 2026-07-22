import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface HomePronunciationDiagnosticState {
  hasPronunciationDiagnostic: boolean;
}

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/**
 * Determines whether Home should promote the oral pronunciation diagnostic.
 * This is deliberately independent from CEFR placement (`hasPlacement`):
 * the pronunciation diagnostic is a separate, versioned assessment stored in
 * `pronunciation_assessments`, and must never be inferred from CEFR state
 * (including the profile's default CEFR level, which is never evidence of
 * an oral diagnostic).
 */
export async function getHomePronunciationDiagnosticState(
  userId: string,
): Promise<HomePronunciationDiagnosticState> {
  const supabase = await createSupabaseServerClient();
  const diagnostic = await supabase
    .from("pronunciation_assessments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (diagnostic.error && !isMissingTable(diagnostic.error)) throw diagnostic.error;

  return {
    hasPronunciationDiagnostic: !diagnostic.error && (diagnostic.count ?? 0) > 0,
  };
}
