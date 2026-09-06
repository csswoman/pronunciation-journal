"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { getCachedUserInterests } from "@/lib/db";
import { normalizeInterests } from "@/lib/users/interests";
import { selectStarters } from "@/lib/ai-practice/starters/select";
import { readStarterHistory, recordStarterUse } from "@/lib/ai-practice/starters/history";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";

/**
 * Resolves the starters shown on the chat home.
 *
 * The seed is fixed for the lifetime of one mount so the buttons do not
 * reshuffle under the user's finger; a fresh mount (reopening the panel) picks
 * a new one.
 */
export function useCoachStarters() {
  const { user } = useAuth();
  const [starters, setStarters] = useState<ResolvedStarter[] | null>(null);
  const seed = useMemo(() => Math.floor(Math.random() * 1_000_000), []);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.id;
    if (!userId) {
      setStarters(selectStarters({
        state: null, interests: [], seed, recentIds: [], recentAngles: [], now: Date.now(),
      }));
      return;
    }

    void (async () => {
      const [state, cachedInterests, history] = await Promise.all([
        getUserLearningState(userId).catch(() => null),
        getCachedUserInterests(userId).catch(() => null),
        readStarterHistory(userId).catch(() => ({ ids: [], angles: [] })),
      ]);
      if (cancelled) return;
      setStarters(selectStarters({
        state,
        interests: normalizeInterests(cachedInterests ?? []),
        seed,
        recentIds: history.ids,
        recentAngles: history.angles,
        now: Date.now(),
      }));
    })();

    return () => { cancelled = true; };
  }, [user?.id, seed]);

  const noteUse = useCallback(
    (id: StarterId, angle: string) => {
      if (!user?.id) return;
      void recordStarterUse(user.id, id, angle).catch(() => undefined);
    },
    [user?.id],
  );

  return { starters, loading: starters === null, noteUse };
}
