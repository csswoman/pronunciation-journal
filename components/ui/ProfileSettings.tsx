"use client";

import { useState } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/auth/AuthProvider";
import ProfileAvatarCard from "@/components/profile/ProfileAvatarCard";
import ProfileNameCard from "@/components/profile/ProfileNameCard";
import ProfilePasswordCard from "@/components/profile/ProfilePasswordCard";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{
        background: type === "success" ? "var(--success-soft)" : "var(--error-soft)",
        border: `1px solid ${type === "success" ? "var(--success)" : "var(--error)"}`,
        color: type === "success" ? "var(--success)" : "var(--error)",
      }}
    >
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
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
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
        <div className="flex items-center gap-3" style={{ color: "var(--text-secondary)" }}>
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
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-tertiary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              You&apos;re not signed in
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Sign in to view and edit your profile
            </p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
            }}
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
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Profile</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
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
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <ProfileNameCard
            currentName={preferences?.full_name || ""}
            onSave={handleNameSave}
          />
        </div>
      </SectionCard>

      {/* Security card */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-tertiary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Security</span>
        </div>
        <ProfilePasswordCard onSave={handlePasswordSave} />
      </SectionCard>

      {/* Account info */}
      <SectionCard>
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text-tertiary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>Account</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Email</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Account ID</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
              {user?.id?.slice(0, 8)}…
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
