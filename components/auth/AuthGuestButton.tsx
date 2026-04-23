"use client";

import { User, ArrowRight } from "lucide-react";

interface AuthGuestButtonProps {
  onClick: () => void;
  pending: boolean;
}

export function AuthGuestButton({ onClick, pending }: AuthGuestButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[10px] text-left transition-all disabled:opacity-50 mb-6 group"
      style={{ background: "rgba(32,36,51,0.5)", border: "1px solid #1e2330" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#1e2233";
        e.currentTarget.style.borderColor = "#2e3450";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(32,36,51,0.5)";
        e.currentTarget.style.borderColor = "#1e2330";
      }}
    >
      <div
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: "#1a1d27" }}
      >
        <User className="w-[18px] h-[18px]" style={{ color: "#6b7191" }} />
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-semibold" style={{ color: "#eef0f7" }}>
          Continuar como invitado
        </p>
        <p className="text-[12.5px]" style={{ color: "#6b7191" }}>
          Explora la app sin crear una cuenta
        </p>
      </div>
      <ArrowRight className="w-4 h-4 transition-colors" style={{ color: "#4a5070" }} />
    </button>
  );
}
