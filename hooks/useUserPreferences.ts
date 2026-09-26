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
  applyManualCefrLevel,
  updateInterests as updateInterestsQuery,
} from "@/lib/users/queries";
import type { Interest } from "@/lib/users/interests";
import { cacheUserInterests, getCachedUserInterests } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { LearnerLevelResolution } from "@/lib/learner-level/core";
import { getEffectiveLearnerLevelForViewer } from "@/lib/learner-level/client-queries";

export interface UserPreferencesData {
  full_name?: string;
  avatar_url?: string;
  interests?: Interest[];
  app_language?: string;
  learning_target?: string;
  daily_goal?: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [learnerLevel, setLearnerLevel] = useState<LearnerLevelResolution | null>(null);
  const [appLanguage, setAppLanguageState] = useState<string>("Español");
  const [learningTarget, setLearningTargetState] = useState<string>("Inglés · acento americano");
  const [dailyGoal, setDailyGoalState] = useState<string>("10 min");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("ej_app_language");
      if (savedLang) setAppLanguageState(savedLang);
      const savedTarget = localStorage.getItem("ej_learning_target");
      if (savedTarget) setLearningTargetState(savedTarget);
      const savedGoal = localStorage.getItem("ej_daily_goal");
      if (savedGoal) setDailyGoalState(savedGoal);
    }
  }, []);

  const setAppLanguage = useCallback((lang: string) => {
    setAppLanguageState(lang);
    if (typeof window !== "undefined") localStorage.setItem("ej_app_language", lang);
  }, []);

  const setLearningTarget = useCallback((target: string) => {
    setLearningTargetState(target);
    if (typeof window !== "undefined") localStorage.setItem("ej_learning_target", target);
  }, []);

  const setDailyGoal = useCallback((goal: string) => {
    setDailyGoalState(goal);
    if (typeof window !== "undefined") localStorage.setItem("ej_daily_goal", goal);
  }, []);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [prefs, level] = await Promise.all([
        getUserPreferences(user.id, user.user_metadata),
        getEffectiveLearnerLevelForViewer(user.id),
      ]);
      setPreferences(prefs);
      setLearnerLevel(level);
      // Dexie cache is best-effort — never discard remote prefs if local DB is down.
      try {
        const { ensureDbReady } = await import("@/lib/db");
        await ensureDbReady();
        await cacheUserInterests(user.id, prefs.interests);
      } catch {
        /* local cache unavailable */
      }
    } catch {
      try {
        const { ensureDbReady } = await import("@/lib/db");
        await ensureDbReady();
        const cached = await getCachedUserInterests(user.id);
        if (cached) setPreferences((prev) => ({ ...prev, interests: cached as Interest[] }));
      } catch {
        /* local cache unavailable */
      }
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
        await applyManualCefrLevel(user.id, level);
        setLearnerLevel(await getEffectiveLearnerLevelForViewer(user.id));
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
    learnerLevel,
    loading,
    error,
    appLanguage,
    learningTarget,
    dailyGoal,
    setAppLanguage,
    setLearningTarget,
    setDailyGoal,
    updateFullName,
    updateAvatar,
    updatePassword,
    updateCefrLevel,
    updateInterests,
  };
}
