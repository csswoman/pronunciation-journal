"use client";

import { Check, ArrowRight, ClipboardList, Zap } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";

interface TodoItem {
  id: number;
  label: string;
  tag: string;
  tagVariant: BadgeVariant;
  minutes: number;
  done: boolean;
  featured?: boolean;
}

const TODO_ITEMS: TodoItem[] = [
  { id: 1, label: "Vowel sounds: /ɪ/ vs /iː/",            tag: "Pronunciation", tagVariant: "success", minutes: 8,  done: true  },
  { id: 2, label: "Present Perfect vs Past Simple",        tag: "Theory",        tagVariant: "default", minutes: 12, done: true  },
  { id: 3, label: 'Tongue twister: "She sells seashells"', tag: "Shadowing",     tagVariant: "info",    minutes: 6,  done: false, featured: true },
  { id: 4, label: "Review 12 words (SRS)",                 tag: "Word Bank",     tagVariant: "warning", minutes: 5,  done: false },
  { id: 5, label: "Audio of the day · BBC clip",           tag: "Listening",     tagVariant: "error",   minutes: 10, done: false },
];

const completed = TODO_ITEMS.filter((t) => t.done).length;
const total = TODO_ITEMS.length;
const remaining = TODO_ITEMS.filter((t) => !t.done).reduce((s, t) => s + t.minutes, 0);
const progress = Math.round((completed / total) * 100);

export default function HomeTodo() {
  return (
    <Card variant="compact" className="gap-4">
      <CardHeader
        icon={<ClipboardList size={18} className="text-[var(--primary)]" />}
        title="Today's plan"
        right={
          <span className="text-xs font-medium text-[var(--text-tertiary)]">
            {completed}/{total} done
          </span>
        }
      />

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-tiny text-[var(--text-tertiary)]">
          <span>{progress}% complete</span>
          <span>~{remaining} min left</span>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1">
        {TODO_ITEMS.map((item) => (
          <div
            key={item.id}
            className={[
              "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
              item.done
                ? "opacity-50"
                : item.featured
                  ? "bg-[color-mix(in_oklch,var(--primary)_6%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary)_10%,transparent)]"
                  : "hover:bg-[var(--bg-tertiary)]",
            ].filter(Boolean).join(" ")}
          >
            {/* Status dot */}
            <div
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={
                item.done
                  ? { backgroundColor: "var(--success-soft)", color: "var(--success)" }
                  : item.featured
                    ? { backgroundColor: "color-mix(in oklch, var(--primary) 18%, transparent)", color: "var(--primary)" }
                    : { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
              }
            >
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
                item.done ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]",
              ].join(" ")}>
                {item.label}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge label={item.tag} variant={item.tagVariant} />
                <span className="text-tiny text-[var(--text-tertiary)]">{item.minutes} min</span>
              </div>
            </div>

            {/* Action */}
            {!item.done && (
              <button
                className={[
                  "shrink-0 flex items-center gap-1 text-tiny font-semibold px-2.5 py-1 rounded-lg transition-all",
                  item.featured
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
                    : "text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                {item.featured ? <>Start <ArrowRight size={11} /></> : <ArrowRight size={13} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
