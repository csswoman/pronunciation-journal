// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCoachStarters } from "../useCoachStarters";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/lib/auth/is-anonymous", () => ({
  isAnonymousUser: () => true,
}));

vi.mock("@/lib/preferences/guest-study-level", () => ({
  readGuestStudyLevel: () => "A1",
}));

vi.mock("@/lib/learner-level/client-queries", () => ({
  getEffectiveLearnerLevelForViewer: vi.fn(async () => ({
    level: "A1",
    source: "manual",
    confidence: null,
    isPlaced: false,
    updatedAt: null,
  })),
}));

describe("useCoachStarters", () => {
  it("resolves starters and returns refresh function", async () => {
    const { result } = renderHook(() => useCoachStarters(true));
    await waitFor(() => expect(result.current.starters).not.toBeNull());
    expect(result.current.starters?.length).toBe(4);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.refresh).toBe("function");
    expect(typeof result.current.noteUse).toBe("function");
  });

  it("re-resolves starters when isOpen transitions from false to true", async () => {
    let isOpen = false;
    const { result, rerender } = renderHook(() => useCoachStarters(isOpen));

    await waitFor(() => expect(result.current.starters).not.toBeNull());

    isOpen = true;
    rerender();

    await waitFor(() => {
      expect(result.current.starters).not.toBeNull();
    });
  });

  it("re-resolves starters when refresh is invoked", async () => {
    const { result } = renderHook(() => useCoachStarters(true));
    await waitFor(() => expect(result.current.starters).not.toBeNull());

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.starters).not.toBeNull());
    expect(result.current.starters?.length).toBe(4);
  });
});
