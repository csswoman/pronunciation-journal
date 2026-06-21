import { redirect } from "next/navigation";
import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AuthenticatedRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
  }

  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
