// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePanelResize } from "../usePanelResize";
import { useSidebarStore } from "@/lib/stores/sidebarStore";

describe("usePanelResize", () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false });
  });

  it("collapses the sidebar on drag start", () => {
    const setPanelWidth = vi.fn();
    const { result } = renderHook(() =>
      usePanelResize({ panelWidth: 380, setPanelWidth })
    );

    expect(useSidebarStore.getState().isCollapsed).toBe(false);

    act(() => {
      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 500,
      } as unknown as React.MouseEvent;

      result.current.onDragStart(mockEvent);
    });

    expect(useSidebarStore.getState().isCollapsed).toBe(true);
  });
});
