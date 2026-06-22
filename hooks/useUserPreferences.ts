"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getUserPreferences,
  updateDisplayName,
  updateAvatar as updateAvatarQuery,
  updatePassword as updatePasswordQuery,
  syncCefrLevel,
} from "@/lib/users/queries";
import type { CefrLevel } from "@/lib/core-1000/types";

export interface UserPreferencesData {
  full_name?: string;
  avatar_url?: string;
  cefr_level?: CefrLevel | null;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const prefs = await getUserPreferences(user.id, user.user_metadata);
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void loadPreferences();
  }, [user?.id, loadPreferences]);

  const updateFullName = useCallback(
    async (fullName: string) => {
      if (!user) return;

      try {
        await updateDisplayName(user.id, fullName);
        setPreferences((prev) => ({ ...prev, full_name: fullName }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user],
  );

  const updateAvatar = useCallback(
    async (file: File) => {
      if (!user) return;

      try {
        const avatarUrl = await updateAvatarQuery(user.id, file);
        setPreferences((prev) => ({ ...prev, avatar_url: avatarUrl }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user],
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      if (!user) return;

      try {
        await updatePasswordQuery(newPassword);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user],
  );

  const updateCefrLevel = useCallback(
    async (level: CefrLevel) => {
      if (!user) return;
      try {
        await syncCefrLevel(user.id, level);
        setPreferences((prev) => ({ ...prev, cefr_level: level }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      }
    },
    [user],
  );

  return {
    preferences,
    loading,
    error,
    updateFullName,
    updateAvatar,
    updatePassword,
    updateCefrLevel,
  };
}
