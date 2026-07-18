import Link from "next/link";
import { Zap, ArrowRight, BookOpen } from "@/components/icons";
import Button from "@/components/ui/Button";

export default function HomeAiPracticeCard() {
  return (
    <div className="home-sidebar-card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="icon-wrap-hue flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Zap size={18} />
        </span>
        <span className="text-h4 text-fg">AI practice</span>
      </div>
      <p className="font-body-sm text-pretty text-fg-muted">
        Jump into a sounds session or explore practice topics.
      </p>

      <div className="mt-auto flex flex-wrap gap-2">
        <Link href="/practice/sounds">
          <Button variant="primary" size="md" icon={<ArrowRight size={18} />} iconPosition="right">
            Practice sounds
          </Button>
        </Link>
        <Link href="/practice">
          <Button variant="secondary" size="md" icon={<BookOpen size={18} />}>
            Topics
          </Button>
        </Link>
      </div>
    </div>
  );
}
