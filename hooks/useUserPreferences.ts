"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface UserPreferencesData {
  full_name?: string;
  avatar_url?: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      setPreferences({
        full_name: data?.display_name || user.user_metadata?.full_name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateFullName = useCallback(
    async (fullName: string) => {
      if (!user) return;

      try {
        const supabase = getSupabaseBrowserClient();

        // Update user_profiles.display_name
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ display_name: fullName })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Update auth metadata
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        if (authError) throw authError;

        setPreferences((prev) => ({ ...prev, full_name: fullName }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user]
  );

  const updateAvatar = useCallback(
    async (file: File) => {
      if (!user) return;

      try {
        const supabase = getSupabaseBrowserClient();
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { contentType: file.type, upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const avatarUrl = data.publicUrl;

        // Save to auth metadata (persists across sessions)
        const { error: authError } = await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });

        if (authError) throw authError;

        setPreferences((prev) => ({ ...prev, avatar_url: avatarUrl }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      if (!user) return;

      try {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user]
  );

  return {
    preferences,
    loading,
    error,
    updateFullName,
    updateAvatar,
    updatePassword,
  };
}
