import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SoundsWorkspaceTab } from "@/components/phoneme-practice/SoundsWorkspaceTabs";

interface SoundLabWorkspace {
  activeTab: SoundsWorkspaceTab;
  isSoundsView: boolean;
  isMinimalPairsView: boolean;
  isIntonationView: boolean;
  isPathView: boolean;
  isIPAOpen: boolean;
  selectTab: (tab: SoundsWorkspaceTab) => void;
  openIPA: () => void;
  closeIPA: () => void;
}

/** Resolves the active workspace tab from `?tab=` and owns the IPA reference dialog's open state. */
export function useSoundLabWorkspace(): SoundLabWorkspace {
  const searchParams = useSearchParams();

  const resolveTab = useCallback((tab: string | null): SoundsWorkspaceTab =>
    tab === "minimal-pairs"
      ? "minimal-pairs"
      : tab === "intonation"
        ? "intonation"
        : tab === "path"
          ? "path"
          : "sounds", []);
  const [activeTab, setActiveTab] = useState<SoundsWorkspaceTab>(() =>
    resolveTab(searchParams.get("tab")),
  );

  const [isIPAOpen, setIsIPAOpen] = useState(() => searchParams.get("openIPA") === "1");
  const closeIPA = useCallback(() => setIsIPAOpen(false), []);
  const openIPA = useCallback(() => setIsIPAOpen(true), []);
  const selectTab = useCallback((tab: SoundsWorkspaceTab) => {
    setActiveTab(tab);

    const params = new URLSearchParams(window.location.search);
    if (tab === "sounds") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);

  useEffect(() => {
    const onPopState = () => setActiveTab(resolveTab(new URLSearchParams(window.location.search).get("tab")));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [resolveTab]);

  return {
    activeTab,
    isSoundsView: activeTab === "sounds",
    isMinimalPairsView: activeTab === "minimal-pairs",
    isIntonationView: activeTab === "intonation",
    isPathView: activeTab === "path",
    isIPAOpen,
    selectTab,
    openIPA,
    closeIPA,
  };
}
