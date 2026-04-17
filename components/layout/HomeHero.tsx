"use client";

import { useRouter } from "next/navigation";
import PageHeader from "./PageHeader";
import ConversationIllustration from "@/components/illustrations/ConversationIllustration";

export default function HomeHero() {
  const router = useRouter();

  return (
    <PageHeader
      badge="Daily Practice"
      title="Speak"
      subtitle="Confidently"
      description="Practice fast, track progress, and improve with AI feedback."
      primaryCta={{
        label: "Start Now",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
        ),
        onClick: () => router.push("/courses"),
      }}
      secondaryCta={{
        label: "Continue",
        onClick: () => router.push("/courses"),
      }}
      illustration={
        <ConversationIllustration className="w-[300px] xl:w-[340px]" />
      }
    />
  );
}
