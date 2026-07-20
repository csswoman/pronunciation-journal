// Planned structure:
// <AuthImagePanel>
//   <Image fill /> × 4   — all images stacked; active one fades in
//   <BottomGradient />   — dark gradient for form edge legibility
// </AuthImagePanel>

"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

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
          className={cn(
            "object-cover object-left",
            i === active ? "auth-image-fade" : "auth-image-fade--out"
          )}
          style={{ opacity: i === active ? 1 : 0 }}
          quality={80}
          priority={i === 0}
        />
      ))}

      {/* Bottom gradient so image always reads against the form edge */}
      <div className="auth-image-gradient absolute inset-x-0 bottom-0 h-32 pointer-events-none" />
    </div>
  );
}
