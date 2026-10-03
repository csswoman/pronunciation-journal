import { NavButton } from "./NavButton";
import { NavIconPill } from "./NavIconPill";
import { useSidebar } from "./SidebarContext";

export interface NavSubItem {
  name: string;
  href: string;
}

/** Pastel family: coral=palabras, butter=sonido/lectura, lilac=mazos/progreso, mint=inmersión/diario. */
export type NavTone = "sky" | "coral" | "butter" | "lilac" | "mint";

export interface NavItem {
  name: string;
  href: string;
  icon: typeof import("@/components/icons").Home;
  tone?: NavTone;
  children?: NavSubItem[];
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
}

export function NavLink({ item, active }: NavLinkProps) {
  const { collapsed } = useSidebar();

  return (
    <NavButton active={active} as="link" href={item.href} tooltip={item.name}>
      <NavIconPill icon={item.icon} tone={item.tone} className="relative" />
      {!collapsed && (
        <>
          <span className="relative flex-1 truncate group-hover:text-fg transition-colors duration-[var(--transition-fast)]">
            {item.name}
          </span>
          {active && (
            <span aria-hidden className="relative size-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavButton>
  );
}
