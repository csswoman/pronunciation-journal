import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, publicErrorResponse } from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

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
    console.error("[word-image] Storage upload error:", uploadError);
    return publicErrorResponse(500, "Failed to save image");
  }

  const { data: publicUrl } = supabase.storage.from("word-images").getPublicUrl(path);
  const imageUrl = publicUrl.publicUrl;

  await supabase
    .from("entries")
    .update({ image_url: imageUrl })
    .eq("id", entryId)
    .eq("user_id", user.id);

  return NextResponse.json({ imageUrl });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

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

  await supabase.from("entries").update({ image_url: null }).eq("id", entryId).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
