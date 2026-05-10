"use client";

import { useCardStack, type ExerciseCard } from "@/hooks/useCardStack";
import ToolWidget from "./chat/ToolWidget";

const STACK_CONFIGS = [
  { translateY: 0, scale: 1, opacity: 1 },
  { translateY: 12, scale: 0.96, opacity: 0.6 },
  { translateY: 22, scale: 0.92, opacity: 0.3 },
] as const;

const TRANSITION = "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)";
const EXIT_TRANSITION = "all 0.35s ease-in";

function cardStyle(index: number, exiting: boolean): React.CSSProperties {
  // When exiting, shift all cards one position forward
  if (exiting && index === 0) {
    return {
      position: "relative",
      zIndex: 10,
      transform: "translateY(-48px) scale(0.95)",
      opacity: 0,
      transition: EXIT_TRANSITION,
      transformOrigin: "top center",
      pointerEvents: "none",
    };
  }

  const effectiveIndex = exiting ? index - 1 : index;
  const cfg = STACK_CONFIGS[Math.min(effectiveIndex, 2)];

  return {
    position: index === 0 ? "relative" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3 - effectiveIndex,
    transform: `translateY(${cfg.translateY}px) scale(${cfg.scale})`,
    opacity: cfg.opacity,
    transition: TRANSITION,
    transformOrigin: "top center",
    pointerEvents: index === 0 ? "auto" : "none",
  };
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-4 space-y-3 animate-pulse"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)" }}
    >
      <div className="h-3 rounded w-1/3" style={{ backgroundColor: "var(--line-divider)" }} />
      <div className="h-3 rounded w-2/3" style={{ backgroundColor: "var(--line-divider)" }} />
      <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--line-divider)" }} />
      <div className="flex gap-2 pt-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 rounded-lg flex-1" style={{ backgroundColor: "var(--line-divider)" }} />
        ))}
      </div>
    </div>
  );
}

function BackCard({ card }: { card: ExerciseCard }) {
  // Show a simplified card silhouette so the back of the stack looks like a card, not an exercise
  void card;
  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: "var(--line-divider)", backgroundColor: "var(--btn-regular-bg)", minHeight: 120 }}
    >
      <div className="h-3 rounded w-2/5" style={{ backgroundColor: "var(--line-divider)" }} />
      <div className="h-3 rounded w-3/5" style={{ backgroundColor: "var(--line-divider)" }} />
      <div className="h-3 rounded w-1/2 mt-2" style={{ backgroundColor: "var(--line-divider)" }} />
    </div>
  );
}

export default function CardStackView() {
  const { cards, initializing, exiting, onCardAnswer, advanceNow } = useCardStack();

  if (initializing) {
    return (
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="relative" style={{ paddingBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={cardStyle(i, false)}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-sm text-fg-subtle">No exercises available. Please try again.</p>
      </div>
    );
  }

  const visible = cards.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8">
      <div className="relative" style={{ paddingBottom: 28 }}>
        {/* Render in reverse so active card (index 0) is visually on top */}
        {[...visible].reverse().map((card, reversedI) => {
          const index = visible.length - 1 - reversedI;
          return (
            <div key={card.id} style={cardStyle(index, exiting)}>
              {index === 0 ? (
                <ToolWidget
                  toolCall={card.toolCall}
                  onAnswer={onCardAnswer}
                  onNext={advanceNow}
                />
              ) : (
                <BackCard card={card} />
              )}
            </div>
          );
        })}

        {/* Skeleton placeholder when buffer has fewer than 3 cards */}
        {visible.length < 3 && (
          <div style={cardStyle(visible.length, exiting)}>
            <SkeletonCard />
          </div>
        )}
      </div>
    </div>
  );
}
