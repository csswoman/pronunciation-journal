export const STAT_CARDS = [
  {
    id: "streak",
    icon: "🔥",
    label: "Day Streak",
    bg: "#EEE8FF",
    deco: "#C4B0FF",
    iconBg: "#DDD0FF",
    valueColor: "#6B3FD4",
    labelColor: "#8B6ED8",
  },
  {
    id: "accuracy",
    icon: "🎯",
    label: "Accuracy",
    suffix: "%",
    bg: "#E0F5EE",
    deco: "#9EE8C8",
    iconBg: "#C2EDD9",
    valueColor: "#0F7A56",
    labelColor: "#2E9A71",
  },
  {
    id: "xp",
    icon: "⚡",
    label: "XP Earned",
    bg: "#FFF3E0",
    deco: "#FFCC80",
    iconBg: "#FFE0B0",
    valueColor: "#C07800",
    labelColor: "#C88D00",
  },
  {
    id: "goal",
    icon: "📅",
    label: "Weekly Goal",
    suffix: "/5",
    bg: "#FFE8EE",
    deco: "#FFB3C6",
    iconBg: "#FFD0DC",
    valueColor: "#C0294A",
    labelColor: "#C94067",
  },
] as const;

type StatCardConfig = (typeof STAT_CARDS)[number];

interface StatCardProps {
  card: StatCardConfig;
  value: number | string;
}

export default function StatCard({ card, value }: StatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 cursor-default transition-transform duration-200 hover:-translate-y-1"
      style={{ background: card.bg, boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)" }}
    >
      {/* Decorative SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 180 130"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="155" cy="15" r="40" stroke={card.deco} strokeWidth="1.5" opacity="0.5" />
        <circle cx="155" cy="15" r="26" stroke={card.deco} strokeWidth="1" opacity="0.3" />
        <circle cx="20" cy="110" r="30" stroke={card.deco} strokeWidth="1.5" opacity="0.3" />
        <circle cx="155" cy="15" r="4" fill={card.deco} opacity="0.7" />
        <circle cx="130" cy="40" r="3" fill={card.deco} opacity="0.5" />
        <circle cx="20" cy="60" r="5" fill={card.deco} opacity="0.35" />
        <path
          d="M0 90 Q40 70 80 90 Q120 110 160 80"
          stroke={card.deco}
          strokeWidth="1.5"
          opacity="0.3"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Icon */}
      <div
        className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3.5"
        style={{ background: card.iconBg }}
      >
        {card.icon}
      </div>

      {/* Value */}
      <div
        className="relative z-10 font-heading text-[30px] font-extrabold tracking-tight leading-none mb-1"
        style={{ color: card.valueColor }}
      >
        {value}
        {"suffix" in card && (
          <span className="text-base font-medium opacity-65">{card.suffix}</span>
        )}
      </div>

      {/* Label */}
      <p
        className="relative z-10 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: card.labelColor }}
      >
        {card.label}
      </p>
    </div>
  );
}

interface StatGridProps {
  streak: number;
  accuracy: number;
  xp: number;
  goal: number;
}

export function StatGrid({ streak, accuracy, xp, goal }: StatGridProps) {
  const values: Record<string, number> = { streak, accuracy, xp, goal };
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {STAT_CARDS.map((card) => (
        <StatCard key={card.id} card={card} value={values[card.id] ?? 0} />
      ))}
    </div>
  );
}
