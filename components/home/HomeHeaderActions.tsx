"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

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
        {hasStartedLearning ? "Start today's plan" : "Start today's plan"}
      </button>
      <button
        onClick={() => router.push("/courses")}
        className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
      >
        Browse courses
      </button>
    </div>
  );
}
