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
    const title = screen.getByRole("heading", {
      name: /Ya practicaste — guarda este progreso/i,
    });
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("text-h3");
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/login?intent=save",
    );
  });

  it("renders a quiet footer prompt without competing account buttons", () => {
    render(<GuestSaveProgressBanner variant="footer" />);
    expect(screen.getByText(/Quieres conservar lo de hoy/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crea una cuenta/i })).toHaveAttribute(
      "href",
      "/login?intent=save&mode=register",
    );
    expect(screen.queryByRole("link", { name: "Crear cuenta" })).not.toBeInTheDocument();
  });
});
