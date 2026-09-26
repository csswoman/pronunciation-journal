"use client";

import { useCallback } from "react";
import type { AIMessage, ToolCall } from "@/lib/ai-practice/types";
import { getRecentCoachStems, saveCoachSeenItems } from "@/lib/ai-practice/coach-seen-items";
import {
  fetchBankItems,
  cacheBankItems,
  getCachedBankItems,
  getCoachBankLevel,
  revalidateCachedBankItems,
} from "@/lib/content-bank/queries";
import { pickBankSet } from "@/lib/content-bank/select";
import { db } from "@/lib/db";
import { useAICoachStore } from "@/lib/stores/aiCoachStore";

export function useCoachBankSet() {
  const tryServeBankSet = useCallback(
    async (options: { userId: string | null }): Promise<Extract<AIMessage, { role: "model" }> | null> => {
      const { userId } = options;

      const level = await getCoachBankLevel(userId);
      if (!level) return null;

      let weakTopics: string[] = [];
      if (userId) {
        try {
          const stored = await db.learningState.get(userId);
          if (stored?.state?.grammar?.weakTopics) {
            weakTopics = stored.state.grammar.weakTopics.map((t: { topic: string }) => t.topic);
          }
        } catch {
          // Ignore Dexie read errors
        }
      }

      const seenStems = userId ? await getRecentCoachStems(userId).catch(() => []) : [];

      const isOnline = typeof navigator !== "undefined" && navigator.onLine;
      let items = await getCachedBankItems(level).catch(() => []);
      if (isOnline && userId && items.length > 0) {
        const refreshed = await revalidateCachedBankItems(level);
        if (!refreshed.ok) return null;
        items = refreshed.items;
      }
      if (items.length < 5 && isOnline && userId) {
        try {
          const remoteItems = await fetchBankItems(level, undefined, 40);
          if (remoteItems && remoteItems.length > 0) {
            await cacheBankItems(remoteItems).catch(() => {});
            items = await getCachedBankItems(level).catch(() => remoteItems);
          }
        } catch {
          // Ignore network or fetch errors
        }
      }

      if (items.length === 0) {
        return null;
      }

      const picked = pickBankSet(items, seenStems, weakTopics);
      if (picked.length < 5) {
        return null;
      }

      const toolCalls = new Map<string, ToolCall>();
      for (const item of picked) {
        const id = `bank_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
        toolCalls.set(id, {
          id,
          name: item.tool_name,
          args: item.payload,
          status: "pending",
        });
      }

      if (userId) {
        void Promise.resolve(saveCoachSeenItems(userId, toolCalls.values())).catch(() => {});
      }

      const isEnglish = useAICoachStore.getState().coachLanguage === "en";
      const introText = isEnglish
        ? "Here is your 5-exercise practice set!"
        : "¡Listo! Aquí tienes tu set de 5 ejercicios para practicar.";

      const modelMsg: Extract<AIMessage, { role: "model" }> = {
        role: "model",
        contentParts: [{ type: "text", text: introText }],
        toolCalls,
        timestamp: new Date().toISOString(),
      };

      return modelMsg;
    },
    [],
  );

  return { tryServeBankSet };
}
