import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { logServerError } from "@/lib/api/logging";
import { reserveModel } from "@/lib/ai-usage/budget";
import { generateBankSet } from "@/lib/content-bank/generate";
import {
  CONTENT_BANK_DAILY_REQUEST_LIMIT,
  CONTENT_BANK_QUOTA_RATIO,
  isModelOverQuotaThreshold,
  DEFAULT_BANK_MODEL,
} from "@/lib/content-bank/budget-check";
import { pickNextGenerationTargets } from "@/lib/content-bank/targets";

export const maxDuration = 120;
export const runtime = "nodejs";

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const targets = await pickNextGenerationTargets(supabase, 4);

  if (targets.length === 0) {
    return NextResponse.json({ processedSets: 0, itemsInserted: 0, message: "No targets found" });
  }

  let processedSets = 0;
  let itemsInserted = 0;

  for (const { level, topicId } of targets) {
    const overThreshold = await isModelOverQuotaThreshold(DEFAULT_BANK_MODEL, CONTENT_BANK_QUOTA_RATIO);
    if (overThreshold) {
      break;
    }

    const reserved = await reserveModel(DEFAULT_BANK_MODEL, "content-bank", {
      failClosed: true,
      limit: CONTENT_BANK_DAILY_REQUEST_LIMIT,
    });
    if (!reserved) {
      break;
    }

    const { data: existingRows } = await supabase
      .from("content_bank_items")
      .select("payload")
      .eq("level", level)
      .eq("topic_id", topicId)
      .limit(20);

    const avoidStems = (existingRows ?? [])
      .map((r) => {
        const payload = r.payload as Record<string, unknown> | null;
        return payload?.question ?? payload?.sentence ?? payload?.prompt;
      })
      .filter((s): s is string => typeof s === "string");

    try {
      const candidates = await generateBankSet(level, topicId, avoidStems);
      if (candidates.length > 0) {
        const rowsToInsert = candidates.map((c) => ({
          kind: "coach_exercise" as const,
          tool_name: c.tool_name,
          level,
          topic_id: topicId,
          payload: c.payload as unknown as Json,
          prompt_version: "v1",
          stem_hash: c.stem_hash,
          quality_flags: 0,
        }));

        const { error: insertError } = await supabase
          .from("content_bank_items")
          .upsert(rowsToInsert, { onConflict: "stem_hash", ignoreDuplicates: true });

        if (insertError) {
          logServerError("Failed to upsert content bank items", insertError, {
            endpoint: "/api/jobs/fill-content-bank",
            operation: "upsert",
          });
        } else {
          itemsInserted += rowsToInsert.length;
        }
      }
      processedSets++;
    } catch (err: unknown) {
      logServerError("Content bank generation failed for target", err, {
        endpoint: "/api/jobs/fill-content-bank",
        operation: "generateBankSet",
      });
    }
  }

  return NextResponse.json({
    processedSets,
    itemsInserted,
  });
}
