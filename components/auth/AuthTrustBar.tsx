"use client";

import { TrendingUp, Lock, Activity } from "lucide-react";

export function AuthTrustBar() {
  return (
    <div className="flex justify-center gap-5 pt-4 flex-wrap border-t border-border-default">
      {[
        { icon: <TrendingUp className="w-3 h-3" />, label: "Cloud sync" },
        { icon: <Lock className="w-3 h-3" />,       label: "Private & secure" },
        { icon: <Activity className="w-3 h-3" />,   label: "Track progress" },
      ].map(({ icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-fg-muted">
          {icon}
          {label}
        </div>
      ))}
    </div>
  );
}
