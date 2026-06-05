"use client";

import { useRouter } from "next/navigation";
import { Play, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";

interface HomeHeaderActionsProps {
  hasStartedLearning: boolean;
}

export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="ghost"
        size="md"
        icon={<Play size={16} className="fill-current" />}
        onClick={() => router.push("/courses")}
      >
        {hasStartedLearning ? "Continue learning" : "Start learning"}
      </Button>
      <Button
        variant="ghost"
        size="md"
        icon={<BookOpen size={16} />}
        onClick={() => router.push("/vocabulary")}
      >
        Explore vocabulary
      </Button>
    </div>
  );
}
