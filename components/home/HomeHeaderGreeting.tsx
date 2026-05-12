import { CalendarDays } from "lucide-react";

interface HomeHeaderGreetingProps {
  userName: string;
  dateLabel: string;
}

export default function HomeHeaderGreeting({ userName, dateLabel }: HomeHeaderGreetingProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">Welcome back</p>
      <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
        {userName}!
      </h1>
      <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mt-1.5">
        <CalendarDays size={12} />
        {dateLabel} · Keep up the streak
      </p>
    </div>
  );
}
