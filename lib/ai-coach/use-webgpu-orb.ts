import { useEffect, useRef, useState } from "react";
import { LIQUID_ORB_WGSL } from "./liquid-orb-shader";
import { UNIFORM_SEED, U_SIZE_X, U_SIZE_Y, U_TIME, U_SPEED } from "./liquid-orb-seed";

export interface WebGPUOrbOptions {
  size: number;
  intensity?: "idle" | "active";
  onSupportChange?: (supported: boolean) => void;
}

interface WebGPUCanvasContext {
  configure: (config: { device: GPUDevice; format: string; alphaMode: string }) => void;
  getCurrentTexture: () => { createView: () => GPUTextureView };
}

const GPU_BUFFER_USAGE_UNIFORM = 0x0040;
const GPU_BUFFER_USAGE_COPY_DST = 0x0008;

const SPEED_IDLE = 1.5;
const SPEED_ACTIVE = 2.4;

export function useWebGPUOrb(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: WebGPUOrbOptions,
) {
  const { size, intensity = "idle" } = options;
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  const onSupportRef = useRef(options.onSupportChange);
  onSupportRef.current = options.onSupportChange;

  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    // Every one of these is local to THIS mount, deliberately. React 19's
    // StrictMode mounts the effect twice in dev, and `start()` is async, so the
    // first mount's tail can still be running after the second one has begun.
    // With a shared ref for the rAF handle, that tail overwrites the live
    // mount's handle with an id belonging to an already-stopped loop — the
    // second loop then draws exactly one frame and is never rescheduled, which
    // looks like a rendered-but-frozen orb with nothing in the console.
    let stopped = false;
    let device: GPUDevice | null = null;
    let animFrame = 0;

    function stopWithError(error: unknown) {
      if (stopped) return;
      stopped = true;
      if (process.env.NODE_ENV !== "production") {
        console.warn("[LiquidOrb] falling back to static avatar:", error);
      }
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
      device?.destroy?.();
      device = null;
      setIsSupported(false);
      onSupportRef.current?.(false);
    }

    async function start() {
      if (typeof navigator === "undefined" || !("gpu" in navigator) || !navigator.gpu) {
        stopWithError(new Error("WebGPU is not supported in this environment."));
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter || stopped) {
          stopWithError(new Error("No compatible WebGPU adapter was found."));
          return;
        }

        device = await adapter.requestDevice();
        if (stopped) {
          device?.destroy?.();
          return;
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(sizeRef.current * dpr));
        canvas.height = Math.max(1, Math.floor(sizeRef.current * dpr));

        const context = canvas.getContext("webgpu") as unknown as WebGPUCanvasContext | null;
        if (!context) {
          stopWithError(new Error("Unable to create a WebGPU canvas context."));
          return;
        }

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: "premultiplied" });

        const shader = device.createShaderModule({ code: LIQUID_ORB_WGSL });
        const compilation = await shader.getCompilationInfo();
        const errors = compilation.messages?.filter((m) => m.type === "error") || [];
        if (errors.length || stopped) {
          const errDetail = errors.map((m) => `${m.lineNum}:${m.linePos} ${m.message}`).join("\n");
          stopWithError(new Error(`WGSL Shader Error:\n${errDetail}`));
          return;
        }

        const pipeline = device.createRenderPipeline({
          layout: "auto",
          vertex: { module: shader, entryPoint: "vs_main" },
          fragment: { module: shader, entryPoint: "fs_main", targets: [{ format }] },
          primitive: { topology: "triangle-list" },
        });

        const values = new Float32Array(UNIFORM_SEED);
        const uniformBuffer = device.createBuffer({
          size: values.byteLength,
          usage: GPU_BUFFER_USAGE_UNIFORM | GPU_BUFFER_USAGE_COPY_DST,
        });

        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });

        // `device` is nullable for teardown; inside the loop it is known good.
        const gpu = device;
        const startedAt = performance.now();
        let frameCount = 0;

        if (device.lost && typeof device.lost.then === "function") {
          device.lost.then((info) => {
            stopWithError(new Error(`WebGPU device lost: ${info?.message || info?.reason}`));
          });
        }

        if (typeof device.addEventListener === "function") {
          device.addEventListener("uncapturederror", (event) => {
            const gpuEvt = event as GPUUncapturedErrorEvent;
            gpuEvt.preventDefault?.();
            stopWithError(new Error(`WebGPU rendering error: ${gpuEvt.error?.message}`));
          });
        }

        setIsSupported(true);
        onSupportRef.current?.(true);

        function frame(now: number) {
          if (stopped || !canvasRef.current) return;
          try {
            const targetCanvas = canvasRef.current;
            const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
            const clientW = targetCanvas.clientWidth || sizeRef.current;
            const clientH = targetCanvas.clientHeight || sizeRef.current;
            const width = Math.max(1, Math.floor(clientW * currentDpr));
            const height = Math.max(1, Math.floor(clientH * currentDpr));

            // Before the first layout pass the canvas can measure 0. Drawing
            // into a zero-sized swapchain throws, and a throw here would kill
            // the loop for good — leaving one stale frame on screen that looks
            // like a frozen orb. Skip the frame and come back next tick.
            if (clientW <= 0 || clientH <= 0) {
              animFrame = requestAnimationFrame(frame);
              return;
            }

            if (targetCanvas.width !== width || targetCanvas.height !== height) {
              targetCanvas.width = width;
              targetCanvas.height = height;
              // Resizing a canvas drops its WebGPU swapchain; re-configure it or
              // every later getCurrentTexture() call renders into nothing.
              context!.configure({ device: gpu, format, alphaMode: "premultiplied" });
            }

            values[U_SIZE_X] = width;
            values[U_SIZE_Y] = height;
            values[U_TIME] = (now - startedAt) / 1000;
            values[U_SPEED] = intensityRef.current === "active" ? SPEED_ACTIVE : SPEED_IDLE;

            gpu.queue.writeBuffer(uniformBuffer, 0, values);

            const encoder = gpu.createCommandEncoder();
            const pass = encoder.beginRenderPass({
              colorAttachments: [
                {
                  view: context!.getCurrentTexture().createView(),
                  clearValue: { r: 0, g: 0, b: 0, a: 0 },
                  loadOp: "clear",
                  storeOp: "store",
                },
              ],
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
            gpu.queue.submit([encoder.finish()]);

            frameCount += 1;
            animFrame = requestAnimationFrame(frame);
          } catch (error) {
            // A throw here leaves the last drawn frame on screen forever, which
            // reads as "the orb rendered but is frozen" rather than as an error.
            // Say so explicitly, including how far the loop got.
            stopWithError(
              new Error(
                `WebGPU frame loop stopped after ${frameCount} frame(s): ${
                  error instanceof Error ? error.message : String(error)
                }`,
              ),
            );
          }
        }

        animFrame = requestAnimationFrame(frame);
      } catch (error) {
        stopWithError(error);
      }
    }

    start();

    return () => {
      stopped = true;
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
      device?.destroy?.();
      device = null;
    };
    // One GPU device per mount; live values are read through refs.
  }, []);

  return { isSupported };
}
