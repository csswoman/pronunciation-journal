import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "./queries";

export type AdminBootstrapResult =
  | { ok: true; promoted: boolean }
  | { ok: false; reason: string };

function getBootstrapEmail(): string | null {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  return email ? email : null;
}

/** Best-effort admin bootstrap by email, controlled by env and server-only access. */
export async function bootstrapAdminRole(): Promise<AdminBootstrapResult> {
  const email = getBootstrapEmail();
  if (!email) {
    return { ok: false, reason: "ADMIN_BOOTSTRAP_EMAIL is not configured" };
  }

  const supabase = getSupabaseAdminClient();
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    return { ok: false, reason: usersError.message };
  }

  const user = users.users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { ok: false, reason: `No auth user found for ${email}` };
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert({ id: user.id, role: "admin" satisfies UserRole }, { onConflict: "id" });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true, promoted: true };
}
