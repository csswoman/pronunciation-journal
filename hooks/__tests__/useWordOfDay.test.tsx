// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWordOfDay } from "../useWordOfDay";

const today = new Date().toISOString().slice(0, 10);

function makeWord(word: string) {
  return {
    word,
    meaning: `${word} meaning`,
    pronunciation: `/${word}/`,
    ipa: `/${word}/`,
    definition: `${word} definition`,
    example_sentence: `I used ${word} today.`,
    difficulty: "intermediate" as const,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useWordOfDay", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("ignora una respuesta vieja si llega después de un refresh", async () => {
    const first = deferred<Response>();
    const secondWord = makeWord("aurora");
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(new Response(JSON.stringify(secondWord), { status: 200 }));

    const { result } = renderHook(() => useWordOfDay());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.word?.word).toBe("aurora");
    });

    first.resolve(new Response(JSON.stringify(makeWord("atlas")), { status: 200 }));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.word?.word).toBe("aurora");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("restaura desde sessionStorage cuando hay cache del día", async () => {
    const cached = makeWord("lumen");
    sessionStorage.setItem("wod", JSON.stringify(cached));
    sessionStorage.setItem("wod_date", today);

    const { result } = renderHook(() => useWordOfDay());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.word?.word).toBe("lumen");
    expect(fetch).not.toHaveBeenCalled();
  });
});
