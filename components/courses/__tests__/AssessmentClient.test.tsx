// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentClient from "../AssessmentClient";
import type { AssessmentQuestion } from "@/lib/courses/assessment";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

const fetchMock = vi.fn();

const questions: AssessmentQuestion[] = [
  {
    id: "a1:topic-one",
    level: "a1",
    lessonSlug: "a1-topic-one",
    prompt: "Choose one",
    options: ["Wrong", "Right"],
    answer: 1,
  },
];

describe("AssessmentClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
    fetchMock.mockResolvedValue({ ok: true });
    window.localStorage.clear();
  });

  it("keeps submission disabled until every question is answered", () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    const submit = screen.getByRole("button", { name: "Ver resultado" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByText("Right"));
    expect(submit).toBeEnabled();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("promotes the learner and persists the new level after a passed checkpoint", async () => {
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    expect(screen.getByRole("heading", { name: "Avanzas a A2" })).toBeInTheDocument();
    expect(screen.getByText("topic one")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessment/results",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(window.localStorage.getItem("assessment:checkpoint:A1")).toContain('"assignedLevel":"A2"');
  });

  it("offers retry when saving the result fails", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.click(retry);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument());
  });
});
