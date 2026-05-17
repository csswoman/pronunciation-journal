"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  totalCount: number;
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

function StatCell({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  const displayed = useCountUp(value);
  return (
    <div className="flex items-baseline gap-space-2">
      <span className={`font-heading text-h4 ${accent ? "text-primary" : "text-fg"}`}>
        {displayed}
      </span>
      <span className={`text-tiny uppercase tracking-wider ${accent ? "text-primary/70" : "text-fg-muted"}`}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-5 w-px flex-shrink-0 bg-border-subtle" />;
}

export function SoundLabStatsStrip({ totalCount, completedCount, inProgressCount }: Props) {
  return (
    <div className="flex items-center gap-space-5">
      <StatCell value={totalCount} label="lessons" />
      <Divider />
      <StatCell value={completedCount} label="completed" />
      <Divider />
      <StatCell value={inProgressCount} label="in progress" accent />
    </div>
  );
}
