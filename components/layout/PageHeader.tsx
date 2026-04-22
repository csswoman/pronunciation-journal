"use client";

import { useRef, type ReactNode } from "react";
import {
  Play,
  Mic,
  BookOpen,
  Sparkles,
  Volume2,
  PenLine,
  Headphones,
  Star,
  Globe,
  Languages,
  GraduationCap,
  NotebookPen,
  Flame,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface CTAButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface PageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: CTAButton;
  secondaryCta?: CTAButton;
  illustration?: ReactNode;
  variant?: "default" | "compact";
  progress?: number;
  lessonTitle?: string;
  onContinue?: () => void;
}

// --- decorative background patterns ---

function PatternDots() {
  return (
    <>
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[80px]" />
      <div className="absolute -bottom-16 -left-16 w-[280px] h-[280px] rounded-full bg-[var(--primary)] opacity-[0.05] blur-[60px]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ph-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="var(--primary)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ph-dots)" />
      </svg>
    </>
  );
}

function PatternGrid() {
  return (
    <>
      <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-[var(--primary)] opacity-[0.06] blur-[90px]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ph-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--primary)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ph-grid)" />
      </svg>
    </>
  );
}

function PatternLines() {
  return (
    <>
      <div className="absolute top-0 left-1/2 w-[500px] h-[300px] rounded-full bg-[var(--primary)] opacity-[0.06] blur-[100px]" />
      {/* horizontal ruled lines like a notebook */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.055]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ph-lines" x="0" y="0" width="100%" height="36" patternUnits="userSpaceOnUse">
            <line x1="0" y1="35" x2="100%" y2="35" stroke="var(--primary)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ph-lines)" />
        {/* vertical margin line */}
        <line x1="56" y1="0" x2="56" y2="100%" stroke="var(--primary)" strokeWidth="1" opacity="0.4" />
      </svg>
    </>
  );
}

type IconPos = { Icon: typeof Mic; x: number; y: number; size: number; opacity: number; rotate: number };

function PatternIcons() {
  const positions: IconPos[] = [
    { Icon: Mic,          x: 8,  y: 12, size: 28, opacity: 0.12, rotate: -15 },
    { Icon: BookOpen,     x: 78, y: 8,  size: 32, opacity: 0.10, rotate: 12  },
    { Icon: Sparkles,     x: 88, y: 55, size: 24, opacity: 0.13, rotate: 20  },
    { Icon: Volume2,      x: 5,  y: 65, size: 26, opacity: 0.10, rotate: -8  },
    { Icon: Languages,    x: 50, y: 5,  size: 22, opacity: 0.09, rotate: 5   },
    { Icon: GraduationCap,x: 92, y: 82, size: 30, opacity: 0.08, rotate: -12 },
    { Icon: PenLine,      x: 20, y: 85, size: 22, opacity: 0.10, rotate: 18  },
    { Icon: Headphones,   x: 65, y: 78, size: 26, opacity: 0.09, rotate: -5  },
    { Icon: Globe,        x: 40, y: 88, size: 20, opacity: 0.08, rotate: 10  },
    { Icon: Star,         x: 72, y: 30, size: 18, opacity: 0.11, rotate: 25  },
    { Icon: NotebookPen,  x: 30, y: 15, size: 20, opacity: 0.09, rotate: -20 },
    { Icon: Flame,        x: 15, y: 45, size: 18, opacity: 0.08, rotate: 8   },
  ];

  return (
    <>
      <div className="absolute -top-16 right-10 w-[420px] h-[420px] rounded-full bg-[var(--primary)] opacity-[0.06] blur-[80px]" />
      {positions.map(({ Icon, x, y, size, opacity, rotate }, i) => (
        <div
          key={i}
          className="absolute text-[var(--primary)] pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            opacity,
            transform: `rotate(${rotate}deg)`,
          }}
        >
          <Icon size={size} strokeWidth={1.2} />
        </div>
      ))}
    </>
  );
}

function PatternDiagonalStripes() {
  return (
    <>
      <div className="absolute -bottom-20 -right-20 w-[440px] h-[440px] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[90px]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ph-diag" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="var(--primary)" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ph-diag)" />
      </svg>
    </>
  );
}

const PATTERNS = [PatternDots, PatternGrid, PatternLines, PatternIcons, PatternDiagonalStripes];

function pickPattern(seed: number) {
  return PATTERNS[seed % PATTERNS.length];
}

// --- illustration frames ---

function FrameRings() {
  return (
    <>
      <div className="absolute w-[400px] h-[400px] rounded-full border border-[color-mix(in_oklch,var(--primary)_15%,transparent)]" />
      <div className="absolute w-[300px] h-[300px] rounded-full border border-[color-mix(in_oklch,var(--primary)_25%,transparent)]" />
      <div className="absolute w-[340px] h-[240px] rounded-full bg-[var(--primary)] opacity-[0.18] blur-[55px]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-6 bg-[var(--primary)] opacity-[0.15] blur-[18px] rounded-full" />
    </>
  );
}

function FrameHexagon() {
  return (
    <>
      <svg className="absolute w-[380px] h-[380px] opacity-[0.12]" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="none" stroke="var(--primary)" strokeWidth="1" />
        <polygon points="50,14 83,32 83,68 50,86 17,68 17,32" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
      </svg>
      <div className="absolute w-[300px] h-[300px] bg-[var(--primary)] opacity-[0.12] blur-[60px]" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] h-5 bg-[var(--primary)] opacity-[0.13] blur-[16px] rounded-full" />
    </>
  );
}

