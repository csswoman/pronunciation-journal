import { NavLink, NavItem } from "./NavLink";
import { SectionLabel } from "./SectionLabel";

export interface NavSectionType {
  label: string;
  items: NavItem[];
}

interface NavSectionProps {
  section: NavSectionType;
  isActive: (href: string) => boolean;
  isFirst?: boolean;
}

export function NavSection({ section, isActive, isFirst = false }: NavSectionProps) {
  return (
    <div>
      {section.label ? (
        <SectionLabel label={section.label} isFirst={isFirst} />
      ) : (
        !isFirst && <div className="my-1.5 mx-3 border-t border-border-subtle" />
      )}
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </div>
  );
}

