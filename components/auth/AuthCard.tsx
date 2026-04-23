"use client";

import { Mic } from "lucide-react";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="w-full max-w-[420px] rounded-3xl p-9 pb-7"
      style={{
        background: "#14171f",
        border: "1px solid #1e2330",
        boxShadow: "0 32px 80px #00000060, inset 0 0 0 0.5px #ffffff08",
        animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Logo row */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, #000))",
            boxShadow: "0 8px 24px color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <Mic className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1
            className="text-[19px] font-bold tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif", color: "#eef0f7" }}
          >
            Pronunciation Journal
          </h1>
          <p className="text-[12.5px] mt-0.5" style={{ color: "#6b7191" }}>
            Sincroniza tus palabras.{" "}
            <span style={{ color: "color-mix(in srgb, var(--color-accent) 80%, white)" }}>
              Mejora tu pronunciación.
            </span>
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}
