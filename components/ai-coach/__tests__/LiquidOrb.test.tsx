// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LiquidOrb from "../LiquidOrb";
import ChatEmptyState from "../ChatEmptyState";
import TypingIndicator from "../TypingIndicator";

describe("LiquidOrb and WebGPU fallbacks", () => {
  let configureMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("when WebGPU is not supported (default jsdom)", () => {
    it("renders null for LiquidOrb without crashing", () => {
      const onSupportChange = vi.fn();
      const { container } = render(
        <LiquidOrb size={44} intensity="idle" onSupportChange={onSupportChange} />,
      );

      expect(container.firstChild).toBeNull();
      expect(onSupportChange).toHaveBeenCalledWith(false);
    });

    it("renders the static gradient hero in ChatEmptyState", () => {
      render(<ChatEmptyState onSendMessage={vi.fn()} />);

      // Sparkles and heading are present in fallback
      expect(screen.getByText("Let's practice together.")).toBeDefined();
      expect(screen.getByText("Free Conversation")).toBeDefined();
    });

    it("renders AIAvatar thinking state in TypingIndicator", () => {
      render(<TypingIndicator />);

      expect(screen.getByRole("status", { name: "AI Coach is thinking" })).toBeDefined();
      expect(screen.getByText("Thinking…")).toBeDefined();
    });
  });

  describe("when WebGPU is supported (mocked)", () => {
    beforeEach(() => {
      const mockDevice = {
        destroy: vi.fn(),
        lost: new Promise<GPUDeviceLostInfo>(() => {}),
        createShaderModule: vi.fn(() => ({
          getCompilationInfo: vi.fn(async () => ({ messages: [] })),
        })),
        createRenderPipeline: vi.fn(() => ({
          getBindGroupLayout: vi.fn(() => ({})),
        })),
        createBuffer: vi.fn(() => ({})),
        createBindGroup: vi.fn(() => ({})),
        queue: {
          writeBuffer: vi.fn(),
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

      const mockAdapter = {
        requestDevice: vi.fn(async () => mockDevice),
      };

      const mockContext = {
        configure: (configureMock = vi.fn()),
        getCurrentTexture: vi.fn(() => ({
          createView: vi.fn(() => ({})),
        })),
      };

      // Mock canvas getContext
      HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
        if (contextId === "webgpu") return mockContext;
        return null;
      }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

      // Mock navigator.gpu
      Object.defineProperty(global.navigator, "gpu", {
        value: {
          requestAdapter: vi.fn(async () => mockAdapter),
          getPreferredCanvasFormat: vi.fn(() => "bgra8unorm"),
        },
        configurable: true,
      });
    });

    it("initializes canvas and notifies support change", async () => {
      const onSupportChange = vi.fn();
      render(<LiquidOrb size={48} intensity="active" onSupportChange={onSupportChange} />);

      await waitFor(() => {
        expect(onSupportChange).toHaveBeenCalledWith(true);
      });

      const canvas = screen.getByRole("img", {
        name: "Liquid Orb AI Coach",
      }) as HTMLCanvasElement;
      expect(canvas).toBeDefined();
      expect(canvas.style.width).toBe("48px");
      expect(canvas.style.height).toBe("48px");
      expect(canvas.width).toBe(48);
      expect(canvas.height).toBe(48);
      expect(configureMock).toHaveBeenCalledTimes(1);
    });
  });
});
