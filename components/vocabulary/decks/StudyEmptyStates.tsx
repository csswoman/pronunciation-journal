"use client";

import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { getIllustration } from "@/lib/illustrations/registry";

interface StudyEmptyStatesProps {
  phase: "loading" | "studying" | "done";
  deckName: string;
  queueLength: number;
  onClose: () => void;
}

const Illustration = getIllustration("stateCompletado");

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
  const words = useLoadingWords();

  if (phase === "loading") {
    return centeredOverlay(<WordCarousel words={words} />);
  }

  if (phase === "done" || queueLength === 0) {
    return centeredOverlay(
      <div
        className="max-w-sm w-full rounded-2xl border layout-card-pad text-center space-y-5"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
        }}
      >
        {/* Height-only box: koboyo art is non-square (see registry.ts). */}
        <div
          className="mx-auto flex h-20 items-center justify-center text-primary [&>svg]:h-full [&>svg]:w-auto"
          aria-hidden="true"
        >
          <Illustration />
        </div>
        <H2 className="text-h4">All caught up!</H2>
        <p className="text-body-sm text-fg-muted">
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
