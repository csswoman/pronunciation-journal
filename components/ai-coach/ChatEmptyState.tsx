"use client";

import type { ResolvedStarter } from "@/lib/ai-practice/starters/types";
import CoachGreeting from "./starters/CoachGreeting";
import CoachStarterList from "./starters/CoachStarterList";
import CoachShortcutRail from "./starters/CoachShortcutRail";

// Planned structure:
// <ChatEmptyState>
//   <CoachGreeting />
//   <CoachStarterList />
//   <CoachShortcutRail />
// </ChatEmptyState>

interface ChatEmptyStateProps {
  starters?: ResolvedStarter[] | null;
  loading?: boolean;
  onSelectStarter?: (starter: ResolvedStarter) => void;
  onSendMessage: (text: string) => void;
}

export default function ChatEmptyState({
  starters = null,
  loading = false,
  onSelectStarter,
  onSendMessage,
}: ChatEmptyStateProps) {
  return (
    <div className="@container relative flex min-h-full flex-1 flex-col justify-center chat-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-3 py-6 @[22rem]:px-4 @[22rem]:py-8">
        <CoachGreeting />
        <CoachStarterList starters={starters} loading={loading} onSelect={onSelectStarter ?? (() => {})} />
        <CoachShortcutRail onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}
