import { getSupabaseBrowserClient } from "./client";

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signUp({ email, password });
}

export async function signInAsGuest() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInAnonymously();
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
}

export async function resetPasswordForEmail(email: string) {
  const supabase = getSupabaseBrowserClient();
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}
