import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  collapse: () => void;
  expand: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  setCollapsed: (collapsed: boolean) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sidebar-collapsed", String(collapsed));
      } catch {
        // Safe fallback for restricted storage environments
      }
    }
    set({ isCollapsed: collapsed });
  },
  toggleCollapsed: () =>
    set((state) => {
      const next = !state.isCollapsed;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sidebar-collapsed", String(next));
        } catch {
          // Safe fallback
        }
      }
      return { isCollapsed: next };
    }),
  collapse: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sidebar-collapsed", "true");
      } catch {
        // Safe fallback
      }
    }
    set({ isCollapsed: true });
  },
  expand: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sidebar-collapsed", "false");
      } catch {
        // Safe fallback
      }
    }
    set({ isCollapsed: false });
  },
}));
