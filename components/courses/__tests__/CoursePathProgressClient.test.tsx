// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";

const { bulkGet } = vi.hoisted(() => ({
  bulkGet: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a>,
}));

vi.mock("@/lib/db", () => ({
  db: {
    completedLessons: {
      bulkGet,
    },
  },
}));

import CoursePathProgressClient from "../CoursePathProgressClient";

describe("CoursePathProgressClient", () => {
  beforeEach(() => {
    bulkGet.mockReset();
  });

  it("shows the first lesson CTA when there is no local progress", async () => {
    bulkGet.mockResolvedValue([]);

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    await waitFor(() => {
      expect(screen.getByText("Empieza aquí")).toBeInTheDocument();
    });
  });

  it("shows resume and review suggestions from Dexie progress", async () => {
    bulkGet.mockResolvedValue([
      { lessonSlug: "1" },
      { lessonSlug: "2" },
      null,
      null,
      null,
      null,
    ]);

    render(<CoursePathProgressClient level={COURSE_PATH_CURRICULUM.levels[0]} />);

    await waitFor(() => {
      expect(screen.getByText("Siguiente lección")).toBeInTheDocument();
      expect(screen.getByText("Continuar")).toBeInTheDocument();
      expect(screen.getByText("Para reforzar")).toBeInTheDocument();
      expect(screen.queryByText("Tu lección actual")).not.toBeInTheDocument();
    });
  });
});
