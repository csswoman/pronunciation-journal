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

describe("useCoachStarters", () => {
  it("resolves starters and returns refresh function", () => {
    const { result } = renderHook(() => useCoachStarters(true));
    expect(result.current.starters).not.toBeNull();
    expect(result.current.starters?.length).toBe(4);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.refresh).toBe("function");
    expect(typeof result.current.noteUse).toBe("function");
  });

  it("re-resolves starters when isOpen transitions from false to true", async () => {
    let isOpen = false;
    const { result, rerender } = renderHook(() => useCoachStarters(isOpen));

    const initialStarters = result.current.starters;
    expect(initialStarters).not.toBeNull();

    isOpen = true;
    rerender();

    await waitFor(() => {
      expect(result.current.starters).toBeDefined();
    });
  });

  it("re-resolves starters when refresh is invoked", () => {
    const { result } = renderHook(() => useCoachStarters(true));
    expect(result.current.starters).not.toBeNull();

    act(() => {
      result.current.refresh();
    });

    expect(result.current.starters).not.toBeNull();
    expect(result.current.starters?.length).toBe(4);
  });
});
