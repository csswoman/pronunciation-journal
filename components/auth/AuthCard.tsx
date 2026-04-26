"use client";

import { Mic } from "lucide-react";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="w-full max-w-[420px] rounded-3xl p-9 pb-7 relative z-10"
      style={{
        background: "#14171f",
        border: "1px solid #1e2330",
        boxShadow: "0 32px 80px #00000060",
        animation: "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Logo row */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--color-accent)" }}
        >
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1
            className="text-[18px] font-bold tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif", color: "#eef0f7" }}
          >
            English Journal
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: "#6b7191" }}>
            Practice pronunciation.{" "}
            <span style={{ color: "var(--color-accent)" }}>Track your progress.</span>
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
