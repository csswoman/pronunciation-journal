import { CalendarDays } from "lucide-react";

interface HomeHeaderGreetingProps {
  userName: string;
  dateLabel: string;
}

type TimeSlot = "morning" | "afternoon" | "evening";

function getTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

const GREETINGS: Record<TimeSlot, { greeting: string; sub: string }> = {
  morning:   { greeting: "Good morning",   sub: "Ready to train your ear?" },
  afternoon: { greeting: "Good afternoon", sub: "A good time to practice." },
  evening:   { greeting: "Good evening",   sub: "Wind down with some English." },
};

export default function HomeHeaderGreeting({ userName, dateLabel }: HomeHeaderGreetingProps) {
  const slot = getTimeSlot();
  const { greeting, sub } = GREETINGS[slot];
  const displayName = userName && userName !== "there" ? userName : null;

  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-fg-subtle">
        <CalendarDays size={11} aria-hidden />
        {dateLabel}
      </p>
      <h1 className="font-editorial text-[1.65rem] font-[440] tracking-[-0.02em] leading-[1.2] text-fg">
        {greeting}
        {displayName && (
          <>, <span className="text-primary">{displayName}</span></>
        )}.
      </h1>
      <p className="text-[0.8125rem] text-fg-muted">{sub}</p>
    </div>
  );
}
