import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireUser = vi.fn();
const rateLimit = vi.fn();
const createSupabaseServerClient = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
const getPublicUrl = vi.fn();
const update = vi.fn();

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: (...args: unknown[]) => requireUser(...args),
  rateLimit: (...args: unknown[]) => rateLimit(...args),
  publicErrorResponse: (status: number) => new Response(null, { status }) as never,
  redactError: (err: unknown) =>
    err instanceof Error ? { type: err.name, message: err.message } : { type: "Error", message: String(err) },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { DELETE, POST } from "../route";

function buildEntryQuery() {
  const updateQuery: any = {
    eq: vi.fn().mockReturnThis(),
  };
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "entry-1", image_url: "https://old.example/image.png" }, error: null }),
    update: vi.fn().mockReturnValue(updateQuery),
  };
  return query;
}

function buildSupabase(updateError: unknown) {
  const entryQuery = buildEntryQuery();
  (entryQuery.update as any).mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: updateError }),
    }),
  });
  upload.mockResolvedValue({ error: null });
  remove.mockResolvedValue({ error: null });
  getPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.example/image.png" } });

  createSupabaseServerClient.mockResolvedValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "entries") return entryQuery;
      return {};
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload,
        remove,
        getPublicUrl,
      }),
    },
  });
}

function postRequest(): NextRequest {
  const formData = new FormData();
  formData.set("file", new File(["fake"], "image.png", { type: "image/png" }));
  formData.set("entryId", "entry-1");
  return new NextRequest("http://localhost/api/gemini/word-image", {
    method: "POST",
    body: formData,
  });
}

function deleteRequest(): NextRequest {
  return new NextRequest("http://localhost/api/gemini/word-image", {
    method: "DELETE",
    body: JSON.stringify({ entryId: "entry-1" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ user: { id: "user-1" }, error: null });
  rateLimit.mockResolvedValue({ limited: false, error: null });
});

describe("app/api/gemini/word-image", () => {
  it("returns 500 when upload succeeds but metadata update fails", async () => {
    buildSupabase(new Error("update failed"));

    const res = await POST(postRequest());

    expect(res.status).toBe(500);
  });

  it("returns 500 when delete metadata update fails", async () => {
    buildSupabase(new Error("delete update failed"));

    const res = await DELETE(deleteRequest());

    expect(res.status).toBe(500);
  });
});
