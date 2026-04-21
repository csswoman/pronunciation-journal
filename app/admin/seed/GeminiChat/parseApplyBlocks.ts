import type { ApplyPayload } from "@/lib/admin/seed/types";

export function parseApplyBlocks(text: string): ApplyPayload[] {
  const regex = /```apply\s*([\s\S]*?)```/g;
  const results: ApplyPayload[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    try {
      const payload = JSON.parse(match[1].trim()) as ApplyPayload;
      if (payload.tab && payload.data) results.push(payload);
    } catch {
      // Ignore malformed blocks.
    }
  }

  return results;
}
