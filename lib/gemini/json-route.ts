import { NextResponse } from "next/server";
import { z } from "zod";
import { publicErrorResponse } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";
import { callWithFallback, getErrorStatus, stripJsonFences, type CallWithFallbackOptions, type GeminiCallParams } from "@/lib/gemini/client";
import { publicAiErrorMessage } from "@/lib/degradation/messages";

type GeminiJsonRouteOptions<T> = {
  endpoint: string;
  userId?: string;
  params: GeminiCallParams;
  schema?: z.ZodType;
  parse: (text: string) => T;
  failureMessage: string;
  headers?: HeadersInit;
  fallbackOptions?: CallWithFallbackOptions;
};

export function parseGeminiJson<T>(text: string, parseJson: (json: unknown) => T): T {
  return parseJson(JSON.parse(stripJsonFences(text)));
}

export async function callGeminiJson<T>({
  endpoint,
  userId,
  params,
  schema,
  parse,
  failureMessage,
  fallbackOptions,
}: Omit<GeminiJsonRouteOptions<T>, "headers">): Promise<
  | { data: T; response: null }
  | { data: null; response: NextResponse }
> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { data: null, response: NextResponse.json({ error: "AI service unavailable" }, { status: 503 }) };
  }

  try {
    const config = schema
      ? { ...params.config, responseJsonSchema: z.toJSONSchema(schema) }
      : params.config;
    const parseResponse = schema
      ? (text: string) => {
          schema.parse(JSON.parse(stripJsonFences(text)));
          return parse(text);
        }
      : parse;
    const result = await callWithFallback(apiKey, { ...params, config }, parseResponse, {
      ...fallbackOptions,
      feature: fallbackOptions?.feature ?? endpoint,
    });
    return { data: result, response: null };
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    logServerError("Gemini JSON route failed", err, {
      endpoint,
      operation: "callWithFallback",
      status,
      userId,
    });
    const errMessage = publicAiErrorMessage(status, String(err), failureMessage);
    return { data: null, response: publicErrorResponse(status >= 500 ? 500 : status, errMessage) };
  }
}

export async function respondWithGeminiJson<T>(options: GeminiJsonRouteOptions<T>): Promise<NextResponse> {
  const { data, response } = await callGeminiJson(options);
  if (response) {
    if (options.headers && response.status === 503) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503, headers: options.headers });
    }
    return response;
  }
  return NextResponse.json(data, { headers: options.headers });
}
