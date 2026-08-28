// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWebGPUOrb } from "@/lib/ai-coach/use-webgpu-orb";
import { U_TIME } from "@/lib/ai-coach/liquid-orb-seed";

/** Every float block handed to writeBuffer, copied at call time. */
let writes: Float32Array[] = [];
let getCurrentTexture: ReturnType<typeof vi.fn>;

function mockWebGPU() {
  writes = [];
  getCurrentTexture = vi.fn(() => ({ createView: vi.fn(() => ({})) }));

  const device = {
    destroy: vi.fn(),
    lost: new Promise<never>(() => {}),
    createShaderModule: vi.fn(() => ({
      getCompilationInfo: vi.fn(async () => ({ messages: [] })),
    })),
    createRenderPipeline: vi.fn(() => ({ getBindGroupLayout: vi.fn(() => ({})) })),
    createBuffer: vi.fn(() => ({})),
    createBindGroup: vi.fn(() => ({})),
    queue: {
      // The hook reuses one Float32Array, so snapshot it per call.
      writeBuffer: vi.fn((_b: unknown, _o: number, data: Float32Array) => {
        writes.push(Float32Array.from(data));
      }),
      submit: vi.fn(),
    },
    createCommandEncoder: vi.fn(() => ({
      beginRenderPass: vi.fn(() => ({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        draw: vi.fn(),
        end: vi.fn(),
      })),
      finish: vi.fn(() => ({})),
    })),
  };

  HTMLCanvasElement.prototype.getContext = vi.fn((id: string) =>
    id === "webgpu" ? { configure: vi.fn(), getCurrentTexture } : null,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  Object.defineProperty(global.navigator, "gpu", {
    value: {
      requestAdapter: vi.fn(async () => ({ requestDevice: vi.fn(async () => device) })),
      getPreferredCanvasFormat: vi.fn(() => "bgra8unorm"),
    },
    configurable: true,
  });
}

/** A canvas that reports a real size, as it would after layout. */
function sizedCanvasRef(size = 48) {
  const canvas = document.createElement("canvas");
  for (const prop of ["clientWidth", "clientHeight"] as const) {
    Object.defineProperty(canvas, prop, { value: size, configurable: true });
  }
  return { current: canvas };
}

/** Drive N animation frames, advancing the clock between each. */
async function runFrames(count: number) {
  for (let i = 0; i < count; i += 1) {
    const callbacks = rafQueue.splice(0, rafQueue.length);
    clock += 16;
    callbacks.forEach((cb) => cb(clock));
    await Promise.resolve();
  }
}

let rafQueue: FrameRequestCallback[] = [];
let clock = 0;

beforeEach(() => {
  rafQueue = [];
  clock = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  mockWebGPU();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useWebGPUOrb frame loop", () => {
  it("keeps advancing time so the orb animates rather than freezing", async () => {
    const ref = sizedCanvasRef();
    renderHook(() => useWebGPUOrb(ref, { size: 48 }));

    await waitFor(() => expect(rafQueue.length).toBeGreaterThan(0));
    await runFrames(4);

    // More than one draw means the loop re-armed itself.
    expect(writes.length).toBeGreaterThan(1);

    const times = writes.map((w) => w[U_TIME]);
    const strictlyIncreasing = times.every((t, i) => i === 0 || t > times[i - 1]);
    expect(strictlyIncreasing).toBe(true);
    expect(times.at(-1)!).toBeGreaterThan(times[0]);
  });

  it("falls back to the size prop when the canvas has not been laid out", async () => {
    // jsdom reports clientWidth 0; the hook substitutes the `size` prop rather
    // than drawing into a zero-sized swapchain.
    const ref = { current: document.createElement("canvas") };
    renderHook(() => useWebGPUOrb(ref, { size: 48 }));

    await waitFor(() => expect(rafQueue.length).toBeGreaterThan(0));
    await runFrames(3);

    expect(ref.current.width).toBeGreaterThan(0);
    expect(writes.length).toBeGreaterThan(1);
  });

  it("skips the frame, without ending the loop, when there is no size at all", async () => {
    // size 0 leaves nothing to fall back to. The guard must skip and re-arm,
    // because a throw here would freeze the orb on its last drawn frame.
    const ref = { current: document.createElement("canvas") };
    renderHook(() => useWebGPUOrb(ref, { size: 0 }));

    await waitFor(() => expect(rafQueue.length).toBeGreaterThan(0));
    await runFrames(3);

    expect(getCurrentTexture).not.toHaveBeenCalled();
    expect(rafQueue.length).toBeGreaterThan(0); // still alive
  });
});
