"use client";

type Mode = "login" | "register";

interface AuthTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
  return (
    <div
      className="flex relative rounded-[14px] p-1 mb-7"
      style={{ background: "#1a1d27", border: "1px solid #1e2330" }}
    >
      <div
        className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-[10px] transition-transform duration-300"
        style={{
          left: "4px",
          background: "var(--color-accent)",
          transform: mode === "register" ? "translateX(calc(100%))" : "translateX(0)",
          transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />

      <button
        type="button"
        onClick={() => onModeChange("login")}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-medium rounded-[10px] relative z-10 transition-colors duration-200"
        style={{ color: mode === "login" ? "white" : "#6b7191" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign in
      </button>

      <button
        type="button"
        onClick={() => onModeChange("register")}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[14px] font-medium rounded-[10px] relative z-10 transition-colors duration-200"
        style={{ color: mode === "register" ? "white" : "#6b7191" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        Create account
      </button>
    </div>
  );
}
