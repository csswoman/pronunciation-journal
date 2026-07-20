// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, getPronunciationCoachState, getPronunciationMasteredPhrases, savePronunciationCoachState, savePronunciationMasteredPhrases } from "@/lib/db";
import { getRecentConversations, saveConversation } from "@/lib/db/ai";

describe("account-owned Dexie data", () => {
  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
  });

  afterEach(() => db.close());

  it("keeps conversations and pronunciation state isolated for two accounts", async () => {
    await saveConversation("account-a", {
      templateId: "free-conversation", mode: "chat", title: "A", messages: [], deviceId: "device-a",
      createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z",
    });
    await saveConversation("account-b", {
      templateId: "free-conversation", mode: "chat", title: "B", messages: [], deviceId: "device-b",
      createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z",
    });
    await savePronunciationCoachState("account-a", "queue", ["A phrase"]);
    await savePronunciationCoachState("account-b", "queue", ["B phrase"]);
    await savePronunciationMasteredPhrases("account-a", ["A phrase"]);
    await savePronunciationMasteredPhrases("account-b", ["B phrase"]);

    await expect(getRecentConversations("account-a")).resolves.toMatchObject([{ title: "A", userId: "account-a" }]);
    await expect(getRecentConversations("account-b")).resolves.toMatchObject([{ title: "B", userId: "account-b" }]);
    await expect(getPronunciationCoachState("account-a", "queue")).resolves.toEqual(["A phrase"]);
    await expect(getPronunciationCoachState("account-b", "queue")).resolves.toEqual(["B phrase"]);
    await expect(getPronunciationMasteredPhrases("account-a")).resolves.toEqual(["A phrase"]);
    await expect(getPronunciationMasteredPhrases("account-b")).resolves.toEqual(["B phrase"]);
  });
});
