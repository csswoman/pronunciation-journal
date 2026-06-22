// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssessmentClient from "../AssessmentClient";
import type { AssessmentQuestion } from "@/lib/courses/assessment";

const { syncCefrLevel, getUser } = vi.hoisted(() => ({
  syncCefrLevel: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/users/queries", () => ({ syncCefrLevel }));
vi.mock("@/lib/courses/assessment-queries", () => ({
  saveAssessmentResult: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getUser } }),
}));

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
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    syncCefrLevel.mockResolvedValue(undefined);
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
    await waitFor(() => expect(syncCefrLevel).toHaveBeenCalledWith("user-1", "A2"));
    expect(window.localStorage.getItem("assessment:checkpoint:A1")).toContain('"assignedLevel":"A2"');
  });

  it("offers retry when saving the result fails", async () => {
    syncCefrLevel.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    render(<AssessmentClient mode="checkpoint" checkpointLabel="A1" questions={questions} />);

    fireEvent.click(screen.getByText("Right"));
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));

    const retry = await screen.findByRole("button", { name: "Reintentar" });
    fireEvent.click(retry);

    await waitFor(() => expect(syncCefrLevel).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument());
  });
});
