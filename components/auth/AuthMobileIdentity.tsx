import Image from "next/image";

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
    <div
      className="relative lg:hidden overflow-hidden"
      style={{ minHeight: "clamp(200px, 40vh, 320px)" }}
    >
      {/* All images stacked — active one fades in */}
      {IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          className="object-cover object-center"
          style={{
            opacity: i === active ? 1 : 0,
            transition: i === active
              ? "opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          quality={70}
          priority={i === 0}
        />
      ))}

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Bottom-to-top gradient reinforces text contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.6) 0%, oklch(0 0 0 / 0.15) 60%, transparent 100%)" }}
      />

      {/* Wordmark — always white against the dark overlay */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
        <h1
          className="font-bold leading-tight text-white"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.75rem, 5vw, 2.5rem)", letterSpacing: "-0.02em" }}
        >
          English Journal
        </h1>
        <p
          className="mt-1 text-white/70 text-sm italic"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Practice with intention. Listen closely.
        </p>
      </div>
    </div>
  );
}
