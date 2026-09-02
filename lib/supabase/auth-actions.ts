import { getSupabaseBrowserClient } from "./client";

function oauthRedirectTo(nextPath = "/") {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string,
) {
  const supabase = getSupabaseBrowserClient();
  const name = fullName?.trim();
  return supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { full_name: name } } : undefined,
  });
}

export async function signInAsGuest() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInAnonymously();
}

/** Convert an anonymous session into a permanent email account (same user id). */
export async function upgradeGuestWithEmail(
  email: string,
  password: string,
  fullName?: string,
) {
  const supabase = getSupabaseBrowserClient();
  const name = fullName?.trim();
  return supabase.auth.updateUser({
    email,
    password,
    ...(name ? { data: { full_name: name } } : {}),
  });
}

export async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: oauthRedirectTo("/") },
  });
}

/** Link Google to the current anonymous session so progress stays on the same user id. */
export async function linkGoogleIdentity() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: oauthRedirectTo("/") },
  });
}

export async function resetPasswordForEmail(email: string) {
  const supabase = getSupabaseBrowserClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login?mode=recovery")}`
      : undefined;
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.updateUser({ password });
}

export async function getBrowserSession() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.getSession();
}
