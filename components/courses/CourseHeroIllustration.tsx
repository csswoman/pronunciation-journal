/*
 * Planned subcomponents:
 * - CourseHeroIllustration (vector SVG illustration for course hero banner)
 *   - BackgroundAtmosphere (soft clouds and stylized London silhouettes)
 *   - BigBenTower (spire, belfry, clock face with hands, and gothic shaft)
 *   - GreetingBubbles (speech bubbles with "Hello!" and "Nice to meet you!")
 */

import type React from "react";
import { cn } from "@/lib/cn";

interface CourseHeroIllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function CourseHeroIllustration({
  className,
  ...props
}: CourseHeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("w-full h-auto select-none pointer-events-none", className)}
      {...props}
    >
      <defs>
        {/* Dynamic theme gradients */}
        <linearGradient id="cloud-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
        </linearGradient>

        <linearGradient id="hill-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.12" />
        </linearGradient>

        <linearGradient id="tree-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.10" />
        </linearGradient>

        <linearGradient id="tower-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.45" />
        </linearGradient>

        <linearGradient id="tower-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.65" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.50" />
        </linearGradient>

        <linearGradient id="bubble-primary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-800)" />
        </linearGradient>

        <linearGradient id="bubble-secondary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary-800)" />
          <stop offset="100%" stopColor="var(--primary-900)" />
        </linearGradient>

        <filter id="bubble-shadow" x="-8%" y="-8%" width="124%" height="124%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--primary)" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Decorative background clouds */}
      <g className="clouds" opacity="0.9">
        <path
          d="M30 165 C30 150 42 138 58 138 C62 138 66 139 70 141 C76 128 90 118 106 118 C126 118 142 133 144 153 C149 151 154 150 160 150 C173 150 184 159 186 172 C186 174 186 178 186 182 L30 182 Z"
          fill="url(#cloud-grad)"
        />
        <path
          d="M170 120 C170 108 180 98 193 98 C197 98 200 99 203 100 C208 90 219 82 232 82 C248 82 261 94 262 110 C266 109 270 108 274 108 C284 108 293 115 295 125 L170 125 Z"
          fill="url(#cloud-grad)"
          opacity="0.6"
        />
      </g>

      {/* Stylized background landscape / hills */}
      <g className="hills">
        <path
          d="M110 200 Q160 135 220 160 T310 170 L310 200 Z"
          fill="url(#hill-grad)"
        />
        <path
          d="M140 200 C155 165 185 145 225 155 C255 162 280 185 300 200 Z"
          fill="url(#hill-grad)"
          opacity="0.7"
        />
        {/* Stylized trees silhouette behind tower */}
        <circle cx="215" cy="165" r="14" fill="url(#tree-grad)" />
        <circle cx="230" cy="160" r="16" fill="url(#tree-grad)" />
        <circle cx="295" cy="168" r="13" fill="url(#tree-grad)" />
        <circle cx="308" cy="172" r="10" fill="url(#tree-grad)" />
      </g>

      {/* Big Ben / Elizabeth Tower */}
      <g className="big-ben" transform="translate(254, 20)">
        {/* Spire tip & pinnacle */}
        <path d="M18 0 L20 0 L20 10 L18 10 Z" fill="var(--primary)" opacity="0.9" />
        <path d="M19 10 L23 26 L15 26 Z" fill="url(#tower-grad)" />
        <rect x="14" y="26" width="10" height="4" rx="1" fill="var(--primary)" opacity="0.85" />
        
        {/* Belfry roof / decorative gable */}
        <path d="M19 30 L27 48 L11 48 Z" fill="url(#tower-grad)" />
        <rect x="9" y="48" width="20" height="4" rx="1" fill="var(--primary)" opacity="0.8" />

        {/* Belfry (belfry louver arches) */}
        <rect x="10" y="52" width="18" height="18" rx="1" fill="url(#tower-body)" />
        <path d="M13 56 Q15 53 17 56 L17 66 L13 66 Z" fill="var(--surface-raised)" opacity="0.4" />
        <path d="M21 56 Q23 53 25 56 L25 66 L21 66 Z" fill="var(--surface-raised)" opacity="0.4" />
        
        {/* Cornice under belfry */}
        <rect x="8" y="70" width="22" height="3" fill="var(--primary)" opacity="0.9" />

        {/* Clock Cube */}
        <rect x="8" y="73" width="22" height="24" rx="2" fill="url(#tower-body)" />
        
        {/* Clock Face Border & Dial */}
        <circle cx="19" cy="85" r="9" fill="var(--surface-raised)" opacity="0.95" />
        <circle cx="19" cy="85" r="8" stroke="var(--primary)" strokeWidth="1.2" fill="none" opacity="0.8" />
        
        {/* Clock Hands (10:10 position) */}
        <line x1="19" y1="85" x2="16" y2="80" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="19" y1="85" x2="23" y2="82" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="19" cy="85" r="1.2" fill="var(--primary)" />

        {/* Lower balcony molding */}
        <rect x="7" y="97" width="24" height="4" rx="1" fill="var(--primary)" opacity="0.85" />

        {/* Tower Main Shaft */}
        <rect x="9" y="101" width="20" height="79" fill="url(#tower-body)" />
        
        {/* Gothic Vertical Striping & Windows */}
        <line x1="13" y1="105" x2="13" y2="175" stroke="var(--surface-raised)" strokeWidth="1" opacity="0.4" />
        <line x1="19" y1="105" x2="19" y2="175" stroke="var(--surface-raised)" strokeWidth="1" opacity="0.4" />
        <line x1="25" y1="105" x2="25" y2="175" stroke="var(--surface-raised)" strokeWidth="1" opacity="0.4" />
        
        {/* Slit windows */}
        <rect x="11.5" y="112" width="3" height="8" rx="1.5" fill="var(--primary)" opacity="0.75" />
        <rect x="23.5" y="112" width="3" height="8" rx="1.5" fill="var(--primary)" opacity="0.75" />
        <rect x="11.5" y="132" width="3" height="8" rx="1.5" fill="var(--primary)" opacity="0.75" />
        <rect x="23.5" y="132" width="3" height="8" rx="1.5" fill="var(--primary)" opacity="0.75" />
        <rect x="11.5" y="152" width="3" height="8" rx="1.5" fill="var(--primary)" opacity="0.75" />
        <rect x="23.5" y="152" width="3" height="8" rx="1.5" fill="var(--primary)" opacity="0.75" />
      </g>

      {/* Speech Bubble 1: "Hello!" */}
      <g className="bubble-hello" filter="url(#bubble-shadow)">
        {/* Rotated subtle speech pill */}
        <g transform="translate(162, 38) rotate(-4)">
          <rect
            x="0"
            y="0"
            width="82"
            height="40"
            rx="14"
            fill="url(#bubble-primary)"
          />
          {/* Bubble tail */}
          <path
            d="M56 38 L62 48 L68 37 Z"
            fill="url(#bubble-primary)"
          />
          <text
            x="41"
            y="26"
            fill="var(--primary-foreground)"
            fontFamily="var(--font-sans), system-ui, -apple-system, sans-serif"
            fontSize="17"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="-0.02em"
          >
            Hello!
          </text>
        </g>
      </g>

      {/* Speech Bubble 2: "Nice to meet you!" */}
      <g className="bubble-meet" filter="url(#bubble-shadow)">
        <g transform="translate(166, 92)">
          <rect
            x="0"
            y="0"
            width="106"
            height="30"
            rx="10"
            fill="url(#bubble-secondary)"
          />
          {/* Bubble tail pointing toward Big Ben */}
          <path
            d="M78 28 L86 36 L88 28 Z"
            fill="url(#bubble-secondary)"
          />
          <text
            x="53"
            y="20"
            fill="var(--primary-foreground)"
            fontFamily="var(--font-sans), system-ui, -apple-system, sans-serif"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="-0.01em"
          >
            Nice to meet you!
          </text>
        </g>
      </g>
    </svg>
  );
}
