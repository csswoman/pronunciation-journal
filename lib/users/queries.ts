import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CefrLevel } from "@/lib/core-1000/types";

export type UserRole = "free" | "premium" | "admin";

export interface UserProfile {
  display_name: string | null;
  role: UserRole;
  cefr_level: string | null;
}

export interface UserPreferences {
  full_name: string;
  avatar_url: string;
  cefr_level: CefrLevel | null;
}

function parseUserRole(role: string | null | undefined): UserRole {
  if (role === "premium" || role === "admin") return role;
  return "free";
}

function metadataString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Profile row for a user. Returns null when no row exists yet. */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, role, cefr_level")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    display_name: data.display_name,
    role: parseUserRole(data.role),
    cefr_level: data.cefr_level,
  };
}

/** Role for a user; defaults to `"free"` when profile is missing or unreadable. */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role ?? "free";
  } catch {
    return "free";
  }
}

/**
 * Display preferences merged from `user_profiles.display_name` and auth metadata.
 * Auth metadata supplies fallbacks for name and avatar URL.
 */
export async function getUserPreferences(
  userId: string,
  authMetadata?: Record<string, unknown> | null,
): Promise<UserPreferences> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, cefr_level")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return {
    full_name: data?.display_name || metadataString(authMetadata?.full_name) || "",
    avatar_url: metadataString(authMetadata?.avatar_url) || "",
    cefr_level: (data?.cefr_level as CefrLevel | null) ?? null,
  };
}

/** Updates display name in `user_profiles` and auth user metadata. */
export async function updateDisplayName(userId: string, fullName: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ display_name: fullName })
    .eq("id", userId);

  if (profileError) throw profileError;

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (authError) throw authError;
}

/** Uploads avatar to storage and persists the public URL in auth metadata. */
export async function updateAvatar(userId: string, file: File): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = data.publicUrl;

  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (authError) throw authError;

  return avatarUrl;
}

/** Updates the authenticated user's password. */
export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Best-effort: persists the local CEFR estimate to user_profiles. */
export async function syncCefrLevel(userId: string, cefrEstimate: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ id: userId, cefr_level: cefrEstimate }, { onConflict: "id" });

  if (error) throw error;
}
