"use client";

import { useRouter } from "next/navigation";
import { Play } from "@/components/icons";
import Button from "@/components/ui/Button";

interface HomeHeaderActionsProps {
  hasStartedLearning: boolean;
}

export default function HomeHeaderActions({ hasStartedLearning }: HomeHeaderActionsProps) {
  const router = useRouter();

  return (
    <Button
      variant="primary"
      size="md"
      icon={<Play size={18} className="fill-current" />}
      onClick={() => router.push("/courses")}
    >
      {hasStartedLearning ? "Continue course" : "Explore courses"}
    </Button>
  );
}
