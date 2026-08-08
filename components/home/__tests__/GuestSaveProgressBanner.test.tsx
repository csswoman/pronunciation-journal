// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";

describe("GuestSaveProgressBanner", () => {
  it("renders inline save links without a primary CTA block", () => {
    render(<GuestSaveProgressBanner variant="inline" />);
    expect(screen.getByText(/Exploras sin cuenta permanente/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crea una cuenta/i })).toHaveAttribute(
      "href",
      "/login?intent=save&mode=register",
    );
    expect(screen.queryByRole("link", { name: "Crear cuenta" })).not.toBeInTheDocument();
  });

  it("emphasizes save after practice", () => {
    render(<GuestSaveProgressBanner variant="emphasized" />);
    expect(
      screen.getByRole("heading", { name: /Ya practicaste — guarda este progreso/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/login?intent=save",
    );
  });
});
