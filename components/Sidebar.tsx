"use client";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import ThemeControl from "./ThemeControl";
import { LogOut } from "lucide-react";
import { NavSection, NavButton, NavLink, coreNav, learningNav, trackingNav, adminNav } from "./sidebar/index";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { isPremium } = useUserRole();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className={`sidebar-scrollbar w-64 flex flex-col h-full min-h-0 overflow-y-auto bg-[var(--card-bg)] border-r border-[var(--line-divider)] ${className}`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 flex-shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--primary)" }}
        >
          <span className="font-bold text-xs" style={{ color: "var(--accent-text)" }}>EJ</span>
        </div>
        <span className="font-heading font-semibold text-sm" style={{ color: "var(--deep-text)" }}>
          English Journal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        <div className="space-y-0.5">
          {coreNav.items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <NavSection section={learningNav} isActive={isActive} />
        <NavSection section={trackingNav} isActive={isActive} />

        {isPremium && (
          <NavSection section={adminNav} isActive={isActive} />
        )}
      </nav>

      {/* Footer */}
      <div
        className="flex-shrink-0 border-t px-3 pt-3 pb-4 space-y-0.5"
        style={{ borderColor: "var(--line-divider)" }}
      >
        <NavButton active={isActive("/profile")} as="link" href="/profile">
          <div
            className="relative w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0 ring-1"
            style={{
              background: "var(--btn-regular-bg)",
              color: "var(--btn-content)",
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill sizes="20px" className="object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="relative truncate text-sm font-medium">{displayName}</span>
        </NavButton>

        <ThemeControl />

        <NavButton active={false} onClick={handleSignOut}>
          <span className="relative flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-150">
            <LogOut className="h-4 w-4" />
          </span>
          <span className="relative group-hover:text-[var(--deep-text)] transition-colors duration-150">Sign out</span>
        </NavButton>
      </div>
    </aside>
  );
}

