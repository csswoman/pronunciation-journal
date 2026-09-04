"use client";

// Planned structure:
// <HomePlanRationale>
//   collapsible "Por qué este plan" note with headline + optional detail
// </HomePlanRationale>

import { useState } from "react";
import { ChevronDown, Sparkles } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  derivePlanRationale,
  type PlanRationaleInput,
} from "@/lib/home/plan-rationale";

interface HomePlanRationaleProps extends PlanRationaleInput {
  /** Hide until the plan has actually settled to avoid a flash of stale reasoning. */
  ready: boolean;
}

/** Point-of-use "explicabilidad": why today's daily plan looks like it does. */
export default function HomePlanRationale({ ready, ...signals }: HomePlanRationaleProps) {
  const [open, setOpen] = useState(false);
  const rationale = ready ? derivePlanRationale(signals) : null;

  if (!rationale) return null;

  return (
    <div className="mb-3 rounded-md border border-border-subtle bg-surface-sunken/60">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-raised"
      >
        <Sparkles size={16} className="shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1 font-body-sm text-pretty text-fg-muted">
          Por qué este plan
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("shrink-0 text-fg-muted transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t border-border-subtle px-3 py-2">
          <p className="font-body-sm text-pretty text-fg">{rationale.headline}</p>
          {rationale.detail ? (
            <p className="mt-1 font-body-sm text-pretty text-fg-muted">{rationale.detail}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
