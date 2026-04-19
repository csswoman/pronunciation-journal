import type { AIConversation } from "./types";

export type ConvGroupLabel = "TODAY" | "YESTERDAY" | "7 DAYS" | "OLDER";

export function groupConversationsByDate(
  convs: AIConversation[]
): Record<ConvGroupLabel, AIConversation[]> {
  const groups: Record<ConvGroupLabel, AIConversation[]> = {
    TODAY: [],
    YESTERDAY: [],
    "7 DAYS": [],
    OLDER: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  for (const conv of convs) {
    const d = new Date(conv.updatedAt);
    if (d >= todayStart) groups["TODAY"].push(conv);
    else if (d >= yesterdayStart) groups["YESTERDAY"].push(conv);
    else if (d >= weekStart) groups["7 DAYS"].push(conv);
    else groups["OLDER"].push(conv);
  }

  return groups;
}
