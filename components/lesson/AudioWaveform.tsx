"use client";

import { useRef, useEffect } from "react";

interface AudioWaveformProps {
  isRecording: boolean;
  stream?: MediaStream | null;
}

export default function AudioWaveform({ isRecording, stream }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

    audioCtxRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      const centerY = height / 2;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * centerY;
        const x = i * barWidth;

        // Gradient from brand color to accent
        const hue = 230 + (i / bufferLength) * 30;
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;

        // Draw mirrored bars
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

  // Idle animation when not recording
  useEffect(() => {
    if (isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const drawIdle = () => {
      animFrameRef.current = requestAnimationFrame(drawIdle);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const numBars = 40;
      const barWidth = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const barHeight = Math.sin((i * 0.3) + (frame * 0.03)) * 4 + 5;
        ctx.fillStyle = `hsla(230, 60%, 70%, 0.3)`;
        ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
      }
      frame++;
    };

    drawIdle();

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className="w-full h-[100px] rounded-xl"
    />
  );
}
