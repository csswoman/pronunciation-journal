// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CoursePathSearch from "../CoursePathSearch";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("CoursePathSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input with placeholder and shortcut", () => {
    render(<CoursePathSearch />);

    const input = screen.getByRole("combobox", { name: "Buscar en el curso" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Buscar lección o tema...");
  });

  it("shows search results when query is entered", () => {
    render(<CoursePathSearch />);

    const input = screen.getByRole("combobox", { name: "Buscar en el curso" });
    fireEvent.change(input, { target: { value: "to be" } });

    const listbox = screen.getByRole("listbox", { name: "Resultados de búsqueda" });
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
  });

  it("navigates on result click", () => {
    render(<CoursePathSearch />);

    const input = screen.getByRole("combobox", { name: "Buscar en el curso" });
    fireEvent.change(input, { target: { value: "to be" } });

    const options = screen.getAllByRole("option");
    fireEvent.click(options[0]);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/courses/study/"));
  });

  it("navigates with keyboard Enter on focused item", () => {
    render(<CoursePathSearch />);

    const input = screen.getByRole("combobox", { name: "Buscar en el curso" });
    fireEvent.change(input, { target: { value: "habitos" } });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no results match", () => {
    render(<CoursePathSearch />);

    const input = screen.getByRole("combobox", { name: "Buscar en el curso" });
    fireEvent.change(input, { target: { value: "xyznonexistentquery123" } });

    expect(screen.getByText(/No se encontraron resultados para/i)).toBeInTheDocument();
  });

  it("clears query and closes dropdown on clear button click", () => {
    render(<CoursePathSearch />);

    const input = screen.getByRole("combobox", { name: "Buscar en el curso" });
    fireEvent.change(input, { target: { value: "to be" } });

    const clearButton = screen.getByRole("button", { name: "Borrar búsqueda" });
    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
