import type { User } from "@supabase/supabase-js";

/** True when there is no user, or the session is a Supabase anonymous guest. */
export function isAnonymousUser(user: User | null | undefined): boolean {
  if (!user) return true;
  return Boolean((user as { is_anonymous?: boolean }).is_anonymous);
}

/** True when the user has a permanent (non-anonymous) account. */
export function isPermanentUser(user: User | null | undefined): boolean {
  return Boolean(user) && !isAnonymousUser(user);
}
