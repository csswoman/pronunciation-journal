import Image from "next/image";
import { cn } from "@/lib/cn";

const IMAGES = [
  "/images/1.png",
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
] as const;

interface AuthMobileIdentityProps {
  index: number;
}

// Mobile-only hero: rotating background image + dark overlay + wordmark
export function AuthMobileIdentity({ index }: AuthMobileIdentityProps) {
  const active = index % IMAGES.length;

  return (
    <div className="auth-mobile-hero relative lg:hidden overflow-hidden">
      {/* All images stacked — active one fades in */}
      {IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          className={cn( "object-cover object-center", i === active ? "auth-image-fade" : "auth-image-fade--out" )}
          style={{ opacity: i === active ? 1 : 0 }}
          quality={70}
          priority={i === 0}
        />
      ))}

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Bottom-to-top gradient reinforces text contrast */}
      <div className="auth-mobile-gradient absolute inset-0 pointer-events-none" />

      {/* Wordmark — always white against the dark overlay */}
      <div className="absolute inset-x-0 bottom-0 px-[var(--layout-page-inline)] pb-7 z-10">
        <h1
          className="font-bold leading-tight text-white text-h2 tracking-[-0.02em]"
        >
          English Journal
        </h1>
        <p className="mt-1 text-white/70 text-body-sm italic">
          Practice with intention. Listen closely.
        </p>
      </div>
    </div>
  );
}
