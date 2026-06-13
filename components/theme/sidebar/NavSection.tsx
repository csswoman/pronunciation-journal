import { NavLink, NavItem } from "./NavLink";
import { SectionLabel } from "./SectionLabel";

export interface NavSectionType {
  label: string;
  items: NavItem[];
}

interface NavSectionProps {
  section: NavSectionType;
  isActive: (href: string) => boolean;
}

export function NavSection({ section, isActive }: NavSectionProps) {
  return (
    <div>
      {section.label && <SectionLabel label={section.label} />}
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </div>
  );
}
