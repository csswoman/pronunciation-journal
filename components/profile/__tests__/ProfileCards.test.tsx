// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProfileNameCard from "../ProfileNameCard";
import ProfilePasswordCard from "../ProfilePasswordCard";

describe("ProfileNameCard", () => {
  it("renders display name and allows editing in Spanish", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProfileNameCard currentName="Carlos" onSave={onSave} />);

    expect(screen.getByText("Nombre para mostrar")).toBeInTheDocument();
    expect(screen.getByText("Carlos")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    const input = screen.getByLabelText("Tu nombre completo");
    expect(input).toHaveValue("Carlos");

    fireEvent.change(input, { target: { value: "Carlos M." } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Carlos M."));
  });

  it("shows validation error on empty name", async () => {
    const onSave = vi.fn();
    render(<ProfileNameCard currentName="Carlos" onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const input = screen.getByLabelText("Tu nombre completo");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("El nombre no puede estar vacío")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("ProfilePasswordCard", () => {
  it("renders password header and allows changing password in Spanish", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProfilePasswordCard onSave={onSave} />);

    expect(screen.getByText("Contraseña")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }));

    const newPassInput = screen.getByLabelText("Nueva contraseña");
    const confirmPassInput = screen.getByLabelText("Confirmar nueva contraseña");

    fireEvent.change(newPassInput, { target: { value: "secret123" } });
    fireEvent.change(confirmPassInput, { target: { value: "secret123" } });

    fireEvent.click(screen.getByRole("button", { name: "Actualizar contraseña" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("secret123"));
  });

  it("validates password length and match in Spanish", async () => {
    const onSave = vi.fn();
    render(<ProfilePasswordCard onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }));

    const newPassInput = screen.getByLabelText("Nueva contraseña");
    const confirmPassInput = screen.getByLabelText("Confirmar nueva contraseña");

    // Test min length
    fireEvent.change(newPassInput, { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar contraseña" }));
    expect(screen.getByText("La contraseña debe tener al menos 6 caracteres")).toBeInTheDocument();

    // Test mismatch
    fireEvent.change(newPassInput, { target: { value: "password123" } });
    fireEvent.change(confirmPassInput, { target: { value: "different123" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar contraseña" }));
    expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument();

    expect(onSave).not.toHaveBeenCalled();
  });
});
