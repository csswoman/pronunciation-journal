"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  completedCount: number;
  inProgressCount: number;
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function StatCell({ value, label }: { value: number; label: string }) {
  const displayed = useCountUp(value);
  return (
    <div className="flex items-baseline gap-space-2 px-space-6">
      <span className="font-heading text-h4 text-fg">{displayed}</span>
      <span className="text-tiny uppercase tracking-wider text-fg-muted">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-5 w-px flex-shrink-0 bg-border-subtle" />;
}

export function SoundLabStatsStrip({ totalCount, currentPage, totalPages, completedCount, inProgressCount }: Props) {
  const displayedPage = useCountUp(currentPage);
  const displayedTotal = useCountUp(totalPages);

  return (
    <div className="mb-space-8 flex items-center overflow-x-auto rounded-lg bg-surface-sunken py-space-4">
      <StatCell value={totalCount} label="exercises" />
      <Divider />
      <div className="flex items-baseline gap-space-2 px-space-6">
        <span className="font-heading text-h4 text-fg">{displayedPage}</span>
        <span className="text-tiny uppercase tracking-wider text-fg-muted">/</span>
        <span className="font-heading text-h4 text-fg">{displayedTotal}</span>
        <span className="text-tiny uppercase tracking-wider text-fg-muted">pages</span>
      </div>
      <Divider />
      <StatCell value={completedCount} label="completed" />
      <Divider />
      <StatCell value={inProgressCount} label="in progress" />
    </div>
  );
}
