// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const dynamicChildren = vi.hoisted(() => ({ mounted: 0 }));

vi.mock("next/dynamic", () => ({
  default: () => function DeferredChild() {
    React.useEffect(() => {
      dynamicChildren.mounted += 1;
    }, []);
    return null;
  },
}));

vi.mock("@/lib/offline/download-manager", () => ({
  useAllDownloadedLessons: () => [],
}));

import { OfflineHubClient } from "../OfflineHubClient";

describe("OfflineHubClient deferred tools", () => {
  beforeEach(() => {
    dynamicChildren.mounted = 0;
  });

  it("mounts only the deferred level-pack section until the Coach options are requested", () => {
    render(<OfflineHubClient />);

    expect(dynamicChildren.mounted).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Ver opciones" }));
    expect(dynamicChildren.mounted).toBe(2);
  });
});
