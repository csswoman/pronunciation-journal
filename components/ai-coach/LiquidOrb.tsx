"use client";

import { useRef } from "react";
import { useWebGPUOrb, type WebGPUOrbOptions } from "@/lib/ai-coach/use-webgpu-orb";
import { cn } from "@/lib/cn";

// Planned structure:
// <LiquidOrb>
//   <canvas ref={canvasRef} />
// </LiquidOrb>

interface LiquidOrbProps extends WebGPUOrbOptions {
  className?: string;
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

  if (isSupported === false) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Liquid Orb AI Coach"
      className={cn(
        "pointer-events-none block shrink-0 rounded-full transition-opacity duration-300",
        isSupported ? "opacity-100" : "opacity-0",
        className,
      )}
      // Runtime-computed from the `size` prop — not a static design value.
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
