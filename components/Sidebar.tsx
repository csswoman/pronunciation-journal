"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import ThemeColorController from "./ThemeColorController";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  className?: string;
}

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PracticeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const AiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IpaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const LessonsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
  </svg>
);

const ProgressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const mainNav: NavItem[] = [
  { name: "Home",        href: "/",            icon: <HomeIcon /> },
  { name: "Practice",   href: "/practice",   icon: <PracticeIcon /> },
  { name: "AI Practice",href: "/ai-practice", icon: <AiIcon /> },
];

const DecksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const referenceNav: NavItem[] = [
  { name: "IPA Chart",  href: "/ipa",      icon: <IpaIcon /> },
  { name: "Lessons",    href: "/lessons",  icon: <LessonsIcon /> },
];

const trackNav: NavItem[] = [
  { name: "Progress",   href: "/progress", icon: <ProgressIcon /> },
];

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] px-3 mt-4 mb-1">
      {label}
    </p>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--btn-regular-bg)] text-[var(--primary)] font-semibold"
          : "text-[var(--deep-text)] hover:bg-[var(--btn-plain-bg-hover)]"
      }`}
    >
      {item.icon}
      {item.name}
    </Link>
  );
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
      className={`w-64 flex-col h-full px-4 py-6 bg-[var(--card-bg)] border-r border-[var(--line-divider)] ${className}`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--primary)" }}
        >
          <span className="font-bold text-sm text-[var(--accent-text)]">EJ</span>
        </div>
        <span className="font-heading font-bold text-sm text-[var(--deep-text)]">
          English Journal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <GroupLabel label="Vocabulary" />
        <NavLink
          item={{ name: "Decks", href: "/decks", icon: <DecksIcon /> }}
          active={isActive("/decks")}
        />

        <GroupLabel label="Reference" />
        {referenceNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <GroupLabel label="Track" />
        {trackNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {isPremium && (
          <>
            <GroupLabel label="Admin" />
            <NavLink
              item={{ name: "Seed Data", href: "/admin/seed", icon: <AdminIcon /> }}
              active={isActive("/admin/seed")}
            />
            <NavLink
              item={{ name: "Manage Lessons", href: "/admin/lessons", icon: <LessonsIcon /> }}
              active={isActive("/admin/lessons")}
            />
          </>
        )}
      </nav>

      {/* User zone */}
      <div className="border-t border-[var(--line-divider)] pt-3 mt-3 space-y-1">
        <Link
          href="/profile"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
            isActive("/profile")
              ? "bg-[var(--btn-regular-bg)] text-[var(--primary)] font-semibold"
              : "text-[var(--deep-text)] hover:bg-[var(--btn-plain-bg-hover)]"
          }`}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0"
            style={{ background: "var(--btn-regular-bg)", color: "var(--btn-content)" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="truncate">{displayName}</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium text-[var(--deep-text)] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
        >
          <SignOutIcon />
          Sign out
        </button>
      </div>

      {/* Theme controller */}
      <ThemeColorController isExpanded={true} />
    </aside>
  );
}
