// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, bulkGet } = vi.hoisted(() => ({
  replace: vi.fn(),
  bulkGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/courses",
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    completedLessons: {
      bulkGet,
    },
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }),
}));

import CoursePathAutoLevelSync from "../CoursePathAutoLevelSync";

describe("CoursePathAutoLevelSync", () => {
  beforeEach(() => {
    replace.mockReset();
    bulkGet.mockReset();
  });

  it("redirects to the deepest level with progress when there is no explicit query", async () => {
    bulkGet.mockResolvedValueOnce([]);
    bulkGet.mockResolvedValueOnce([null, { lessonSlug: "2" }]);
    bulkGet.mockResolvedValueOnce([null]);

    render(
      <CoursePathAutoLevelSync
        hasExplicitLevel={false}
        levels={[
          { id: "a1", lessonIds: ["1"] },
          { id: "a2", lessonIds: ["1", "2"] },
          { id: "b1", lessonIds: ["1"] },
        ]}
      />
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/courses?level=a2", { scroll: false });
    });
  });

  it("does not redirect when the URL already selects a level", async () => {
    render(
      <CoursePathAutoLevelSync
        hasExplicitLevel
        levels={[{ id: "a1", lessonIds: ["1"] }]}
      />
    );

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });
  });

  it("redirects to guest study level when there are no completed lessons and level is A2", async () => {
    bulkGet.mockResolvedValue([]);
    window.localStorage.setItem("guest-study-level", "A2");

    render(
      <CoursePathAutoLevelSync
        hasExplicitLevel={false}
        levels={[
          { id: "a1", lessonIds: ["1"] },
          { id: "a2", lessonIds: ["1", "2"] },
        ]}
      />
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/courses?level=a2", { scroll: false });
    });

    window.localStorage.removeItem("guest-study-level");
  });
});
