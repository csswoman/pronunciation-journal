import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: fromMock,
  }),
}));

import {
  findDeckEntry,
  getDeckCardsWithProgress,
  getDeckEntries,
  getUserDecksFull,
} from "@/lib/decks/queries";

describe("deck query projections", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("selects only deck fields used by deck UIs", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [{ id: "deck-1", name: "Travel", description: null, color: "#111", icon: "📚" }],
    });
    const eqMock = vi.fn(() => ({ order: orderMock }));
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ select: selectMock });

    const decks = await getUserDecksFull("user-1");

    expect(decks).toEqual([{ id: "deck-1", name: "Travel", description: null, color: "#111", icon: "📚" }]);
    expect(selectMock).toHaveBeenCalledWith("id, name, description, color, icon");
  });

  it("uses explicit entry columns for study cards", async () => {
    const progressInMock = vi.fn().mockResolvedValue({ data: [] });
    const progressEqMock = vi.fn(() => ({ in: progressInMock }));
    const progressSelectMock = vi.fn(() => ({ eq: progressEqMock }));

    const deckEqMock = vi.fn().mockResolvedValue({
      data: [
        {
          entries: {
            id: "entry-1",
            word: "ship",
            meanings: [],
            difficulty: 2,
            tags: ["vowel"],
            image_url: null,
            audio_url: null,
            created_at: "2026-06-21T00:00:00.000Z",
            ipa: "/ʃɪp/",
            keep_permanent: false,
            notes: null,
            phrases: null,
            sound_id: 7,
            updated_at: null,
            user_audio_url: null,
            user_id: "user-1",
          },
        },
      ],
    });
    const deckSelectMock = vi.fn(() => ({ eq: deckEqMock }));

    fromMock.mockImplementation((table: string) => {
      if (table === "deck_entries") return { select: deckSelectMock };
      if (table === "deck_entry_progress") return { select: progressSelectMock };
      throw new Error(`Unexpected table ${table}`);
    });

    const rows = await getDeckCardsWithProgress("deck-1", "user-1");

    expect(rows).toHaveLength(1);
    expect(deckSelectMock).toHaveBeenCalledWith(
      "entry_id, entries(id,word,meanings,difficulty,tags,image_url,audio_url,created_at,ipa,keep_permanent,notes,phrases,sound_id,updated_at,user_audio_url,user_id)"
    );
  });

  it("uses explicit entry columns for manage drawer entries", async () => {
    const eqMock = vi.fn().mockResolvedValue({
      data: [
        {
          entries: {
            id: "entry-1",
            word: "ship",
            meanings: [],
            difficulty: 2,
            tags: null,
            image_url: null,
            audio_url: null,
            created_at: "2026-06-21T00:00:00.000Z",
            ipa: null,
            keep_permanent: false,
            notes: null,
            phrases: null,
            sound_id: null,
            updated_at: null,
            user_audio_url: null,
            user_id: "user-1",
          },
        },
      ],
    });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ select: selectMock });

    const rows = await getDeckEntries("deck-1");

    expect(rows).toHaveLength(1);
    expect(selectMock).toHaveBeenCalledWith(
      "entry_id, entries(id,word,meanings,difficulty,tags,image_url,audio_url,created_at,ipa,keep_permanent,notes,phrases,sound_id,updated_at,user_audio_url,user_id)"
    );
  });

  it("checks deck membership with only the composite key columns", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { deck_id: "deck-1", entry_id: "entry-1" },
    });
    const secondEqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
    const firstEqMock = vi.fn(() => ({ eq: secondEqMock }));
    const selectMock = vi.fn(() => ({ eq: firstEqMock }));
    fromMock.mockReturnValue({ select: selectMock });

    const row = await findDeckEntry("deck-1", "entry-1");

    expect(row).toEqual({ deck_id: "deck-1", entry_id: "entry-1" });
    expect(selectMock).toHaveBeenCalledWith("deck_id, entry_id");
  });
});
