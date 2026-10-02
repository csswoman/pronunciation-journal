import { cn } from "@/lib/cn";

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
    <div className="sound-lab__workspace-row flex items-center gap-1.5 p-1 rounded-full bg-surface-sunken border border-border">
      <div
        className="flex items-center gap-1 overflow-x-auto scrollbar-none"
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
              className={cn(
                "inline-flex items-center justify-center px-4 py-1.5 ts-pill rounded-full transition-all cursor-pointer whitespace-nowrap select-none",
                isActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-fg-muted hover:text-fg hover:bg-surface-raised",
              )}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenIPA}
          className="inline-flex items-center justify-center px-4 py-1.5 ts-pill text-fg-muted hover:text-fg hover:bg-surface-raised rounded-full transition-all cursor-pointer whitespace-nowrap select-none"
          aria-label="Abrir tabla IPA de referencia"
          title="Tabla IPA"
        >
          Tabla IPA
        </button>
      </div>
    </div>
  );
}
