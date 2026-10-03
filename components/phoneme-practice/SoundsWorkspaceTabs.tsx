import { cn } from "@/lib/cn";
import { SelectMenu, type SelectMenuOption } from "@/components/ui/SelectMenu";

export type SoundsWorkspaceTab = "sounds" | "minimal-pairs" | "intonation" | "path";

interface Props {
  activeTab: SoundsWorkspaceTab;
  onTabChange: (tab: SoundsWorkspaceTab) => void;
}

const tabs: Array<{ id: SoundsWorkspaceTab; label: string }> = [
  { id: "sounds", label: "Sonidos" },
  { id: "minimal-pairs", label: "Pares mínimos" },
  { id: "intonation", label: "Entonación" },
  { id: "path", label: "Ruta" },
];

const mobileOptions: SelectMenuOption[] = tabs.map((tab) => ({
  value: tab.id as string,
  label: tab.label,
}));

export function SoundsWorkspaceTabs({ activeTab, onTabChange }: Props) {
  function handleSelect(value: string) {
    onTabChange(value as SoundsWorkspaceTab);
  }

  return (
    <>
      <SelectMenu
        value={activeTab as string}
        onChange={handleSelect}
        options={mobileOptions}
        sheetTitle="Modo de pronunciación"
        aria-label="Contenido de pronunciación"
        className="sound-lab__workspace-select sm:hidden"
        triggerClassName="min-h-11 rounded-full px-5 ts-pill font-semibold"
      />

      <div className="hidden min-w-0 max-w-full items-center gap-1.5 p-1 rounded-full sm:flex sm:w-auto bg-surface-sunken border border-border">
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
        </div>
      </div>
    </>
  );
}
