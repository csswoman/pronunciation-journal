"use client";

import { TrendingUp, Lock, Activity } from "lucide-react";

export function AuthTrustBar() {
  return (
    <div className="flex justify-center gap-5 pt-4 flex-wrap" style={{ borderTop: "1px solid #1e2330" }}>
      {[
        { icon: <TrendingUp className="w-3 h-3" />, label: "Sincronización en la nube" },
        { icon: <Lock className="w-3 h-3" />, label: "Seguro y privado" },
        { icon: <Activity className="w-3 h-3" />, label: "Mejora continua" },
      ].map(({ icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#4a5070" }}>
          {icon}
          {label}
        </div>
      ))}
    </div>
  );
}
