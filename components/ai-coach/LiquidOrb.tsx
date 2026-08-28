"use client";

import { useRef } from "react";
import { useWebGPUOrb, type WebGPUOrbOptions } from "@/lib/ai-coach/use-webgpu-orb";
import { cn } from "@/lib/cn";

// Planned structure:
// <LiquidOrb>
//   <StaticLiquidOrb />
//   <canvas ref={canvasRef} />
// </LiquidOrb>

interface LiquidOrbProps extends WebGPUOrbOptions {
  className?: string;
}

export function StaticLiquidOrb({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Liquid Orb AI Coach"
      className={cn("static-liquid-orb shrink-0", className)}
      // Runtime-computed from the `size` prop — not a static design value.
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export default function LiquidOrb({
  size,
  intensity = "idle",
  className,
  onSupportChange,
}: LiquidOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isSupported } = useWebGPUOrb(canvasRef, {
    size,
    intensity,
    onSupportChange,
  });

  return (
    <div
      className={cn("relative shrink-0 flex items-center justify-center rounded-full", className)}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <StaticLiquidOrb
        size={size}
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isSupported ? "opacity-0" : "opacity-100",
        )}
      />

      {isSupported !== false && (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Liquid Orb AI Coach"
          className={cn(
            "pointer-events-none absolute inset-0 block shrink-0 rounded-full transition-opacity duration-500",
            isSupported ? "opacity-100" : "opacity-0",
          )}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      )}
    </div>
  );
}
