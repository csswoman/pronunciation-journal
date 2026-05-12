"use client";

import { Check, ArrowRight, ClipboardList, Zap } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";
import Button from "@/components/ui/Button";
import Badge, { BadgeColor } from "@/components/ui/Badge";

type ActivityType = "Pronunciation" | "Theory" | "Shadowing" | "Word Bank" | "Listening";

interface TodoItem {
  id: number;
  label: string;
  tag: ActivityType;
  minutes: number;
  done: boolean;
  featured?: boolean;
}

const TAG_COLOR: Record<ActivityType, BadgeColor> = {
  Pronunciation: "sky",
  Theory:        "violet",
  Shadowing:     "teal",
  "Word Bank":   "emerald",
  Listening:     "amber",
};

const TODO_ITEMS: TodoItem[] = [
  { id: 1, label: "Vowel sounds: /ɪ/ vs /iː/",            tag: "Pronunciation", minutes: 8,  done: true  },
  { id: 2, label: "Present Perfect vs Past Simple",        tag: "Theory",        minutes: 12, done: true  },
  { id: 3, label: 'Tongue twister: "She sells seashells"', tag: "Shadowing",     minutes: 6,  done: false, featured: true },
  { id: 4, label: "Review 12 words (SRS)",                 tag: "Word Bank",     minutes: 5,  done: false },
  { id: 5, label: "Audio of the day · BBC clip",           tag: "Listening",     minutes: 10, done: false },
];

const completed = TODO_ITEMS.filter((t) => t.done).length;
const total = TODO_ITEMS.length;
const remaining = TODO_ITEMS.filter((t) => !t.done).reduce((s, t) => s + t.minutes, 0);
const progress = Math.round((completed / total) * 100);

export default function HomeTodo() {
  return (
    <Card variant="compact" className="gap-4">
      <div className="flex items-center justify-between">
        <CardHeader
          icon={<ClipboardList size={18} className="text-[var(--primary)]" />}
          title="Today's plan"
        />
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-tertiary)]">{remaining} min left</span>
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1.5">
        {TODO_ITEMS.map((item, i) => {
          const isNext = !item.done && TODO_ITEMS.slice(0, i).every((t) => t.done);
          const segmentClass = item.done
            ? "bg-[var(--success)]"
            : isNext
              ? "bg-[var(--primary)]"
              : "bg-border-default";
          return (
            <div
              key={item.id}
              className={`h-1.5 flex-1 rounded-full ${segmentClass}`}
            />
          );
        })}
      </div>

      {/* Items */}
      <div className="flex flex-col">
        {TODO_ITEMS.map((item, idx) => (
          <div
            key={item.id}
            className={[
              "group flex items-center gap-3 px-3 py-3 transition-colors",
              idx < TODO_ITEMS.length - 1 ? "border-b border-border-subtle" : "",
              !item.done && item.featured
                ? "bg-[color-mix(in_oklch,var(--primary)_6%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary)_10%,transparent)]"
                : !item.done
                  ? "hover:bg-[var(--bg-tertiary)]"
                  : "",
            ].filter(Boolean).join(" ")}
          >
            {/* Status dot */}
            <div className={[
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              item.done
                ? "bg-[var(--success-soft)] text-[var(--success)]"
                : item.featured
                  ? "bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] text-[var(--primary)]"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]",
            ].join(" ")}>
              {item.done ? (
                <Check size={12} strokeWidth={3} />
              ) : item.featured ? (
                <Zap size={11} />
              ) : (
                <span className="text-tiny font-semibold leading-none">·</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={[
                "text-sm font-medium leading-snug truncate",
                item.done ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]",
              ].join(" ")}>
                {item.label}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge label={item.tag} color={TAG_COLOR[item.tag]} />
                <span className="text-xs text-[var(--text-tertiary)]">· {item.minutes} min</span>
              </div>
            </div>

            {/* Action */}
            {!item.done && (
              <Button
                variant={item.featured ? "secondary" : "ghost"}
                size="sm"
                className={[
                  "shrink-0 text-tiny",
                  !item.featured && "opacity-0 group-hover:opacity-100",
                ].filter(Boolean).join(" ")}
                icon={<ArrowRight size={item.featured ? 11 : 13} />}
                iconPosition="right"
              >
                {item.featured ? "Start" : ""}
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
