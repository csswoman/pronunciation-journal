"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import ThemeControl from "./ThemeControl";

// ── Icons ──────────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PracticeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const AiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const DecksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const LessonsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
  </svg>
);

const IpaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const ProgressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// ── Nav config ─────────────────────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const coreNav: NavSection = {
  label: "",
  items: [
    { name: "Home",        href: "/",            icon: <HomeIcon /> },
    { name: "Practice",   href: "/practice",    icon: <PracticeIcon /> },
    { name: "AI Practice", href: "/ai-practice", icon: <AiIcon /> },
  ],
};

const learningNav: NavSection = {
  label: "Learning",
  items: [
    { name: "Decks",      href: "/decks",    icon: <DecksIcon /> },
    { name: "Courses",    href: "/courses",  icon: <LessonsIcon /> },
    { name: "IPA Chart",  href: "/ipa",      icon: <IpaIcon /> },
  ],
};

const trackingNav: NavSection = {
  label: "Tracking",
  items: [
    { name: "Progress", href: "/progress", icon: <ProgressIcon /> },
  ],
};

const adminNav: NavSection = {
  label: "Admin",
  items: [
    { name: "Seed Data",       href: "/admin/seed",    icon: <AdminIcon /> },
    { name: "Manage Lessons",  href: "/admin/lessons", icon: <LessonsIcon /> },
  ],
};

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest"
       style={{ color: "var(--text-tertiary)" }}>
      {label}
    </p>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="relative flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 group"
      style={
        active
          ? { background: "var(--btn-regular-bg)", color: "var(--primary)" }
          : { color: "var(--text-secondary)" }
      }
    >
      {/* Active indicator bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: "var(--primary)" }}
        />
      )}

      {/* Hover background (inactive only) */}
      {!active && (
        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10"
              style={{ background: "var(--btn-plain-bg-hover)" }} />
      )}

      {/* Icon */}
      <span
        className="relative flex-shrink-0 transition-opacity duration-150"
        style={{ opacity: active ? 1 : 0.5 }}
      >
        {item.icon}
      </span>

      {/* Label */}
      <span className={`relative ${active ? "font-semibold" : "group-hover:text-[var(--deep-text)] transition-colors duration-150"}`}>
        {item.name}
      </span>
    </Link>
  );
}

function NavSection({ section, isActive }: { section: NavSection; isActive: (href: string) => boolean }) {
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

// ── Sidebar ────────────────────────────────────────────────────────────────

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
        {/* User profile link */}
        <Link
          href="/profile"
          className="relative flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 group"
          style={
            isActive("/profile")
              ? { background: "var(--btn-regular-bg)", color: "var(--primary)" }
              : { color: "var(--text-secondary)" }
          }
        >
          {isActive("/profile") && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
              style={{ background: "var(--primary)" }}
            />
          )}

          {!isActive("/profile") && (
            <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10"
                  style={{ background: "var(--btn-plain-bg-hover)" }} />
          )}

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
        </Link>

        {/* Theme control */}
        <ThemeControl />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="relative w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 group text-left"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10"
                style={{ background: "var(--btn-plain-bg-hover)" }} />
          <span className="relative flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-150">
            <SignOutIcon />
          </span>
          <span className="relative group-hover:text-[var(--deep-text)] transition-colors duration-150">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
