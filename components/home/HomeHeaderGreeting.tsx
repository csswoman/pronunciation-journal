import { CalendarDays } from "lucide-react";

interface HomeHeaderGreetingProps {
  userName: string;
  dateLabel: string;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeHeaderGreeting({ userName, dateLabel }: HomeHeaderGreetingProps) {
  const greeting = getTimeGreeting();

  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
        <CalendarDays size={11} />
        {dateLabel}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        {greeting},{" "}
        <span className="text-[var(--primary)]">{userName}</span>
      </h1>
    </div>
  );
}
