// Planned structure:
// <AuthImagePanel>
//   <Image fill /> × 4   — all images stacked; active one fades in
//   <BottomGradient />   — dark gradient for form edge legibility
// </AuthImagePanel>

"use client";

import Image from "next/image";

const IMAGES = [
  { src: "/images/1.png", hue: 350 }, // rosa
  { src: "/images/2.png", hue: 145 }, // verde
  { src: "/images/3.png", hue: 220 }, // azul
  { src: "/images/4.png", hue: 30  }, // naranja
] as const;

interface AuthImagePanelProps {
  index: number;
}

export function AuthImagePanel({ index }: AuthImagePanelProps) {
  const active = index % IMAGES.length;

  return (
    <div className="relative hidden lg:block lg:w-[45%] shrink-0 overflow-hidden bg-surface-sunken">
      {IMAGES.map(({ src }, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          className="object-cover object-left"
          style={{
            opacity: i === active ? 1 : 0,
            transition: i === active
              ? "opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          quality={80}
          priority={i === 0}
        />
      ))}

      {/* Bottom gradient so image always reads against the form edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.35), transparent)" }}
      />
    </div>
  );
}
