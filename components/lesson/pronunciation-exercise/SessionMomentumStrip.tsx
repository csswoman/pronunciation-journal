"use client";

import { Target, Check, RotateCcw, Flame, Clock } from "lucide-react";

interface Props {
  attempts: number;
  nailed: number;
  retries: number;
  streak: number;
  elapsed: number; // seconds
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

const DIVIDER = (
  <span className="text-border-strong text-body-sm select-none" aria-hidden>·</span>
);

interface StatItemProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="flex items-center gap-space-2">
      <span className="text-fg-subtle">{icon}</span>
      <span className="font-[family-name:var(--font-heading)] text-body-lg font-semibold text-fg tabular-nums">
        {value}
      </span>
      <span className="text-caption text-fg-muted">{label}</span>
    </div>
  );
}

export default function SessionMomentumStrip({ attempts, nailed, retries, streak, elapsed }: Props) {
  return (
    <div className="h-10 flex items-center gap-space-4 px-space-8 bg-surface-sunken border-b border-border-subtle shrink-0 overflow-x-auto">
      <StatItem icon={<Target className="w-3.5 h-3.5" />} value={attempts} label="attempts" />
      {DIVIDER}
      <StatItem icon={<Check className="w-3.5 h-3.5" />} value={nailed} label="nailed" />
      {DIVIDER}
      <StatItem icon={<RotateCcw className="w-3.5 h-3.5" />} value={retries} label="retries" />
      {DIVIDER}
      <StatItem icon={<Flame className="w-3.5 h-3.5" />} value={streak} label="streak" />
      {DIVIDER}
      <StatItem icon={<Clock className="w-3.5 h-3.5" />} value={formatTime(elapsed)} label="" />
    </div>
  );
}
