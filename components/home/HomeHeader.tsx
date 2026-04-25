"use client";

import { useRouter } from "next/navigation";
import { Play, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import ConversationIllustration from "@/components/illustrations/ConversationIllustration";
import PageHeader from "@/components/layout/PageHeader";

export default function HomeHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);

  const userName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Guest";
  const hasStartedLearning = progressList.length > 0;

  return (
    <PageHeader
      badge="English Journey"
      title="Welcome back,"
      subtitle={`${userName}!`}
      description="Keep going! You're doing great with your English journey."
      primaryCta={{
        label: hasStartedLearning ? "Continue Learning" : "Start Learning",
        icon: <Play size={14} className="fill-current" />,
        onClick: () => router.push("/courses"),
      }}
      secondaryCta={{
        label: "Practice with AI",
        icon: <Sparkles size={14} />,
        onClick: () => router.push("/ai-practice"),
      }}
      illustration={<ConversationIllustration />}
    />
  );
}
