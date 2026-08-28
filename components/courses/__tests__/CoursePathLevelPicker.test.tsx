// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";

const { bulkGet } = vi.hoisted(() => ({
  bulkGet: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/db", () => ({
  db: {
    completedLessons: {
      bulkGet,
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => ({ id: "user-123" }),
}));

import CoursePathLevelPicker from "../CoursePathLevelPicker";

describe("CoursePathLevelPicker", () => {
  beforeEach(() => {
    bulkGet.mockReset();
  });

  it("renders all level tabs with initial counts and marks active level", () => {
    bulkGet.mockImplementation(() => new Promise(() => {}));

    render(
      <CoursePathLevelPicker
        levels={COURSE_PATH_CURRICULUM.levels}
        selectedLevelId="a1"
      />
    );

    expect(screen.getByRole("heading", { name: "Nivel" })).toBeInTheDocument();
    const a1Links = screen.getAllByRole("link", { name: /Nivel A1/i });
    expect(a1Links[0]).toHaveAttribute("aria-current", "page");
    expect(a1Links[0]).toHaveAttribute("href", "/courses");
  });

  it("hydrates completed counts per level from Dexie", async () => {
    // Return 2 completed lessons for A1
    bulkGet.mockResolvedValue([
      { courseSlug: "a1", lessonSlug: "1" },
      { courseSlug: "a1", lessonSlug: "2" },
      null,
    ]);

    render(
      <CoursePathLevelPicker
        levels={COURSE_PATH_CURRICULUM.levels}
        selectedLevelId="a1"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/^2\/\d+/)[0]).toBeInTheDocument();
    });
  });

  it("links to other levels with appropriate level param", () => {
    bulkGet.mockResolvedValue([]);

    render(
      <CoursePathLevelPicker
        levels={COURSE_PATH_CURRICULUM.levels}
        selectedLevelId="b1"
      />
    );

    const b1Links = screen.getAllByRole("link", { name: /Nivel B1/i });
    expect(b1Links[0]).toHaveAttribute("aria-current", "page");
    expect(b1Links[0]).toHaveAttribute("href", "/courses?level=b1");

    const a2Links = screen.getAllByRole("link", { name: /Nivel A2/i });
    expect(a2Links[0]).toHaveAttribute("href", "/courses?level=a2");
  });

  it("handles storage errors gracefully without crashing", async () => {
    bulkGet.mockRejectedValue(new Error("Dexie failure"));

    render(
      <CoursePathLevelPicker
        levels={COURSE_PATH_CURRICULUM.levels}
        selectedLevelId="a1"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/^0\/\d+/)[0]).toBeInTheDocument();
    });
  });
});
