import type { AIMessage, ToolCall, ContentPart, StreamChunk } from "./types";
import { isValidToolName, parseToolArgs, isExerciseTool, type StartRoleplayArgs } from "./tools/registry";
import type { SaveWordArgs } from "./tools/registry";

export interface StreamState {
  parts: ContentPart[];
  calls: Map<string, ToolCall>;
  argsAccum: Map<string, string>;
}

export interface ActionHandlers {
  onSaveWord: (word: string, context: string) => void;
  onStartRoleplay: (scenario: StartRoleplayArgs["scenario"]) => void;
  onActionToolResult: (toolCallId: string, name: string) => void;
  onError: (id: string, tool: string, message: string) => void;
}

export function makeStreamState(): StreamState {
  return { parts: [], calls: new Map(), argsAccum: new Map() };
}

export function processChunk(
  chunk: StreamChunk,
  state: StreamState,
  handlers: ActionHandlers,
): "flush" | "no-flush" | "done" | { error: string } {
  switch (chunk.type) {
    case "text_delta": {
      const last = state.parts[state.parts.length - 1];
      if (last?.type === "text") {
        (last as { type: "text"; text: string }).text += chunk.delta;
      } else {
        state.parts = [...state.parts, { type: "text", text: chunk.delta }];
      }
      return "flush";
    }
    case "tool_call_start": {
      state.calls.set(chunk.id, { id: chunk.id, name: chunk.name, args: {}, status: "pending" });
      state.argsAccum.set(chunk.id, "");
      state.parts = [...state.parts, { type: "tool_call", callId: chunk.id }];
      return "flush";
    }
    case "tool_call_args_delta": {
      state.argsAccum.set(chunk.id, (state.argsAccum.get(chunk.id) ?? "") + chunk.delta);
      return "no-flush";
    }
    case "tool_call_end": {
      const accum = state.argsAccum.get(chunk.id) ?? "{}";
      const tc = state.calls.get(chunk.id);
      if (tc && isValidToolName(tc.name)) {
        try {
          const args = parseToolArgs(tc.name, JSON.parse(accum));
          if (isExerciseTool(tc.name)) {
            state.calls.set(chunk.id, { ...tc, args, status: "rendered" });
          } else {
            state.calls.set(chunk.id, { ...tc, args, status: "answered" });
            if (tc.name === "save_word") {
              const { word, meaning } = args as SaveWordArgs;
              handlers.onSaveWord(word, meaning);
            } else if (tc.name === "start_roleplay") {
              handlers.onStartRoleplay((args as StartRoleplayArgs).scenario);
            }
            handlers.onActionToolResult(chunk.id, tc.name);
          }
        } catch (err) {
          const errorId = crypto.randomUUID();
          handlers.onError(errorId, tc.name, (err as Error).message);
          state.calls.set(chunk.id, { ...tc, status: "error", error: (err as Error).message, errorId });
        }
      } else if (tc) {
        const errorId = crypto.randomUUID();
        state.calls.set(chunk.id, { ...tc, status: "error", error: `Unknown tool: ${tc.name}`, errorId });
      }
      return "flush";
    }
    case "done":
      return "done";
    case "error":
      return { error: chunk.message };
  }
}
