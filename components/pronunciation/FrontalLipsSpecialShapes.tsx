// Sub-components: FrontalLipsTeethOnLip, FrontalLipsTongueBetweenTeeth, FrontalLipsClosed

export function FrontalLipsTeethOnLip() {
  return (
    <g>
      {/* 1. Fondo cavidad oral */}
      <ellipse cx="100" cy="56" rx="42" ry="18" className="fill-surface-sunken" />

      {/* 2. Labio superior con arco de cupido */}
      <path
        d="M 32,50 C 58,34 82,38 94,42 C 100,43 106,43 112,42 C 124,38 148,34 168,50 C 146,54 122,50 106,50 C 100,50 94,50 88,50 C 72,50 52,54 32,50 Z"
        className="fill-primary-soft/70 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 3. Incisivos superiores apoyados sobre el labio inferior */}
      <g>
        <path
          d="M 72,48 L 74,65 C 74,67 85,67 85,65 L 85,49 Z"
          className="fill-surface-raised stroke-fg"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M 86,49 L 86,66 C 86,68 99,68 99,66 L 99,49 Z"
          className="fill-surface-raised stroke-fg"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M 101,49 L 101,66 C 101,68 114,68 114,66 L 114,49 Z"
          className="fill-surface-raised stroke-fg"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M 115,48 L 115,65 C 115,67 126,67 126,65 L 128,48 Z"
          className="fill-surface-raised stroke-fg"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </g>

      {/* 4. Labio inferior metido hacia adentro recibiendo los dientes */}
      <path
        d="M 32,52 C 55,62 76,64 100,64 C 124,64 145,62 168,52 C 150,84 128,88 100,88 C 72,88 50,84 32,52 Z"
        className="fill-primary-soft/90 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 5. Línea de mordida/contacto */}
      <path
        d="M 70,66 Q 100,69 130,66"
        fill="none"
        className="stroke-primary/50"
        strokeWidth="1.5"
      />

      <text x="100" y="104" textAnchor="middle" className="fill-fg-muted font-caption text-[11px] font-medium">
        Incisivos sobre el labio inferior
      </text>
    </g>
  );
}

export function FrontalLipsTongueBetweenTeeth() {
  return (
    <g>
      {/* 1. Fondo cavidad oral */}
      <ellipse cx="100" cy="56" rx="46" ry="22" className="fill-surface-sunken" />

      {/* 2. Dientes superiores */}
      <g>
        <path
          d="M 68,44 L 70,54 L 130,54 L 132,44 Z"
          className="fill-surface-raised stroke-fg"
          strokeWidth="1.2"
        />
        <line x1="84" y1="44" x2="84" y2="54" className="stroke-border-strong" strokeWidth="1" />
        <line x1="100" y1="44" x2="100" y2="54" className="stroke-border-strong" strokeWidth="1" />
        <line x1="116" y1="44" x2="116" y2="54" className="stroke-border-strong" strokeWidth="1" />
      </g>

      {/* 3. Punta de la lengua asomando entre dientes */}
      <path
        d="M 78,50 C 78,46 88,64 100,64 C 112,64 122,46 122,50 C 124,68 116,74 100,74 C 84,74 76,68 78,50 Z"
        className="fill-warning-soft stroke-warning animate-pulse"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <line x1="100" y1="52" x2="100" y2="68" className="stroke-warning/60" strokeWidth="1.5" strokeLinecap="round" />

      {/* 4. Dientes inferiores */}
      <g>
        <path
          d="M 70,68 L 72,60 L 128,60 L 130,68 Z"
          className="fill-surface-raised stroke-fg"
          strokeWidth="1.2"
        />
        <line x1="84" y1="60" x2="84" y2="68" className="stroke-border-strong" strokeWidth="1" />
        <line x1="100" y1="64" x2="100" y2="68" className="stroke-border-strong" strokeWidth="1" />
        <line x1="116" y1="60" x2="116" y2="68" className="stroke-border-strong" strokeWidth="1" />
      </g>

      {/* 5. Labio superior */}
      <path
        d="M 30,46 C 56,30 82,34 94,38 C 100,39 106,39 112,38 C 124,34 150,30 170,46 C 146,48 124,44 106,44 C 100,44 94,44 88,44 C 70,44 50,48 30,46 Z"
        className="fill-primary-soft/70 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 6. Labio inferior */}
      <path
        d="M 30,56 C 54,64 74,68 100,68 C 126,68 146,64 170,56 C 150,86 128,90 100,90 C 72,90 50,86 30,56 Z"
        className="fill-primary-soft/70 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      <text x="100" y="106" textAnchor="middle" className="fill-warning font-caption text-[11px] font-semibold">
        Lengua visible entre los dientes
      </text>
    </g>
  );
}

export function FrontalLipsClosed() {
  return (
    <g>
      {/* 1. Labio superior cerrado */}
      <path
        d="M 32,54 C 58,38 82,42 94,46 C 100,47 106,47 112,46 C 124,42 148,38 168,54 C 146,57 122,55 106,55 C 100,55 94,55 88,55 C 72,55 52,57 32,54 Z"
        className="fill-primary-soft/80 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* 2. Línea central de contacto firme */}
      <path
        d="M 28,54 Q 100,58 172,54"
        fill="none"
        className="stroke-primary"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* 3. Labio inferior cerrado */}
      <path
        d="M 32,54 C 54,57 74,58 100,58 C 126,58 146,57 168,54 C 150,82 128,84 100,84 C 72,84 50,82 32,54 Z"
        className="fill-primary-soft/80 stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      <text x="100" y="102" textAnchor="middle" className="fill-fg-muted font-caption text-[11px] font-medium">
        Labios sellados firmemente
      </text>
    </g>
  );
}
