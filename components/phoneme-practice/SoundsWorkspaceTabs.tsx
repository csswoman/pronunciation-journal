import Link from "next/link";

export type SoundsWorkspaceTab = "sounds" | "ipa" | "minimal-pairs" | "path";

interface Props {
  activeTab: SoundsWorkspaceTab;
}

const tabs: Array<{ id: SoundsWorkspaceTab; label: string; href: string }> = [
  { id: "sounds", label: "Ejercicios de sonido", href: "/practice/sounds" },
  { id: "ipa", label: "Tabla IPA", href: "/practice/sounds?tab=ipa" },
  { id: "minimal-pairs", label: "Pares mínimos", href: "/practice/sounds?tab=minimal-pairs" },
  { id: "path", label: "Ruta", href: "/practice/sounds?tab=path" },
];

export function SoundsWorkspaceTabs({ activeTab }: Props) {
  return (
    <nav
      className="sound-lab__workspace-tabs"
      aria-label="Contenido de pronunciación"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="sound-lab__workspace-tab"
            data-active={isActive ? "true" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
