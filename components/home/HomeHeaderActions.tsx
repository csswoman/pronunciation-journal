"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import Button from "@/components/ui/Button";

interface HomeHeaderActionsProps {
  hasStartedLearning: boolean;
}

export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        icon={<Play size={14} className="fill-current" />}
        onClick={() => router.push("/courses")}
      >
        {hasStartedLearning ? "Continue course" : "Explore courses"}
      </Button>
    </div>
  );
}
