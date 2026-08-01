import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CefrLevel } from "@/lib/essential-words/types";
import { normalizeInterests, type Interest } from "@/lib/users/interests";

export interface UserPreferences {
  full_name: string;
  avatar_url: string;
  cefr_level: CefrLevel | null;
  interests: Interest[];
}

function metadataString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
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
    .select("display_name, cefr_level, interests")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return {
    full_name: data?.display_name || metadataString(authMetadata?.full_name) || "",
    avatar_url: metadataString(authMetadata?.avatar_url) || "",
    cefr_level: (data?.cefr_level as CefrLevel | null) ?? null,
    interests: normalizeInterests(Array.isArray(data?.interests) ? data.interests : []),
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

export async function updateInterests(userId: string, interests: readonly unknown[]): Promise<Interest[]> {
  const normalized = normalizeInterests(interests);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ id: userId, interests: normalized }, { onConflict: "id" });
  if (error) throw error;
  return normalized;
}
