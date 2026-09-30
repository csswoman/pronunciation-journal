// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mounted = vi.hoisted(() => ({ daily: vi.fn(), hub: vi.fn() }));

vi.mock("../OfflineDailyClient", () => ({
  OfflineDailyClient: () => {
    mounted.daily();
    return <div data-testid="offline-daily">Daily offline</div>;
  },
}));

vi.mock("../OfflineHubClient", () => ({
  OfflineHubClient: () => {
    mounted.hub();
    return <div data-testid="offline-hub">Offline hub</div>;
  },
}));

import { OfflineEntry } from "../OfflineEntry";
import { OfflineLoadingState } from "../OfflineLoadingState";

describe("OfflineEntry branch loading", () => {
  beforeEach(() => {
    mounted.daily.mockClear();
    mounted.hub.mockClear();
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("loads only the offline hub for /offline", async () => {
    window.history.pushState({}, "", "/offline");

    render(<OfflineEntry />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByTestId("offline-hub")).toBeInTheDocument();
    expect(mounted.daily).not.toHaveBeenCalled();
    expect(mounted.hub).toHaveBeenCalledTimes(1);
  });

  it("loads only Daily for the /daily offline fallback pathname", async () => {
    window.history.pushState({}, "", "/daily?step=review");

    render(<OfflineEntry />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByTestId("offline-daily")).toBeInTheDocument();
    expect(mounted.hub).not.toHaveBeenCalled();
    expect(mounted.daily).toHaveBeenCalledTimes(1);
  });

  it("shows a visible error and retry action when a deferred loader fails", () => {
    const retry = vi.fn();

    render(<OfflineLoadingState error={new Error("chunk failed")} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar este contenido.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
