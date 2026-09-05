// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarStore } from "../sidebarStore";

describe("sidebarStore", () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false });
    localStorage.clear();
  });

  it("defaults to expanded (isCollapsed = false)", () => {
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });

  it("collapses sidebar and updates localStorage", () => {
    useSidebarStore.getState().collapse();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true");
  });

  it("expands sidebar and updates localStorage", () => {
    useSidebarStore.getState().collapse();
    useSidebarStore.getState().expand();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
    expect(localStorage.getItem("sidebar-collapsed")).toBe("false");
  });

  it("toggles sidebar state", () => {
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true");

    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
    expect(localStorage.getItem("sidebar-collapsed")).toBe("false");
  });
});
