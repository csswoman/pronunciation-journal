type HistoryMessage = { role: "user" | "model" | "tool"; content?: string };

/** Start at a learner turn so a tool result never outlives its model call. */
export function trimHistoryForModel<T extends HistoryMessage>(messages: T[], maxMessages = 16): T[] {
  const firstAllowed = Math.max(0, messages.length - maxMessages);
  for (let index = firstAllowed; index < messages.length; index++) {
    const message = messages[index];
    if (message.role === "user" && message.content?.trim()) return messages.slice(index);
  }
  return [];
}
