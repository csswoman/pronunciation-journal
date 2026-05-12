"use client";

import { useRouter } from "next/navigation";
import { Play, MessageSquareText } from "lucide-react";
import Button from "@/components/ui/Button";

interface HomeHeaderActionsProps {
  hasStartedLearning: boolean;
}

export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-3 flex-wrap">
      <Button
        onClick={() => router.push("/courses")}
        size="sm"
        icon={<Play size={14} className="fill-current" />}
        className="shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
        style={{ padding: "var(--space-2) var(--space-4)" }}
      >
        {hasStartedLearning ? "Continue learning" : "Start learning"}
      </Button>
      <Button
        onClick={() => router.push("/practice")}
        variant="secondary"
        size="sm"
        icon={<MessageSquareText size={14} />}
        style={{ padding: "var(--space-2) var(--space-4)" }}
      >
        Practice with AI
      </Button>
    </div>
  );
}
