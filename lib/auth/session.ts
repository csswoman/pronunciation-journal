import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export class NotAuthenticatedError extends Error {
  readonly code = "NOT_AUTHENTICATED";

  constructor() {
    super("Not authenticated");
  }
}

/** Returns the current browser session access token. */
export async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new NotAuthenticatedError();
  return session.access_token;
}

/** Returns the current browser session user, or null if unauthenticated. */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await getSupabaseBrowserClient().auth.getUser();
  return user;
}
