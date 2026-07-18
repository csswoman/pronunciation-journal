"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { publicAuthErrorMessage } from "@/lib/auth/password-policy";
import { publicDataErrorMessage } from "@/lib/degradation/messages";
import {
  getUserPreferences,
  updateDisplayName,
  updateAvatar as updateAvatarQuery,
  updatePassword as updatePasswordQuery,
  syncCefrLevel,
  updateInterests as updateInterestsQuery,
} from "@/lib/users/queries";
import type { Interest } from "@/lib/users/interests";
import { cacheUserInterests, getCachedUserInterests } from "@/lib/db";
import type { CefrLevel } from "@/lib/core-1000/types";

export interface UserPreferencesData {
  full_name?: string;
  avatar_url?: string;
  cefr_level?: CefrLevel | null;
  interests?: Interest[];
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
      await cacheUserInterests(user.id, prefs.interests);
      setPreferences(prefs);
    } catch {
      const cached = await getCachedUserInterests(user.id);
      if (cached) setPreferences((prev) => ({ ...prev, interests: cached as Interest[] }));
      setError(publicDataErrorMessage());
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
      } catch {
        const message = publicDataErrorMessage();
        setError(message);
        throw new Error(message);
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
      } catch {
        const message = publicDataErrorMessage();
        setError(message);
        throw new Error(message);
      }
    },
    [user],
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      if (!user) return;

      try {
        await updatePasswordQuery(newPassword);
      } catch {
        const message = publicAuthErrorMessage();
        setError(message);
        throw new Error(message);
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
      } catch {
        const message = publicDataErrorMessage();
        setError(message);
        throw new Error(message);
      }
    },
    [user],
  );

  const updateInterests = useCallback(async (interests: readonly unknown[]) => {
    if (!user) return;
    try {
      const saved = await updateInterestsQuery(user.id, interests);
      await cacheUserInterests(user.id, saved);
      setPreferences((prev) => ({ ...prev, interests: saved }));
    } catch {
      const message = publicDataErrorMessage();
      setError(message);
      throw new Error(message);
    }
  }, [user]);

  return {
    preferences,
    loading,
    error,
    updateFullName,
    updateAvatar,
    updatePassword,
    updateCefrLevel,
    updateInterests,
  };
}
