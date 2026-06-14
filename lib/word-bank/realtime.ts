import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WordBankChangeEvent } from "@/lib/word-bank/change-events";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export type { WordBankChangeEvent } from "@/lib/word-bank/change-events";

export type WordBankChannelStatus =
  | "idle"
  | "connecting"
  | "subscribed"
  | "closed"
  | "error";

export interface WordBankRealtimeHandlers {
  onChange: (event: WordBankChangeEvent) => void;
  onStatusChange?: (status: WordBankChannelStatus) => void;
}

export interface WordBankRealtimeSubscription {
  unsubscribe: () => Promise<void>;
  reconnect: () => void;
  getStatus: () => WordBankChannelStatus;
}

function mapPayload(
  payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
): WordBankChangeEvent | null {
  if (payload.eventType === "INSERT") {
    return { type: "INSERT", new: payload.new as WordBankEntry };
  }
  if (payload.eventType === "UPDATE") {
    return { type: "UPDATE", new: payload.new as WordBankEntry };
  }
  if (payload.eventType === "DELETE") {
    return { type: "DELETE", old: payload.old as { id: string } };
  }
  return null;
}

function mapChannelStatus(status: string): WordBankChannelStatus {
  if (status === "SUBSCRIBED") return "subscribed";
  if (status === "CLOSED") return "closed";
  if (status === "CHANNEL_ERROR") return "error";
  return "connecting";
}

export function subscribeWordBankChanges(
  userId: string,
  handlers: WordBankRealtimeHandlers,
): WordBankRealtimeSubscription {
  const supabase = getSupabaseBrowserClient();
  let status: WordBankChannelStatus = "idle";
  let channel: RealtimeChannel | null = null;

  const attachChannel = () => {
    status = "connecting";
    handlers.onStatusChange?.(status);

    channel = supabase
      .channel(`word_bank:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "word_bank",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const event = mapPayload(payload);
          if (event) handlers.onChange(event);
        },
      )
      .subscribe((subscribeStatus) => {
        status = mapChannelStatus(subscribeStatus);
        handlers.onStatusChange?.(status);
      });
  };

  attachChannel();

  return {
    async unsubscribe() {
      if (!channel) return;
      await supabase.removeChannel(channel);
      channel = null;
      status = "closed";
      handlers.onStatusChange?.(status);
    },
    reconnect() {
      if (channel) void supabase.removeChannel(channel);
      attachChannel();
    },
    getStatus: () => status,
  };
}
