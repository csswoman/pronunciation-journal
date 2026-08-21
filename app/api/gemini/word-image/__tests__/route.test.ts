import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireUser = vi.fn();
const checkLayeredRateLimit = vi.fn();
const createSupabaseServerClient = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
const getPublicUrl = vi.fn();

vi.mock("@/lib/api/guards", () => ({
  requireSameOrigin: () => null,
  requireUser: (...args: unknown[]) => requireUser(...args),
  checkLayeredRateLimit: (...args: unknown[]) => checkLayeredRateLimit(...args),
  rateLimit: () => ({ limited: false, error: null }),
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }) as never,
  redactError: (err: unknown) =>
    err instanceof Error ? { type: err.name, message: err.message } : { type: "Error", message: String(err) },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClient(...args),
}));

import { DELETE, POST } from "../route";

function buildEntryQuery() {
  const updateQuery = {
    eq: vi.fn().mockReturnThis(),
  };
  type Query = {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  const query: Query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: "entry-1", image_url: "https://old.example/image.png" }, error: null }),
    update: vi.fn().mockReturnValue(updateQuery),
  };
  return query;
}

function buildSupabase(updateError: unknown) {
  const entryQuery = buildEntryQuery();
  entryQuery.update.mockReturnValue({
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

function validPngBuffer(): Uint8Array {
  // Valid PNG signature followed by minimum bytes
  const bytes = new Uint8Array(20);
  bytes[0] = 0x89;
  bytes[1] = 0x50;
  bytes[2] = 0x4e;
  bytes[3] = 0x47;
  bytes[4] = 0x0d;
  bytes[5] = 0x0a;
  bytes[6] = 0x1a;
  bytes[7] = 0x0a;
  return bytes;
}

function postRequest(customFile?: File): NextRequest {
  const formData = new FormData();
  const file = customFile ?? new File([Buffer.from(validPngBuffer())], "image.png", { type: "image/png" });
  formData.set("file", file);
  formData.set("entryId", "entry-1");
  return new NextRequest("http://localhost/api/gemini/word-image", {
    method: "POST",
    body: formData,
  });
}

function deleteRequest(entryId = "entry-1"): NextRequest {
  return new NextRequest("http://localhost/api/gemini/word-image", {
    method: "DELETE",
    body: JSON.stringify({ entryId }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue({ user: { id: "user-1" }, error: null });
  checkLayeredRateLimit.mockResolvedValue({ limited: false, error: null });
});

describe("app/api/gemini/word-image", () => {
  it("rejects non-image or unsupported MIME types", async () => {
    buildSupabase(null);
    const textFile = new File(["not an image"], "test.exe", { type: "application/octet-stream" });
    const res = await POST(postRequest(textFile));
    expect(res.status).toBe(400);
  });

  it("rejects invalid/corrupt image buffer signatures", async () => {
    buildSupabase(null);
    const corruptedFile = new File([Buffer.from([1, 2, 3, 4, 5])], "bad.png", { type: "image/png" });
    const res = await POST(postRequest(corruptedFile));
    expect(res.status).toBe(400);
  });

  it("uploads valid image and namespaces by user.id", async () => {
    buildSupabase(null);
    const res = await POST(postRequest());
    expect(res.status).toBe(200);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/entry-1\./),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/png" }),
    );
  });

  it("derives DELETE path exclusively from user.id and entryId, never parsing arbitrary URLs", async () => {
    buildSupabase(null);
    const res = await DELETE(deleteRequest("entry-456"));
    expect(res.status).toBe(200);
    expect(remove).toHaveBeenCalledWith([
      "user-1/entry-456.jpg",
      "user-1/entry-456.jpeg",
      "user-1/entry-456.png",
      "user-1/entry-456.webp",
    ]);
  });

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
