// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMyWords = vi.fn();
const subscribeWordBankChanges = vi.fn();

let mockUser: { id: string } | null = null;

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/word-bank/queries", () => ({
  getMyWords: () => getMyWords(),
  deleteWord: vi.fn(),
  quickAddWord: vi.fn(),
}));

vi.mock("@/lib/word-bank/realtime", () => ({
  subscribeWordBankChanges: (...args: unknown[]) => subscribeWordBankChanges(...args),
}));

import { useWords } from "../useWords";

describe("useWords", () => {
  beforeEach(() => {
    mockUser = null;
    getMyWords.mockReset();
    subscribeWordBankChanges.mockReset();
  });

  it("does not load or subscribe without a user", async () => {
    const { result } = renderHook(() => useWords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getMyWords).not.toHaveBeenCalled();
    expect(subscribeWordBankChanges).not.toHaveBeenCalled();
  });

  it("loads words and subscribes when a user is present", async () => {
    mockUser = { id: "user-1" };
    getMyWords.mockResolvedValue([]);
    subscribeWordBankChanges.mockReturnValue({ unsubscribe: vi.fn() });

    renderHook(() => useWords());

    await waitFor(() => {
      expect(getMyWords).toHaveBeenCalledTimes(1);
      expect(subscribeWordBankChanges).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ onChange: expect.any(Function) }),
      );
    });
  });
});
