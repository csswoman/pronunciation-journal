"use client";

import { useState } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/auth/AuthProvider";
import ProfileAvatarCard from "@/components/profile/ProfileAvatarCard";
import ProfileNameCard from "@/components/profile/ProfileNameCard";
import ProfilePasswordCard from "@/components/profile/ProfilePasswordCard";
import { H1, H2 } from "@/components/ui/Typography";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
      type === "success"
        ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
        : "border-[var(--error)] bg-[var(--error-soft)] text-[var(--error)]"
    }`}>
      {type === "success" ? (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      {children}
    </div>
  );
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const { preferences, loading, updateFullName, updateAvatar, updatePassword } = useUserPreferences();

  const displayName =
    preferences?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Guest";

  const initials = displayName === "Guest"
    ? "?"
    : displayName
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarUpdate = async (file: File) => {
    await updateAvatar(file);
    showToast("Profile photo updated");
  };

  const handleNameSave = async (name: string) => {
    await updateFullName(name);
    showToast("Display name updated");
  };

  const handlePasswordSave = async (password: string) => {
    await updatePassword(password);
    showToast("Password updated successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex items-center gap-3 text-fg-muted">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading profile…</span>
        </div>
      </div>
    );
  }

  const isGuest = !user || (user as { is_anonymous?: boolean }).is_anonymous;

  if (isGuest) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-tertiary)]">
            <svg className="w-8 h-8 text-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <H2 className="text-base font-semibold">
              You&apos;re not signed in
            </H2>
            <p className="text-sm mt-1 text-fg-muted">
              Sign in to view and edit your profile
            </p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--on-primary)] transition-all hover:-translate-y-0.5"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-5">
      {/* Header */}
      <div>
        <H1 className="font-editorial text-h2">Profile</H1>
        <p className="text-sm mt-0.5 text-fg-muted">
          Manage your account information and preferences
        </p>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Identity card */}
      <SectionCard>
        <ProfileAvatarCard
          avatarUrl={preferences?.avatar_url}
          initials={initials}
          displayName={displayName}
          email={user?.email}
          onAvatarUpdate={handleAvatarUpdate}
        />
        <div className="border-t border-[var(--border)] pt-4">
          <ProfileNameCard
            currentName={preferences?.full_name || ""}
            onSave={handleNameSave}
          />
        </div>
      </SectionCard>

      {/* Security card */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest text-fg-subtle">Security</span>
        </div>
        <ProfilePasswordCard onSave={handlePasswordSave} />
      </SectionCard>

      {/* Account info */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest text-fg-subtle">Account</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Email</span>
            <span className="text-sm font-medium text-fg">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Account ID</span>
            <span className="text-xs font-mono text-fg-subtle">
              {user?.id?.slice(0, 8)}…
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
