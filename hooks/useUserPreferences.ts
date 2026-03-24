"use client";

import { useState, useCallback, useEffect } from "react";
import type { UserPreferences } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const DEFAULT_PREFERENCES: Omit<UserPreferences, "user_id" | "id"> = {
  accent: "american",
  theme_mode: "auto",
  accent_color: "blue",
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadPreferences();
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error: fetchError } = await supabase
        .from("user_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (data) {
        setPreferences(data as unknown as UserPreferences);
      } else {
        // Create default preferences
        const newPrefs = {
          user_id: user.id,
          ...DEFAULT_PREFERENCES,
        };

        const { data: created, error: createError } = await supabase
          .from("user_preferences" as any)
          .insert([newPrefs])
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(created as unknown as UserPreferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!user || !preferences) return;

      try {
        const supabase = getSupabaseBrowserClient();

        const { data, error } = await supabase
          .from("user_preferences" as any)
          .update(updates)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        setPreferences(data as unknown as UserPreferences);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user, preferences]
  );

  const updateFullName = useCallback(
    async (fullName: string) => {
      if (!user) return;

      try {
        const supabase = getSupabaseBrowserClient();

        // Update Supabase auth metadata
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: fullName },
        });

        if (authError) throw authError;

        // Update preferences
        return updatePreferences({ full_name: fullName });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user, updatePreferences]
  );

  const updateAvatar = useCallback(
    async (file: File) => {
      if (!user) return;

      try {
        const supabase = getSupabaseBrowserClient();
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from("user-uploads")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from("user-uploads")
          .getPublicUrl(filePath);

        const avatarUrl = data.publicUrl;

        // Update preferences
        return updatePreferences({ avatar_url: avatarUrl });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user, updatePreferences]
  );

  const updateAccent = useCallback(
    async (accent: "american" | "british" | "neutral") => {
      return updatePreferences({ accent });
    },
    [updatePreferences]
  );

  const updateThemeMode = useCallback(
    async (themeMode: "light" | "dark" | "auto") => {
      return updatePreferences({ theme_mode: themeMode });
    },
    [updatePreferences]
  );

  const updateAccentColor = useCallback(
    async (accentColor: string) => {
      return updatePreferences({ accent_color: accentColor });
    },
    [updatePreferences]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      if (!user) return;

      try {
        const supabase = getSupabaseBrowserClient();

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

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
    updatePreferences,
    updateFullName,
    updateAvatar,
    updateAccent,
    updateThemeMode,
    updateAccentColor,
    updatePassword,
  };
}
