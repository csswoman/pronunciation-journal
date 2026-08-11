import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServerUser } from "@/lib/supabase/session";

export default async function AuthenticatedRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    const user = await getSupabaseServerUser();
    // No hard redirect to /login — GuestSessionBootstrap (via AuthProvider)
    // creates an anonymous session, or sends the user to explore-first login.
    return (
      <AuthenticatedAppLayout initialUser={user}>
        {children}
      </AuthenticatedAppLayout>
    );
  }

  return <AuthenticatedAppLayout initialUser={null}>{children}</AuthenticatedAppLayout>;
}
