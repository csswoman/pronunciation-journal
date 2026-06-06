import Link from "next/link";
import { Layers, MicVocal, BookOpen, BarChart2, Grid2x2, GraduationCap } from "lucide-react";
import type { ElementType } from "react";

// Planned structure:
// <HomeQuickActionsGrid>
//   <QuickActionCell /> × 6
// </HomeQuickActionsGrid>

const actions = [
  { title: "Decks", description: "Your vocabulary decks", href: "/words?tab=decks", Icon: Layers },
  { title: "Practice", description: "Sounds and pronunciation", href: "/practice/sounds", Icon: MicVocal },
  { title: "Courses", description: "Continue your course", href: "/courses", Icon: BookOpen },
  { title: "Progress", description: "Your stats and streaks", href: "/progress", Icon: BarChart2 },
  { title: "IPA Chart", description: "Phoneme reference table", href: "/ipa-chart", Icon: Grid2x2 },
  { title: "Mini Lesson", description: "Today's grammar bite", href: "/mini-lessons", Icon: GraduationCap },
] as const;

function QuickActionCell({
  title,
  description,
  href,
  Icon,
}: {
  title: string;
  description: string;
  href: string;
  Icon: ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
        <Icon size={18} aria-hidden />
      </span>
      <div>
        <p className="font-body-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="font-caption text-[var(--text-tertiary)]">{description}</p>
      </div>
    </Link>
  );
}

export default function HomeQuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <QuickActionCell key={action.href} {...action} />
      ))}
    </div>
  );
}
