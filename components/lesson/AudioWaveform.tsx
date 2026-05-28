"use client";

import { useRef, useEffect } from "react";

interface AudioWaveformProps {
  isRecording: boolean;
  stream?: MediaStream | null;
}

export default function AudioWaveform({ isRecording, stream }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Sync canvas buffer dimensions to rendered size with device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const ctx = canvas.getContext("2d");
      ctx?.scale(dpr, dpr);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isRecording || !stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const primaryColor = getComputedStyle(canvas).getPropertyValue("--primary").trim() || "oklch(0.65 0.15 250)";

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const barWidth = (w / bufferLength) * 2.5;
      const centerY = h / 2;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * centerY;
        const x = i * barWidth;
        const alpha = 0.5 + (i / bufferLength) * 0.5;
        ctx.fillStyle = `color-mix(in oklch, ${primaryColor} ${Math.round(alpha * 100)}%, transparent)`;
        ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight);
        ctx.fillRect(x, centerY, barWidth - 1, barHeight);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [isRecording, stream]);

  // Idle animation — skipped when user prefers reduced motion
  useEffect(() => {
    if (isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const primaryColor = getComputedStyle(canvas).getPropertyValue("--primary").trim() || "oklch(0.65 0.15 250)";

    if (reducedMotion) {
      // Draw a single static flat line
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const numBars = 40;
      const barWidth = w / numBars;
      const centerY = h / 2;
      ctx.fillStyle = `color-mix(in oklch, ${primaryColor} 30%, transparent)`;
      for (let i = 0; i < numBars; i++) {
        ctx.fillRect(i * barWidth, centerY - 2, barWidth - 1, 4);
      }
      return;
    }

    let frame = 0;
    const drawIdle = () => {
      animFrameRef.current = requestAnimationFrame(drawIdle);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const centerY = h / 2;
      const numBars = 40;
      const barWidth = w / numBars;

      for (let i = 0; i < numBars; i++) {
        const barHeight = Math.sin(i * 0.3 + frame * 0.03) * 4 + 5;
        ctx.fillStyle = `color-mix(in oklch, ${primaryColor} 30%, transparent)`;
        ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 1, barHeight * 2);
      }
      frame++;
    };

    drawIdle();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={isRecording ? "Live audio waveform, recording in progress" : "Audio waveform preview"}
      className="w-full h-[clamp(80px,20vh,120px)] rounded-xl"
    />
  );
}
