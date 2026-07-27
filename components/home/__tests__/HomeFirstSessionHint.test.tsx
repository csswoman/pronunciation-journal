// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import HomeFirstSessionHint from "@/components/home/HomeFirstSessionHint";
import { HOME_FIRST_SESSION_HINT_KEY } from "@/lib/home/onboarding";

describe("HomeFirstSessionHint", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the tip for new learners and dismisses permanently", async () => {
    const user = userEvent.setup();
    render(<HomeFirstSessionHint enabled />);

    expect(screen.getByText(/Tu primera sesión/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ocultar consejo/i }));
    expect(screen.queryByText(/Tu primera sesión/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(HOME_FIRST_SESSION_HINT_KEY)).toBe("1");
  });

  it("stays hidden when already dismissed", () => {
    window.localStorage.setItem(HOME_FIRST_SESSION_HINT_KEY, "1");
    render(<HomeFirstSessionHint enabled />);
    expect(screen.queryByText(/Tu primera sesión/i)).not.toBeInTheDocument();
  });

  it("does not render when disabled", () => {
    render(<HomeFirstSessionHint enabled={false} />);
    expect(screen.queryByText(/Tu primera sesión/i)).not.toBeInTheDocument();
  });
});
