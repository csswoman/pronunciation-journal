import { LayoutGrid } from "@/components/icons";

export type SoundsWorkspaceTab = "sounds" | "minimal-pairs" | "intonation" | "path";

interface Props {
  activeTab: SoundsWorkspaceTab;
  onTabChange: (tab: SoundsWorkspaceTab) => void;
  onOpenIPA: () => void;
}

const tabs: Array<{ id: SoundsWorkspaceTab; label: string }> = [
  { id: "sounds", label: "Ejercicios de sonido" },
  { id: "minimal-pairs", label: "Pares mínimos" },
  { id: "intonation", label: "Entonación" },
  { id: "path", label: "Tu progreso" },
];

export function SoundsWorkspaceTabs({ activeTab, onTabChange, onOpenIPA }: Props) {
  return (
    <div className="sound-lab__workspace-row">
      <nav
        className="sound-lab__workspace-tabs"
        aria-label="Contenido de pronunciación"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className="sound-lab__workspace-tab"
              data-active={isActive ? "true" : undefined}
              aria-pressed={isActive}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        className="sound-lab__workspace-tab sound-lab__workspace-tab--ipa"
        onClick={onOpenIPA}
        aria-label="Ver tabla IPA"
      >
        <LayoutGrid size={16} aria-hidden />
        <span className="sound-lab__ipa-trigger-label">Tabla IPA</span>
      </button>
    </div>
  );
}
