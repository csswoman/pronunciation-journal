import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";

// Sub-components: FrontalLipsRounded, FrontalLipsSpread, FrontalLipsNeutral
export {
  FrontalLipsTeethOnLip,
  FrontalLipsTongueBetweenTeeth,
  FrontalLipsClosed,
} from "./FrontalLipsSpecialShapes";

type GuideProps = { guide: PhonemeArticulationGuide };

export function FrontalLipsRounded({ guide }: GuideProps) {
  const isWide = guide.jawOpening === "wide";
  return (
    <g>
      {/* 1. Labios redondos proyectados en anillo */}
      <ellipse
        cx="100"
        cy="56"
        rx={isWide ? "48" : "40"}
        ry={isWide ? "38" : "32"}
        className="fill-primary-soft/80 stroke-primary"
        strokeWidth="2.4"
      />

      {/* 2. Orificio bucal circular interior */}
      <ellipse
        cx="100"
        cy="56"
        rx={isWide ? "24" : "15"}
        ry={isWide ? "20" : "13"}
        className="fill-surface-sunken stroke-primary"
        strokeWidth="2.2"
      />

      {/* 3. Borde sutil de los incisivos asomando arriba */}
      <path
        d={isWide ? "M 86,47 Q 100,50 114,47" : "M 91,49 Q 100,51 109,49"}
        fill="none"
        className="stroke-surface-raised"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* 4. Arrugas y pliegues naturales de labios fruncidos */}
      <line x1="100" y1="20" x2="100" y2="28" className="stroke-primary/40" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="72" y1="28" x2="78" y2="34" className="stroke-primary/40" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="128" y1="28" x2="122" y2="34" className="stroke-primary/40" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="100" y1="92" x2="100" y2="84" className="stroke-primary/40" strokeWidth="1.2" strokeLinecap="round" />

      <text x="100" y="106" textAnchor="middle" className="fill-fg-muted font-caption text-[11px] font-medium">
        {isWide ? "Labios en 'O' abierta redondeada" : "Labios en 'U' fruncida y estrecha"}
      </text>
    </g>
  );
}

export function FrontalLipsSpread({ guide }: GuideProps) {
  // Una vocal estirada y cerrada (/iː/) deja una rendija estrecha; una estirada
  // y media (/eɪ/) abre más. Sin esto, "spread" y "neutral" se ven casi iguales.
  const isNarrow = guide.jawOpening === "narrow";
  const gap = isNarrow ? 5 : 11;
  const upperTeethY = 56 - gap;
  const lowerTeethY = 56 + gap;

  return (
    <g>
      {/* 1. Cavidad oral profunda: rendija ancha y baja */}
      <ellipse cx="100" cy="56" rx="60" ry={gap + 6} className="fill-surface-sunken" />

      {/* 2. Dientes superiores alineados */}
      <path
        d={`M 48,${upperTeethY - 6} L 52,${upperTeethY} Q 100,${upperTeethY + 2} 148,${upperTeethY} L 152,${upperTeethY - 6} Z`}
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.4"
      />
      <line x1="76" y1={upperTeethY - 6} x2="77" y2={upperTeethY} className="stroke-border-strong" strokeWidth="1" />
      <line x1="92" y1={upperTeethY - 6} x2="92" y2={upperTeethY + 1} className="stroke-border-strong" strokeWidth="1" />
      <line x1="108" y1={upperTeethY - 6} x2="108" y2={upperTeethY + 1} className="stroke-border-strong" strokeWidth="1" />
      <line x1="124" y1={upperTeethY - 6} x2="123" y2={upperTeethY} className="stroke-border-strong" strokeWidth="1" />

      {/* 3. Dientes inferiores */}
      <path
        d={`M 54,${lowerTeethY} Q 100,${lowerTeethY - 2} 146,${lowerTeethY} L 144,${lowerTeethY + 5} Q 100,${lowerTeethY + 3} 56,${lowerTeethY + 5} Z`}
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.2"
      />
      <line x1="84" y1={lowerTeethY - 1} x2="84" y2={lowerTeethY + 4} className="stroke-border-strong" strokeWidth="1" />
      <line x1="100" y1={lowerTeethY - 1} x2="100" y2={lowerTeethY + 4} className="stroke-border-strong" strokeWidth="1" />
      <line x1="116" y1={lowerTeethY - 1} x2="116" y2={lowerTeethY + 4} className="stroke-border-strong" strokeWidth="1" />

      {/* 4. Labio superior estirado en sonrisa */}
      <path
        d={`M 22,50 C 52,28 78,32 94,36 C 100,37 106,37 112,36 C 128,32 154,28 178,50 C 150,52 126,${upperTeethY - 8} 106,${upperTeethY - 8} C 100,${upperTeethY - 8} 94,${upperTeethY - 8} 88,${upperTeethY - 8} C 68,${upperTeethY - 8} 44,52 22,50 Z`}
        className="fill-primary-soft/70 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 5. Labio inferior estirado */}
      <path
        d={`M 22,50 C 50,60 76,${lowerTeethY + 8} 100,${lowerTeethY + 8} C 124,${lowerTeethY + 8} 150,60 178,50 C 156,82 130,86 100,86 C 70,86 44,82 22,50 Z`}
        className="fill-primary-soft/70 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 6. Hoyuelos y tensión lateral de la sonrisa */}
      <path d="M 18,46 Q 14,50 18,54" fill="none" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 182,46 Q 186,50 182,54" fill="none" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />

      <text x="100" y="104" textAnchor="middle" className="fill-fg-muted font-caption text-[11px] font-medium">
        {isNarrow ? "Sonrisa tensa y rendija estrecha" : "Sonrisa amplia y labios estirados"}
      </text>
    </g>
  );
}

