"use client";
import { createContext, useContext } from "react";

interface SidebarContextValue {
  collapsed: boolean;
}

export const SidebarContext = createContext<SidebarContextValue>({ collapsed: false });

export function useSidebar() {
  return useContext(SidebarContext);
}
