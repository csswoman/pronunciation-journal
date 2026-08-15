import type { PhonemeArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";

// Planned structure:
// <FrontalLipsTeethOnLip | TongueBetweenTeeth | Rounded | Spread | Closed | Neutral />

type GuideProps = { guide: PhonemeArticulationGuide };

export function FrontalLipsTeethOnLip() {
  return (
    <g>
      <path
        d="M 25,44 C 55,30 75,34 90,38 C 105,34 125,30 155,44 C 125,50 105,46 90,46 C 75,46 55,50 25,44 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="74" y="44" width="14" height="15" rx="2" className="fill-surface-raised stroke-fg shadow-sm" strokeWidth="1.5" />
      <rect x="92" y="44" width="14" height="15" rx="2" className="fill-surface-raised stroke-fg shadow-sm" strokeWidth="1.5" />
      <line x1="90" y1="44" x2="90" y2="59" className="stroke-border-default" strokeWidth="1" />
      <path
        d="M 30,55 C 60,54 75,56 90,56 C 105,56 120,54 150,55 C 135,80 105,82 90,82 C 75,82 45,80 30,55 Z"
        className="fill-primary/35 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="90" y="98" textAnchor="middle" className="fill-primary font-mono text-[9px] font-bold">
        Dientes sobre labio inferior
      </text>
    </g>
  );
}

export function FrontalLipsTongueBetweenTeeth() {
  return (
    <g>
      <path
        d="M 25,36 C 55,24 75,28 90,32 C 105,28 125,24 155,36 C 125,42 105,38 90,38 C 75,38 55,42 25,36 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="68" y="38" width="18" height="12" rx="2" className="fill-surface-raised stroke-fg" strokeWidth="1.5" />
      <rect x="94" y="38" width="18" height="12" rx="2" className="fill-surface-raised stroke-fg" strokeWidth="1.5" />
      <path
        d="M 68,48 C 68,44 78,58 90,58 C 102,58 112,44 112,48 C 112,62 102,70 90,70 C 78,70 68,62 68,48 Z"
        className="fill-warning-soft stroke-warning animate-pulse"
        strokeWidth="2.5"
      />
      <line x1="90" y1="50" x2="90" y2="64" className="stroke-warning/60" strokeWidth="1.5" />
      <rect x="70" y="58" width="16" height="10" rx="1.5" className="fill-surface-raised stroke-fg" strokeWidth="1.5" />
      <rect x="94" y="58" width="16" height="10" rx="1.5" className="fill-surface-raised stroke-fg" strokeWidth="1.5" />
      <path
        d="M 30,62 C 60,60 75,64 90,64 C 105,64 120,60 150,62 C 135,84 105,86 90,86 C 75,86 45,84 30,62 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="90" y="100" textAnchor="middle" className="fill-warning font-mono text-[9px] font-bold">
        Lengua asomando entre dientes
      </text>
    </g>
  );
}

export function FrontalLipsRounded({ guide }: GuideProps) {
  return (
    <g>
      <ellipse cx="90" cy="54" rx="46" ry="34" className="fill-primary/25 stroke-primary" strokeWidth="2.5" />
      <ellipse
        cx="90"
        cy="54"
        rx={guide.jawOpening === "wide" ? "22" : "14"}
        ry={guide.jawOpening === "wide" ? "20" : "12"}
        className="fill-surface-sunken stroke-primary"
        strokeWidth="2.5"
      />
      <path
        d={guide.jawOpening === "wide" ? "M 76,46 Q 90,48 104,46" : "M 80,48 Q 90,50 100,48"}
        fill="none"
        className="stroke-surface-raised"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text x="90" y="102" textAnchor="middle" className="fill-primary font-mono text-[9px] font-bold">
        {guide.jawOpening === "wide" ? "Labios en 'O' abierta" : "Labios en 'U' redonda estrecha"}
      </text>
    </g>
  );
}

export function FrontalLipsSpread() {
  return (
    <g>
      <path
        d="M 16,50 C 48,28 72,32 90,36 C 108,32 132,28 164,50 C 132,50 108,44 90,44 C 72,44 48,50 16,50 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M 26,50 C 50,46 72,44 90,44 C 108,44 130,46 154,50 C 130,62 108,64 90,64 C 72,64 50,62 26,50 Z"
        className="fill-surface-sunken stroke-border-default"
        strokeWidth="1.5"
      />
      <path
        d="M 38,48 Q 90,44 142,48 L 140,54 Q 90,56 40,54 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1.5"
      />
      <path
        d="M 44,55 Q 90,57 136,55 L 134,60 Q 90,63 46,60 Z"
        className="fill-surface-raised stroke-fg"
        strokeWidth="1"
      />
      <path
        d="M 18,52 C 48,64 72,66 90,66 C 108,66 132,64 162,52 C 134,78 108,80 90,80 C 72,80 46,78 18,52 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="90" y="98" textAnchor="middle" className="fill-primary font-mono text-[9px] font-bold">
        Sonrisa amplia y tensa
      </text>
    </g>
  );
}

export function FrontalLipsClosed() {
  return (
    <g>
      <path
        d="M 25,48 C 55,34 75,38 90,42 C 105,38 125,34 155,48 C 125,52 105,50 90,50 C 75,50 55,52 25,48 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M 22,50 Q 90,54 158,50"
        fill="none"
        className="stroke-primary"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M 28,52 C 58,52 75,54 90,54 C 105,54 122,52 152,52 C 135,74 105,76 90,76 C 75,76 45,74 28,52 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="90" y="96" textAnchor="middle" className="fill-primary font-mono text-[9px] font-bold">
        Labios sellados firmemente
      </text>
    </g>
  );
}

export function FrontalLipsNeutral({ guide }: GuideProps) {
  const wide = guide.jawOpening === "wide";
  return (
    <g>
      <path
        d="M 25,40 C 55,26 75,30 90,34 C 105,30 125,26 155,40 C 125,46 105,42 90,42 C 75,42 55,46 25,40 Z"
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse
        cx="90"
        cy={wide ? "56" : "50"}
        rx="38"
        ry={wide ? "24" : "14"}
        className="fill-surface-sunken stroke-border-default"
        strokeWidth="1.5"
      />
      <rect x="74" y="38" width="14" height="10" rx="1.5" className="fill-surface-raised stroke-fg" strokeWidth="1.2" />
      <rect x="92" y="38" width="14" height="10" rx="1.5" className="fill-surface-raised stroke-fg" strokeWidth="1.2" />
      <path
        d={`M 26,${wide ? "68" : "56"} C 56,${wide ? "66" : "54"} 75,${wide ? "68" : "56"} 90,${wide ? "68" : "56"} C 105,${wide ? "68" : "56"} 124,${wide ? "66" : "54"} 154,${wide ? "68" : "56"} C 135,${wide ? "92" : "78"} 105,${wide ? "94" : "80"} 90,${wide ? "94" : "80"} C 75,${wide ? "94" : "80"} 45,${wide ? "92" : "78"} 26,${wide ? "68" : "56"} Z`}
        className="fill-primary/25 stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="90" y={wide ? "106" : "98"} textAnchor="middle" className="fill-fg-muted font-mono text-[9px] font-bold">
        {wide ? "Mandíbula caída (Apertura amplia)" : "Apertura media relajada"}
      </text>
    </g>
  );
}
