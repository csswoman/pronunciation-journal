"use client";

import { useRouter } from "next/navigation";
import { Play, Zap } from "lucide-react";

interface HomeHeaderActionsProps {
  hasStartedLearning: boolean;
}

export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => router.push("/courses")}
        className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
      >
        <Play size={13} className="fill-current" />
        {hasStartedLearning ? "Continue learning" : "Start learning"}
      </button>
      <button
        onClick={() => router.push("/daily")}
        className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
      >
        <Zap size={13} />
        Daily practice
      </button>
    </div>
  );
}
