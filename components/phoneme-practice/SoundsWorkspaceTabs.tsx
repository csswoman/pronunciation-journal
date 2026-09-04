import { LayoutGrid } from "@/components/icons";

export type SoundsWorkspaceTab = "sounds" | "minimal-pairs" | "intonation" | "path";

interface Props {
  activeTab: SoundsWorkspaceTab;
  onTabChange: (tab: SoundsWorkspaceTab) => void;
  onOpenIPA: () => void;
}

const tabs: Array<{ id: SoundsWorkspaceTab; label: string }> = [
  { id: "sounds", label: "Sonidos" },
  { id: "minimal-pairs", label: "Pares mínimos" },
  { id: "intonation", label: "Entonación" },
  { id: "path", label: "Ruta" },
];

export function SoundsWorkspaceTabs({ activeTab, onTabChange, onOpenIPA }: Props) {
  return (
    <div className="sound-lab__workspace-row">
      <div
        className="sound-lab__workspace-tabs"
        role="tablist"
        aria-label="Contenido de pronunciación"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className="sound-lab__workspace-tab"
              data-active={isActive ? "true" : undefined}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="sound-lab__ipa-trigger"
        onClick={onOpenIPA}
        aria-label="Abrir tabla IPA de referencia"
        title="Tabla IPA"
      >
        <LayoutGrid size={15} aria-hidden />
        <span className="sound-lab__ipa-trigger-label">Tabla IPA</span>
      </button>
    </div>
  );
}
