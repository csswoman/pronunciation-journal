"use client";

import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";

interface StudyEmptyStatesProps {
  phase: "loading" | "studying" | "done";
  deckName: string;
  queueLength: number;
  onClose: () => void;
}

const centeredOverlay = (children: React.ReactNode) => (
  <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center p-4">
    {children}
  </div>
);

export function StudyEmptyStates({
  phase,
  deckName,
  queueLength,
  onClose,
}: StudyEmptyStatesProps) {
  if (phase === "loading") {
    return centeredOverlay(
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
      />
    );
  }

  if (phase === "done" || queueLength === 0) {
    return centeredOverlay(
      <div
        className="max-w-sm w-full rounded-2xl border p-8 text-center space-y-5"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
        }}
      >
        <div className="text-5xl">🎉</div>
        <H2 className="text-h4">All caught up!</H2>
        <p className="text-sm text-fg-muted">
          No cards due in <strong>{deckName}</strong>.
        </p>
        <Button variant="primary" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return null;
}
