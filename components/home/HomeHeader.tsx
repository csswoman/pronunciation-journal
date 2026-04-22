"use client";

import { useRouter } from "next/navigation";
import { Play, Sparkles } from "lucide-react";
import ConversationIllustration from "@/components/illustrations/ConversationIllustration";
import PageHeader from "@/components/layout/PageHeader";

export default function HomeHeader() {
  const router = useRouter();

  return (
    <PageHeader
      badge="English Journey"
      title="Welcome back,"
      subtitle="Karla!"
      description="Keep going! You're doing great with your English journey."
      primaryCta={{
        label: "Continue Learning",
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
