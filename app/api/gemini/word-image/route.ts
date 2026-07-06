import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, rateLimit, publicErrorResponse } from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/logging";

export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/word-image:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/word-image", userId: user.id },
  });
  if (limited) return rateLimitError;

  const formData = await request.formData().catch(() => null);
  if (!formData) return publicErrorResponse(400, "Invalid form data");

  const file = formData.get("file") as File | null;
  const entryId = formData.get("entryId") as string | null;

  if (!file || !entryId) return publicErrorResponse(400, "Missing file or entryId");
  if (!file.type.startsWith("image/")) return publicErrorResponse(400, "File must be an image");
  if (file.size > 5 * 1024 * 1024) return publicErrorResponse(400, "Image must be under 5 MB");

  const supabase = await createSupabaseServerClient();

  // Verify entry belongs to user
  const { data: entry } = await supabase
    .from("entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) return publicErrorResponse(404, "Entry not found");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${entryId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("word-images")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    logServerError("Word image upload failed", uploadError, {
      endpoint: "/api/gemini/word-image",
      operation: "upload",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to save image");
  }

  const { data: publicUrl } = supabase.storage.from("word-images").getPublicUrl(path);
  const imageUrl = publicUrl.publicUrl;
  const { error: updateError } = await supabase
    .from("entries")
    .update({ image_url: imageUrl })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (updateError) {
    logServerError("Word image metadata update failed", updateError, {
      endpoint: "/api/gemini/word-image",
      operation: "updateMetadata",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to save image metadata");
  }

  return NextResponse.json({ imageUrl });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/word-image/delete:${user.id}`, {
    max: 20,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/word-image DELETE", userId: user.id },
  });
  if (limited) return rateLimitError;

  const { entryId } = await request.json().catch(() => ({}));
  if (!entryId) return publicErrorResponse(400, "Missing entryId");

  const supabase = await createSupabaseServerClient();

  const { data: entry } = await supabase
    .from("entries")
    .select("image_url")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) return publicErrorResponse(404, "Entry not found");

  if (entry.image_url) {
    const pathMatch = entry.image_url.match(/word-images\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from("word-images").remove([pathMatch[1]]);
    }
  }

  const { error: updateError } = await supabase
    .from("entries")
    .update({ image_url: null })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (updateError) {
    logServerError("Word image metadata delete failed", updateError, {
      endpoint: "/api/gemini/word-image",
      operation: "deleteMetadata",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to remove image metadata");
  }

  return NextResponse.json({ ok: true });
}
