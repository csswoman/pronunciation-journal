"use client";

import { BookOpen, Home, Menu, Target } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import AICoachTrigger from "@/components/ai-coach/AICoachTrigger";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/cn";
import BottomNavMenu from "./BottomNavMenu";
import BottomNavTab from "./BottomNavTab";

interface BottomNavProps {
  className?: string;
}

const primaryTabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Practice", href: "/daily", icon: Target },
  { name: "Ruta", href: "/courses", icon: BookOpen },
] as const;

export default function BottomNav({ className = "" }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const toggleMenu = useCallback(() => setShowMenu((open) => !open), []);

  const [home, practice, courses] = primaryTabs;

  return (
    <>
      <BottomNavMenu open={showMenu} onClose={closeMenu} isActive={isActive} />

      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 items-end border-t border-[var(--line-divider)] bg-[var(--card-bg)]/90 backdrop-blur-md px-1 pt-2",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          className,
        )}
      >
        <div className="flex justify-center">
          <BottomNavTab
            name={home.name}
            href={home.href}
            icon={<home.icon className="h-5 w-5" strokeWidth={activeStroke(isActive(home.href))} />}
            active={isActive(home.href)}
          />
        </div>

        <div className="flex justify-center">
          <BottomNavTab
            name={practice.name}
            href={practice.href}
            icon={<practice.icon className="h-5 w-5" strokeWidth={activeStroke(isActive(practice.href))} />}
            active={isActive(practice.href)}
          />
        </div>

        <div className="flex justify-center items-end">
          {user ? (
            <AICoachTrigger variant="nav" />
          ) : (
            <span className="block h-9 w-14 shrink-0" aria-hidden />
          )}
        </div>

        <div className="flex justify-center">
          <BottomNavTab
            name={courses.name}
            href={courses.href}
            icon={<courses.icon className="h-5 w-5" strokeWidth={activeStroke(isActive(courses.href))} />}
            active={isActive(courses.href)}
          />
        </div>

        <div className="flex justify-center">
          <BottomNavTab
            name="Menu"
            icon={<Menu className="h-5 w-5" strokeWidth={showMenu ? 2.25 : 1.75} />}
            active={showMenu}
            onClick={toggleMenu}
            ariaExpanded={showMenu}
            ariaControls="bottom-nav-menu"
          />
        </div>
      </nav>
    </>
  );
}

function activeStroke(active: boolean) {
  return active ? 2.25 : 1.75;
}
