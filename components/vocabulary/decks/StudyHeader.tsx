import { ChevronLeft, Lightbulb } from "lucide-react";
import Button from "@/components/ui/Button";

interface StudyHeaderProps {
  deckName: string;
  progress: number;
  currentIndex: number;
  queueLength: number;
  showTip: boolean;
  onClose: () => void;
  onToggleTip: () => void;
}

export function StudyHeader({
  deckName,
  progress,
  currentIndex,
  queueLength,
  showTip,
  onClose,
  onToggleTip,
}: StudyHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Go back">
        <ChevronLeft size={20} />
      </Button>
      <span className="font-semibold text-sm shrink-0 text-fg">{deckName}</span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--btn-regular-bg)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--warning)",
          }}
        />
      </div>
      <span className="text-xs font-mono shrink-0 text-fg-subtle">
        {currentIndex + 1}/{queueLength}
      </span>
      <Button
        variant="outline"
        size="sm"
        icon={<Lightbulb size={13} />}
        onClick={onToggleTip}
        className="hidden lg:flex shrink-0"
      >
        {showTip ? "Hide tip" : "View tip"}
      </Button>
    </div>
  );
}
