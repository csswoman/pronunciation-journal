import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  variant?: "underline" | "segmented";
  className?: string;
}

export default function Tabs<T extends string>({
  items,
  active,
  onChange,
  variant = "underline",
  className,
}: TabsProps<T>) {
  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        className={cn(
          "inline-flex items-center gap-1 rounded-xl bg-field p-1 border border-border-subtle",
          className
        )}
      >
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(item.id)}
              className={cn(
                "focus-ring press-feedback flex items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 font-label text-caption font-semibold transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-surface text-fg shadow-sm border border-border-strong"
                  : "text-fg-muted hover:text-fg hover:bg-surface-raised/50"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 text-tiny font-bold",
                    isActive ? "bg-primary-soft text-primary" : "bg-border-subtle text-fg-muted"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn("flex w-full border-b border-border-subtle gap-1", className)}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "focus-ring press-feedback -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 font-label text-caption font-semibold transition-all duration-150 cursor-pointer bg-transparent",
              isActive
                ? "border-accent text-accent font-bold"
                : "border-transparent text-fg-muted hover:border-border-strong hover:text-fg"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-tiny font-bold",
                  isActive ? "bg-primary-soft text-primary" : "bg-field text-fg-muted"
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
