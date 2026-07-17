import { CalendarDays } from "@/components/icons";

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
  morning: { greeting: "Buenos días", sub: "Un buen momento para entrenar el oído." },
  afternoon: { greeting: "Buenas tardes", sub: "Un buen momento para practicar." },
  evening: { greeting: "Buenas noches", sub: "Cierra el día con un poco de inglés." },
};

export default function HomeHeaderGreeting({ userName, dateLabel }: HomeHeaderGreetingProps) {
  const slot = getTimeSlot();
  const { greeting, sub } = GREETINGS[slot];
  const displayName = userName && userName !== "there" ? userName : null;

  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 font-kicker text-fg-subtle">
        <CalendarDays size={14} aria-hidden />
        {dateLabel}
      </p>
      <h1 className="text-h2 font-bold tracking-[-0.02em] leading-[1.2] text-fg">
        {greeting}
        {displayName && (
          <>, <span className="text-primary">{displayName}</span></>
        )}
        .
      </h1>
      <p className="text-label text-fg-muted">{sub}</p>
    </div>
  );
}
