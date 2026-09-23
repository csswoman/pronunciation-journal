"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getEffectiveLearnerLevel } from "@/lib/learner-level/client-queries";
import type { CefrLevelId } from "@/lib/courses/types";

/**
 * The learner's resolved CEFR level (lowercased), read client-side from
 * the canonical learner-level resolver. Falls back to `fallbackLevelId` while
 * loading, offline, or when the learner has no level set yet — never throws,
 * so it degrades gracefully offline.
 */
export function useLearnerLevelId(fallbackLevelId: CefrLevelId): CefrLevelId {
  const [learnerLevelId, setLearnerLevelId] = useState<CefrLevelId>(fallbackLevelId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;
      const resolution = await getEffectiveLearnerLevel(user.id);
      if (!cancelled) {
        setLearnerLevelId(resolution.level.toLowerCase() as CefrLevelId);
      }
    }

    load().catch(() => {
      /* offline or unauthenticated: keep the fallback level */
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return learnerLevelId;
}
