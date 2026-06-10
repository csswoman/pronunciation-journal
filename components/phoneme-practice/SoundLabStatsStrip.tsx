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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    if (started.current || target === 0) {
      if (target === 0) setValue(0);
      return;
    }
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
    <div className="flex flex-col items-end gap-0.5">
      <b className={`sound-lab__stat-num${accent ? " sound-lab__stat-num--accent" : ""}`}>{displayed}</b>
      <span className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--text-tertiary)]">{label}</span>
    </div>
  );
}

export function SoundLabStatsStrip({ totalCount, completedCount, inProgressCount }: Props) {
  return (
    <div className="flex items-end gap-6 pb-0.5">
      <StatCell value={totalCount} label="Sounds" />
      <StatCell value={completedCount} label="Completed" />
      <StatCell value={inProgressCount} label="In progress" accent />
    </div>
  );
}
