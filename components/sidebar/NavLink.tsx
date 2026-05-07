import { NavButton } from "./NavButton";
import { useSidebar } from "./SidebarContext";

export interface NavItem {
  name: string;
  href: string;
  icon: typeof import("lucide-react").Home;
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
}

export function NavLink({ item, active }: NavLinkProps) {
  const { collapsed } = useSidebar();
  const IconComponent = item.icon;

  return (
    <NavButton active={active} as="link" href={item.href} tooltip={item.name}>
      <span className="relative flex-shrink-0">
        <IconComponent className="h-5 w-5" />
      </span>
      {!collapsed && (
        <span className="relative group-hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)]">
          {item.name}
        </span>
      )}
    </NavButton>
  );
}
