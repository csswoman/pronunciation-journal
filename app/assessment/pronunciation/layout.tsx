import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServerUser } from "@/lib/supabase/session";

/**
 * Guest-friendly shell for the pronunciation diagnostic: AppShell stays
 * (sidebar / bottom nav) without requiring auth. Authenticated routes under
 * `(authenticated)` redirect guests; this layout must not.
 */
export default async function PronunciationAssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = isSupabaseConfigured() ? await getSupabaseServerUser() : null;

  return <AuthenticatedAppLayout initialUser={user}>{children}</AuthenticatedAppLayout>;
}
