import { NextRequest } from "next/server";
import { POST as handler } from "@/app/api/gemini/generate-sentences/route";

export const runtime = "nodejs";

/**
 * @deprecated Use /api/gemini/generate-sentences instead.
 */
export async function POST(req: NextRequest) {
  return handler(req);
}
