"use client";

// Planned structure:
// <BottomNavBento>
//   <BentoSection (todayNav / learnNav / practiceNav)>   — pastel tile grid
//     <BentoTile />
//   <ConsultList (consultNav)>                            — compact rows
//     <NavIconPill />

import Link from "next/link";
import { NavIconPill } from "@/components/theme/sidebar/NavIconPill";
import {
  todayNav,
  learnNav,
  practiceNav,
  consultNav,
} from "@/components/theme/sidebar/navConfig";
import type { NavItem, NavSectionType } from "@/components/theme/sidebar/index";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { cn } from "@/lib/cn";

interface BottomNavBentoProps {
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}

const BENTO_SECTIONS: { section: NavSectionType; columns: 2 | 3 }[] = [
  { section: todayNav, columns: 3 },
  { section: learnNav, columns: 2 },
  { section: practiceNav, columns: 3 },
];

export function BottomNavBento({ isActive, onNavigate }: BottomNavBentoProps) {
  return (
    <nav aria-label="Secciones" className="space-y-5 px-4 pb-3">
      {BENTO_SECTIONS.map(({ section, columns }) => (
        <section key={section.label}>
          <BentoLabel label={section.label} />
          <div className={cn("grid gap-2.5", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {section.items.map((item) => (
              <BentoTile
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      ))}

      <section>
        <BentoLabel label={consultNav.label} />
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
          {consultNav.items.map((item) => (
            <li key={item.href}>
              <ConsultRow item={item} active={isActive(item.href)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </section>
    </nav>
  );
}

function BentoLabel({ label }: { label: string }) {
  return (
    <h2 className="mb-2 px-1 font-caption text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
      {label}
    </h2>
  );
}

interface ItemProps {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}

function BentoTile({ item, active, onNavigate }: ItemProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      data-tone={item.tone}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        if (!active) playUiCue("nav-switch");
        onNavigate();
      }}
      className={cn(
        "press-feedback flex min-h-24 flex-col justify-between rounded-[20px] p-3.5 font-sans text-[15px] font-bold leading-tight",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        item.tone ? "pastel-card" : "border border-border-subtle bg-surface-raised text-fg",
        active && "ring-2 ring-primary ring-offset-2 ring-offset-(--bg)",
      )}
    >
      <Icon className="size-5.5" aria-hidden />
      <span>{item.name}</span>
    </Link>
  );
}

function ConsultRow({ item, active, onNavigate }: ItemProps) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        if (!active) playUiCue("nav-switch");
        onNavigate();
      }}
      className={cn(
        "press-feedback flex min-h-12 items-center gap-3 px-3 py-2 font-sans text-[15px] font-bold text-fg",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
        active && "bg-primary-soft font-semibold text-primary-text",
      )}
    >
      <NavIconPill icon={item.icon} tone={item.tone} className="size-8 rounded-sm" />
      <span className="flex-1 truncate">{item.name}</span>
    </Link>
  );
}