function FrameBlob() {
  return (
    <>
      <div
        className="absolute w-[360px] h-[320px] bg-[var(--primary)] opacity-[0.10] blur-[50px]"
        style={{ borderRadius: "60% 40% 55% 45% / 45% 55% 40% 60%" }}
      />
      <div
        className="absolute w-[260px] h-[230px] border border-[color-mix(in_oklch,var(--primary)_20%,transparent)]"
        style={{ borderRadius: "60% 40% 55% 45% / 45% 55% 40% 60%" }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-5 bg-[var(--primary)] opacity-[0.12] blur-[16px] rounded-full" />
    </>
  );
}

function FrameSquare() {
  return (
    <>
      <div className="absolute w-[340px] h-[300px] rounded-[2rem] border border-[color-mix(in_oklch,var(--primary)_18%,transparent)]" style={{ transform: "rotate(6deg)" }} />
      <div className="absolute w-[340px] h-[300px] rounded-[2rem] border border-[color-mix(in_oklch,var(--primary)_10%,transparent)]" style={{ transform: "rotate(-4deg)" }} />
      <div className="absolute w-[300px] h-[220px] rounded-[1.5rem] bg-[var(--primary)] opacity-[0.13] blur-[50px]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] h-5 bg-[var(--primary)] opacity-[0.13] blur-[16px] rounded-full" />
    </>
  );
}

function FrameDiamond() {
  return (
    <>
      <svg className="absolute w-[380px] h-[380px] opacity-[0.12]" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,3 97,50 50,97 3,50" fill="none" stroke="var(--primary)" strokeWidth="1" />
        <polygon points="50,15 85,50 50,85 15,50" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
      </svg>
      <div className="absolute w-[280px] h-[280px] bg-[var(--primary)] opacity-[0.11] blur-[55px]" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-5 bg-[var(--primary)] opacity-[0.13] blur-[16px] rounded-full" />
    </>
  );
}

const FRAMES = [FrameRings, FrameHexagon, FrameBlob, FrameSquare, FrameDiamond];

function pickFrame(seed: number) {
  return FRAMES[seed % FRAMES.length];
}

// stable per-instance seed (doesn't change on re-render, but varies per page mount)
let instanceCounter = 0;

export default function PageHeader({
  badge,
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  illustration,
  variant = "default",
  progress,
  lessonTitle,
  onContinue,
}: PageHeaderProps) {
  const isCompact = variant === "compact";
  const hasProgress = progress !== undefined && lessonTitle && onContinue;
  const safeProgress = hasProgress
    ? Math.max(0, Math.min(100, Math.round(progress!)))
    : 0;

  const seedRef = useRef<number | null>(null);
  if (seedRef.current === null) {
    seedRef.current = instanceCounter++;
  }
  const Pattern = pickPattern(seedRef.current);
  const Frame = pickFrame(seedRef.current);

  return (
    <div
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)]
        rounded-[15px_15px_0_0]
        ${isCompact ? "p-6 lg:p-8" : "p-8 lg:p-12"}
        grid grid-cols-1 lg:grid-cols-2 gap-10 items-center
      `}
    >
      {/* DECORATIVE BACKGROUND */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Pattern />
      </div>

      {/* LEFT */}
      <div className="relative z-10 max-w-xl">
        {badge && (
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] border border-[color-mix(in_oklch,var(--primary)_20%,transparent)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
              {badge}
            </span>
          </div>
        )}

        <h1 className="font-display text-4xl lg:text-5xl leading-[1.1] tracking-tight text-[var(--deep-text)]">
          <span className="font-semibold">{title}</span>
          {subtitle && (
            <>
              <br />
              <span className="text-[var(--primary)] font-medium">{subtitle}</span>
            </>
          )}
        </h1>

        {description && (
          <p className="mt-4 text-base text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        )}

        {hasProgress ? (
          <div className="mt-8 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="font-medium text-[var(--deep-text)]">{lessonTitle}</span>
                <span className="text-[var(--text-secondary)]">{safeProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--line-divider)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-500"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>
            <Button
              onClick={onContinue}
              size="lg"
              className="shadow-[0_12px_30px_color-mix(in_oklch,var(--primary)_30%,transparent)] hover:translate-y-[-1px] transition-all"
              icon={<Play size={16} />}
            >
              Resume Lesson
            </Button>
          </div>
        ) : (
          (primaryCta || secondaryCta) && (
            <div className="mt-8 flex gap-4 flex-wrap">
              {primaryCta && (
                <Button
                  onClick={primaryCta.onClick}
                  size="lg"
                  className="shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_35%,transparent)] hover:translate-y-[-1px] transition-all"
                  icon={primaryCta.icon}
                >
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  onClick={secondaryCta.onClick}
                  variant="secondary"
                  size="lg"
                  icon={secondaryCta.icon}
                >
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {/* RIGHT — illustration */}
      {illustration && (
        <div className="relative z-10 flex items-center justify-center min-h-[260px]">
          <Frame />
          <div className="relative w-full max-w-[420px] animate-[float_6s_ease-in-out_infinite] [&_img]:w-full [&_img]:h-auto [&_svg]:w-full [&_svg]:h-auto drop-shadow-xl">
            {illustration}
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
