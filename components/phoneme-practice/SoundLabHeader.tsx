"use client";

interface Props {
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
}

export function SoundLabHeader({ totalCount, completedCount, inProgressCount }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="sound-lab__headline">
        Speak <b>better</b>,{" "}
        <em>one sound</em> at a time.
      </h1>
      <p className="sound-lab__stats-line">
        <span>{totalCount} sounds</span>
        <span className="sound-lab__stats-sep" aria-hidden>·</span>
        <span>{completedCount} completed</span>
        <span className="sound-lab__stats-sep" aria-hidden>·</span>
        <span>
          <span className="font-semibold text-[color:oklch(12%_0.01_none)]">{inProgressCount}</span>
          {" "}
          <span className="text-[color:var(--primary)]">in progress</span>
        </span>
      </p>
    </div>
  );
}
