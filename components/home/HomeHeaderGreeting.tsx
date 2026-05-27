import { CalendarDays } from "lucide-react";

interface HomeHeaderGreetingProps {
  userName: string;
  dateLabel: string;
}

export default function HomeHeaderGreeting({ userName, dateLabel }: HomeHeaderGreetingProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
        <CalendarDays size={11} />
        {dateLabel}
      </p>
      <h1
        className="text-3xl font-light leading-tight tracking-tight"
        style={{ fontFamily: "var(--font-editorial), serif", fontOpticalSizing: "auto" } as React.CSSProperties}
      >
        Good to see you,{" "}
        <em className="not-italic font-light text-[var(--primary)]">{userName}</em>
      </h1>
    </div>
  );
}
