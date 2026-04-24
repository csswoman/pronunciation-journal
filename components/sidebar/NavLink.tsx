import { NavButton } from "./NavButton";

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
  const IconComponent = item.icon;
  return (
    <NavButton active={active} as="link" href={item.href}>
      <span
        className="relative flex-shrink-0 transition-opacity duration-150"
        style={{ opacity: active ? 1 : 0.5 }}
      >
        <IconComponent className="h-4 w-4" />
      </span>
      <span className={`relative ${active ? "font-semibold" : "group-hover:text-[var(--deep-text)] transition-colors duration-150"}`}>
        {item.name}
      </span>
    </NavButton>
  );
}
