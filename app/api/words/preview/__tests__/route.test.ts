import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { lookupWordWithGemini, getCachedWordDefinition, getOrCreateWordDefinition } = vi.hoisted(() => ({
  lookupWordWithGemini: vi.fn(),
  getCachedWordDefinition: vi.fn(),
  getOrCreateWordDefinition: vi.fn(),
}));

vi.mock("@/lib/word-bank/gemini", () => ({ lookupWordWithGemini }));
vi.mock("@/lib/word-bank/definition-cache", () => ({
  getCachedWordDefinition,
  getOrCreateWordDefinition,
}));
vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: vi.fn(() => null),
  requireUser: vi.fn(),
  validateBody: vi.fn(),
  createUserScopedClient: vi.fn(),
  checkLayeredRateLimit: vi.fn(),
  publicErrorResponse: (status: number, error: string) => Response.json({ error }, { status }),
}));
vi.mock("@/lib/api/logging", () => ({ logServerError: vi.fn() }));

import { POST } from "../route";
import { checkLayeredRateLimit, createUserScopedClient, requireUser, validateBody } from "@/lib/api/guards";

function wordBankClient() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const ilike = vi.fn().mockReturnValue({ maybeSingle });
  const eq = vi.fn().mockReturnValue({ ilike });
  return { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }) };
}

describe("POST /api/words/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ user: { id: "user-1" } as never, error: null, accessToken: "token" });
    vi.mocked(validateBody).mockResolvedValue({ data: { text: "dependency array" }, error: null });
    vi.mocked(createUserScopedClient).mockReturnValue(wordBankClient() as never);
  });

  it("returns the local dictionary definition before cache or Gemini", async () => {
    const response = await POST(new NextRequest("http://localhost/api/words/preview", { method: "POST" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      source: "dictionary",
      enrichment: {
        translation: "Arreglo de dependencias",
        meaning: expect.stringContaining("second argument to React hooks"),
      },
    });
    expect(getCachedWordDefinition).not.toHaveBeenCalled();
    expect(checkLayeredRateLimit).not.toHaveBeenCalled();
    expect(getOrCreateWordDefinition).not.toHaveBeenCalled();
    expect(lookupWordWithGemini).not.toHaveBeenCalled();
  });
});
