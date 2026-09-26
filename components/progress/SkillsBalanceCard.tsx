// Planned structure:
// <SkillsBalanceCard>
//   <PastelCard tone="lilac">
//     <CardHeader>
//       <TitleBlock />
//       <ComparisonBadge comparisonLabel={comparisonLabel} />
//     </CardHeader>
//     <GridBody>
//       <RadarChart scores={scores} />
//       <HorizontalSkillBars scores={scores} />
//     </GridBody>
//     <HighlightsFooter best={bestSkill} worst={worstSkill} />
//   </PastelCard>
// </SkillsBalanceCard>

import PastelCard from "@/components/layout/PastelCard";
import { isFluencyProfileEmpty, type FluencyScores, type SkillKey } from "@/lib/progress/fluency-scores";

interface Props {
  scores?: FluencyScores | null;
  comparisonLabel?: string;
}

const SKILL_ITEMS: { key: SkillKey; label: string }[] = [
  { key: "pronunciation", label: "Pronunciación" },
  { key: "listening", label: "Escucha" },
  { key: "reading", label: "Lectura" },
  { key: "speaking", label: "Habla" },
  { key: "grammar", label: "Gramática" },
  { key: "vocabulary", label: "Vocabulario" },
];

const RADAR_SKILLS: { key: SkillKey; label: string }[] = [
  { key: "pronunciation", label: "PRONUNCIACIÓN" },
  { key: "grammar", label: "GRAMÁTICA" },
  { key: "vocabulary", label: "VOCABULARIO" },
  { key: "listening", label: "ESCUCHA" },
  { key: "speaking", label: "HABLA" },
  { key: "reading", label: "LECTURA" },
];

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 92;
const RINGS = [0.33, 0.66, 1];

function polarPoint(index: number, total: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * RADIUS * ratio,
    y: CENTER + Math.sin(angle) * RADIUS * ratio,
  };
}

function RadarChart({ scores }: { scores: FluencyScores }) {
  const total = RADAR_SKILLS.length;
  const points = RADAR_SKILLS.map((s, i) => polarPoint(i, total, Math.max(0.15, (scores[s.key] ?? 0) / 100)));
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[290px] sm:max-w-[310px] transition-transform duration-300 hover:scale-[1.02]"
        role="img"
        aria-label="Gráfico de radar de 6 dimensiones"
      >
        {/* Concentric rings */}
        {RINGS.map((ratio, i) => {
          const ring = RADAR_SKILLS.map((_, j) => {
            const p = polarPoint(j, total, ratio);
            return `${p.x},${p.y}`;
          }).join(" ");
          return (
            <polygon
              key={i}
              points={ring}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity={0.15}
              strokeWidth={1}
            />
          );
        })}

        {/* Spokes */}
        {RADAR_SKILLS.map((_, i) => {
          const p = polarPoint(i, total, 1);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={p.x}
              y2={p.y}
              stroke="var(--ink)"
              strokeOpacity={0.15}
              strokeWidth={1}
            />
          );
        })}

        {/* Value Polygon */}
        <polygon
          points={polygon}
          fill="var(--ink)"
          fillOpacity={0.25}
          stroke="var(--ink)"
          strokeWidth={2}
          strokeLinejoin="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Points & Labels */}
        {RADAR_SKILLS.map((s, i) => {
          const p = points[i];
          const labelPos = polarPoint(i, total, 1.25);
          return (
            <g key={s.key} className="group cursor-default">
              <circle cx={p.x} cy={p.y} r={3.5} fill="var(--ink)" className="transition-transform group-hover:scale-125" />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={700}
                letterSpacing="0.04em"
                fill="var(--ink)"
                className="select-none font-bold"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function SkillsBalanceCard({ scores, comparisonLabel }: Props) {
  const hasData = !!scores && !isFluencyProfileEmpty(scores);

  if (!hasData) {
    return (
      <PastelCard tone="lilac" className="p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-sm">
        <div>
          <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
            BALANCE DE SKILLS
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight mt-1">
            6 dimensiones
          </h2>
        </div>
        <p className="my-6 text-center text-sm font-medium text-ink-secondary">
          Practica un poco más para ver tu balance de habilidades aquí.
        </p>
      </PastelCard>
    );
  }

  const safeScores = scores as FluencyScores;
  const values = SKILL_ITEMS.map((s) => ({ ...s, val: safeScores[s.key] ?? 0 }));
  const sorted = [...values].sort((a, b) => b.val - a.val);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <PastelCard tone="lilac" className="p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-sm">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-ink-secondary">
              BALANCE DE SKILLS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight mt-1">
              6 dimensiones
            </h2>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <span className="inline-flex items-center rounded-full bg-white/80 px-3.5 py-1 text-xs sm:text-sm font-bold text-ink shadow-xs transition-transform hover:scale-105">
              {comparisonLabel ?? "Mejorando esta semana"}
            </span>
            <span className="text-xs sm:text-sm text-ink-secondary font-medium">sobre 100 puntos</span>
          </div>
        </div>

        {/* Content Body: Radar + Horizontal Bars */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <RadarChart scores={safeScores} />

          {/* Horizontal Progress Bars */}
          <div className="flex flex-col gap-3.5">
            {values.map((item) => (
              <div key={item.key} className="flex items-center gap-3 group">
                <span className="w-28 sm:w-32 text-sm sm:text-base font-bold text-ink shrink-0 group-hover:translate-x-0.5 transition-transform">
                  {item.label}
                </span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-ink/15">
                  <div
                    className="h-full rounded-full bg-ink transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}
                  />
                </div>
                <span className="w-8 text-right font-display text-base sm:text-lg font-extrabold text-ink tabular-nums shrink-0">
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights Footer */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        <div className="rounded-2xl bg-white/85 p-4 shadow-xs transition-all hover:bg-white hover:shadow-sm">
          <span className="font-kicker text-xs font-bold uppercase tracking-wider text-ink-secondary block">
            MÁS CONSOLIDADA
          </span>
          <span className="font-display text-base sm:text-lg font-extrabold text-ink mt-0.5 block">
            {best.label} · {best.val} pts
          </span>
        </div>

        <div className="rounded-2xl bg-butter p-4 shadow-xs transition-all hover:brightness-105 hover:shadow-sm">
          <span className="font-kicker text-xs font-bold uppercase tracking-wider text-ink-secondary block">
            A PRIORIZAR EN TU PRÁCTICA
          </span>
          <span className="font-display text-base sm:text-lg font-extrabold text-ink mt-0.5 block">
            {worst.label} · {worst.val} pts
          </span>
        </div>
      </div>
    </PastelCard>
  );
}
