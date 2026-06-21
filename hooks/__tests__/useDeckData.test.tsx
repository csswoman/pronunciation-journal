// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserDecksFull = vi.fn();
const getDeckCounts = vi.fn();

let mockUser: { id: string } | null = null;

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/decks/queries", () => ({
  getUserDecksFull: (userId: string) => getUserDecksFull(userId),
  getDeckCounts: (userId: string) => getDeckCounts(userId),
}));

import { useDeckData } from "../useDeckData";

describe("useDeckData", () => {
  beforeEach(() => {
    mockUser = null;
    getUserDecksFull.mockReset();
    getDeckCounts.mockReset();
  });

  it("stays idle without a user", async () => {
    const { result } = renderHook(() => useDeckData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getUserDecksFull).not.toHaveBeenCalled();
    expect(getDeckCounts).not.toHaveBeenCalled();
  });

  it("loads decks and counts when a user is present", async () => {
    mockUser = { id: "user-1" };
    getUserDecksFull.mockResolvedValue([]);
    getDeckCounts.mockResolvedValue({ words: {}, due: {}, mastered: {} });

    renderHook(() => useDeckData());

    await waitFor(() => {
      expect(getUserDecksFull).toHaveBeenCalledWith("user-1");
      expect(getDeckCounts).toHaveBeenCalledWith("user-1");
    });
  });
});
