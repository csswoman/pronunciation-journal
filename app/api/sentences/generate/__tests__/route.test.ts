import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/app/api/gemini/generate-sentences/route", () => ({
  POST: vi.fn().mockResolvedValue(new Response(JSON.stringify({ forwarded: true }), { status: 200 })),
}));

import { POST as handler } from "@/app/api/gemini/generate-sentences/route";
import { POST } from "../route";

describe("POST /api/sentences/generate (legacy delegate)", () => {
  it("delegates to /api/gemini/generate-sentences handler", async () => {
    const req = new NextRequest("http://localhost/api/sentences/generate", {
      method: "POST",
      body: JSON.stringify({ topic: "travel" }),
    });

    const res = await POST(req);
    expect(handler).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
