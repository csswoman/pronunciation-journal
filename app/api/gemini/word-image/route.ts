import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, publicErrorResponse } from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/logging";

export const maxDuration = 30;

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);

function isImageBufferValid(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 12) return false;

  if (mime === "image/jpeg" || mime === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mime === "image/webp") {
    const riff = buffer.toString("ascii", 0, 4);
    const webp = buffer.toString("ascii", 8, 12);
    return riff === "RIFF" && webp === "WEBP";
  }

  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/word-image",
    maxPermanent: 10,
    maxAnonymous: 3,
  });
  if (limited) return rateLimitError as NextResponse;

  const formData = await request.formData().catch(() => null);
  if (!formData) return publicErrorResponse(400, "Invalid form data");

  const file = formData.get("file") as File | null;
  const entryId = formData.get("entryId") as string | null;

  if (!file || !entryId) return publicErrorResponse(400, "Missing file or entryId");
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return publicErrorResponse(400, "File must be a valid JPEG, PNG, or WebP image");
  }
  if (file.size > 5 * 1024 * 1024) return publicErrorResponse(400, "Image must be under 5 MB");

  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = ALLOWED_IMAGE_EXTS.has(rawExt) ? rawExt : "jpg";

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isImageBufferValid(buffer, file.type)) {
    return publicErrorResponse(400, "Corrupt or unrecognized image file signature");
  }

  const supabase = await createSupabaseServerClient();

  // Verify entry belongs to user
  const { data: entry } = await supabase
    .from("entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) return publicErrorResponse(404, "Entry not found");

  const path = `${user.id}/${entryId}.${ext}`;

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

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/word-image/delete",
    maxPermanent: 20,
    maxAnonymous: 5,
  });
  if (limited) return rateLimitError as NextResponse;

  const { entryId } = await request.json().catch(() => ({}));
  if (!entryId || typeof entryId !== "string") return publicErrorResponse(400, "Missing or invalid entryId");

  const supabase = await createSupabaseServerClient();

  const { data: entry } = await supabase
    .from("entries")
    .select("id, image_url")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!entry) return publicErrorResponse(404, "Entry not found");

  // Derive target file paths strictly from user.id and entryId, never parsing unvetted user paths
  const possiblePaths = ["jpg", "jpeg", "png", "webp"].map(
    (candidateExt) => `${user.id}/${entryId}.${candidateExt}`,
  );
  await supabase.storage.from("word-images").remove(possiblePaths);

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