export function FrontalLipsNeutral({ guide }: GuideProps) {
  const isWide = guide.jawOpening === "wide";
  const isNarrow = guide.jawOpening === "narrow";

  return (
    <g>
      {/* 1. Cavidad oral interna con profundidad */}
      <ellipse
        cx="100"
        cy="56"
        rx={isWide ? "48" : isNarrow ? "36" : "42"}
        ry={isWide ? "26" : isNarrow ? "12" : "18"}
        className="fill-surface-sunken stroke-border-subtle"
        strokeWidth="1.5"
      />

      {/* 2. Fila dental superior visible */}
      <path
        d={
          isWide
            ? "M 64,46 L 68,54 Q 100,56 132,54 L 136,46 Z"
            : "M 68,48 L 70,53 Q 100,55 130,53 L 132,48 Z"
        }
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.2"
      />
      <line x1="84" y1="47" x2="84" y2="54" className="stroke-border-strong" strokeWidth="1" />
      <line x1="100" y1="48" x2="100" y2="55" className="stroke-border-strong" strokeWidth="1" />
      <line x1="116" y1="47" x2="116" y2="54" className="stroke-border-strong" strokeWidth="1" />

      {/* 3. Lengua visible en el piso de la boca si la mandíbula está abierta */}
      {isWide && (
        <path
          d="M 68,70 Q 100,60 132,70 Q 100,78 68,70 Z"
          className="fill-primary/20 stroke-primary/30"
          strokeWidth="1.2"
        />
      )}

      {/* 4. Dientes inferiores asomando si es media/ancha */}
      {!isNarrow && (
        <path
          d={
            isWide
              ? "M 72,70 Q 100,68 128,70 L 126,74 Q 100,72 74,74 Z"
              : "M 74,62 Q 100,60 126,62 L 124,65 Q 100,63 76,65 Z"
          }
          className="fill-surface-raised stroke-fg"
          strokeWidth="1"
        />
      )}

      {/* 5. Labio superior neutro */}
      <path
        d="M 28,48 C 54,32 80,36 94,40 C 100,41 106,41 112,40 C 126,36 152,32 172,48 C 148,50 124,46 106,46 C 100,46 94,46 88,46 C 70,46 48,50 28,48 Z"
        className="fill-primary-soft/75 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 6. Labio inferior neutro con apertura adaptada */}
      <path
        d={
          isWide
            ? "M 28,58 C 50,72 72,76 100,76 C 128,76 150,72 172,58 C 150,96 128,100 100,100 C 72,100 50,96 28,58 Z"
            : isNarrow
              ? "M 28,54 C 50,60 72,62 100,62 C 128,62 150,60 172,54 C 150,78 128,82 100,82 C 72,82 50,78 28,54 Z"
              : "M 28,56 C 50,66 72,70 100,70 C 128,70 150,66 172,56 C 150,88 128,92 100,92 C 72,92 50,88 28,56 Z"
        }
        className="fill-primary-soft/75 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      <text
        x="100"
        y={isWide ? "114" : "102"}
        textAnchor="middle"
        className="fill-fg-muted font-caption text-[11px] font-medium"
      >
        {isWide
          ? "Mandíbula caída (Apertura amplia)"
          : isNarrow
            ? "Apertura estrecha y relajada"
            : "Apertura media relajada"}
      </text>
    </g>
  );
}
