"use client";

// Subcomponents planned structure:
// <NavAccordionItem>
//   <NavButton (parent / trigger)>
//     <Icon />
//     <span>Label</span>
//     <ChevronIcon />
//   </NavButton>
//   <SubItemList (expanded)>
//     <Link (subitem)>
//   </SubItemList>
// </NavAccordionItem>

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "@/components/icons";
import { NavButton } from "./NavButton";
import { useSidebar } from "./SidebarContext";
import type { NavItem } from "./NavLink";
import { playUiCue } from "@/lib/ui-sounds/cues";

interface NavAccordionItemProps {
  item: NavItem;
  isActive: (href: string) => boolean;
}

export function NavAccordionItem({ item, isActive }: NavAccordionItemProps) {
  const { collapsed } = useSidebar();
  const IconComponent = item.icon;
  const children = item.children ?? [];

  const isParentActive = isActive(item.href);
  const isAnyChildActive = children.some((child) => isActive(child.href));
  const shouldBeOpen = isParentActive || isAnyChildActive;

  const [isOpen, setIsOpen] = useState(shouldBeOpen);

  useEffect(() => {
    if (shouldBeOpen) {
      setIsOpen(true);
    }
  }, [shouldBeOpen]);

  // When collapsed, the parent button navigates directly to the href
  if (collapsed) {
    return (
      <NavButton
        active={isParentActive || isAnyChildActive}
        as="link"
        href={item.href}
        tooltip={item.name}
      >
        <span className="relative flex-shrink-0">
          <IconComponent className="h-5 w-5" />
        </span>
      </NavButton>
    );
  }

  const toggleOpen = () => {
    playUiCue("tap");
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="space-y-0.5">
      <div className="relative flex items-center group">
        <div className="flex-1 min-w-0">
          <NavButton
            active={isParentActive}
            as="link"
            href={item.href}
            tooltip={item.name}
          >
            <span className="relative flex-shrink-0">
              <IconComponent className="h-5 w-5" />
            </span>
            <span className="relative truncate group-hover:text-fg transition-colors duration-[var(--transition-fast)]">
              {item.name}
            </span>
          </NavButton>
        </div>

        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Contraer ${item.name}` : `Expandir ${item.name}`}
          className="press-feedback absolute right-1.5 p-1 rounded-sm text-fg-subtle hover:text-fg hover:bg-surface-sunken transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {isOpen && children.length > 0 && (
        <div className="ml-5 pl-2.5 border-l border-border-subtle space-y-0.5 pt-0.5">
          {children.map((child) => {
            const childActive = isActive(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => {
                  if (!childActive) playUiCue("nav-switch");
                }}
                className={`press-feedback flex items-center min-h-[30px] px-2 py-1 rounded-[var(--radius-sm)] text-caption transition-all duration-[var(--transition-fast)] ${
                  childActive
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
                }`}
              >
                <span className="truncate">{child.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
