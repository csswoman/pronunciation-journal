import Link from "next/link";
import { Zap, ArrowRight, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HomeAiPracticeCard() {
  return (
    <div className="home-sidebar-card flex flex-col gap-3">
      <span className="font-kicker">AI</span>
      <div className="flex items-center gap-2">
        <span className="icon-wrap-hue flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Zap size={18} />
        </span>
        <span className="font-label font-semibold text-fg">Practice</span>
      </div>
      <p className="font-caption text-pretty leading-relaxed text-fg-muted">
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
