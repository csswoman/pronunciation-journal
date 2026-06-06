import Link from "next/link";
import { Zap, ArrowRight, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HomeAiPracticeCard() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--cta-outline-border)] bg-surface-raised p-5">
      <div className="flex items-center gap-2">
        <span className="icon-wrap-hue flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Zap size={18} />
        </span>
        <span className="font-body-sm font-semibold text-[var(--text-primary)]">Practice</span>
      </div>

      <p className="font-caption leading-relaxed text-[var(--text-secondary)]">
        Jump into a sounds session or explore practice topics.
      </p>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link href="/practice/sounds">
          <Button variant="primary" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
            Practice sounds
          </Button>
        </Link>
        <Link href="/practice">
          <Button variant="secondary" size="sm" icon={<BookOpen size={13} />}>
            Topics
          </Button>
        </Link>
      </div>
    </div>
  );
}
