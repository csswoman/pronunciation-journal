import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-space-8 text-center px-space-6"
      style={{ backgroundColor: "var(--surface-base)" }}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-40 h-40 rounded-full blur-3xl opacity-30 animate-float-soft"
          style={{ backgroundColor: "var(--primary-soft)" }}
        />
        <span className="relative text-7xl animate-float-soft select-none">🗺️</span>
      </div>

      <div className="flex flex-col gap-space-3 max-w-sm">
        <h1
          className="text-h2 font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: "1.6" }}>
          This page doesn&apos;t exist or may have been moved.
        </p>
      </div>

      <Link
        href="/"
        className="accent-button inline-flex items-center gap-space-2 px-space-6 py-space-3 rounded-xl text-body-sm font-medium shadow-md"
      >
        ← Back to home
      </Link>
    </div>
  );
}
