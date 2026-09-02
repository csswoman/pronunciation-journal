// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeProgressSidebar from "@/components/home/HomeProgressSidebar";
import DailyPlanCard from "@/components/daily/DailyPlanCard";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { email: "karla@test.com" } }),
}));

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ preferences: { full_name: "Karla" } }),
}));

describe("HomeProgressSidebar", () => {
  it("renders unified progress card with '1 de 740', units for review and streak, and Te tocan hoy chips", () => {
    render(
      <HomeProgressSidebar
        profileLevel="A1"
        streak={4}
        wordsDueCount={15}
        soundsDueCount={10}
        previewWords={[{ text: "asynchronous" }, { text: "bundle" }]}
      />
    );

    expect(screen.getByText("Tu progreso")).toBeInTheDocument();
    expect(screen.getByText(/Palabras esenciales · A1/i)).toBeInTheDocument();
    expect(screen.getByText("de 740")).toBeInTheDocument();
    expect(screen.getByText("En repaso")).toBeInTheDocument();
    expect(screen.getByText("25 palabras")).toBeInTheDocument();
    expect(screen.getByText("Racha")).toBeInTheDocument();
    expect(screen.getByText("4 días")).toBeInTheDocument();

    // Te tocan hoy section
    expect(screen.getByText("Te tocan hoy")).toBeInTheDocument();
    expect(screen.getByText("asynchronous")).toBeInTheDocument();
    expect(screen.getByText("bundle")).toBeInTheDocument();
    expect(screen.getByText("+23")).toBeInTheDocument();
  });
});

describe("DailyPlanCard", () => {
  it("renders greeting, 'Plan de hoy' title, time/steps, and primary CTA button", () => {
    render(
      <DailyPlanCard
        status="ready"
        completedCount={0}
        allDone={false}
        greeting="Buenas tardes, Karla"
        primaryAction={{ label: "Empezar · 12 min", href: "/daily", variant: "primary" }}
        steps={[
          {
            id: "step-1",
            title: "Repaso de palabras",
            subtitle: "6 palabras · 2 min",
            kind: "word_review",
            icon: "BookOpen",
            estMinutes: 2,
            exercises: [],
          },
          {
            id: "step-2",
            title: "Práctica de sonido — /ɛ/",
            subtitle: "Lo confundes con /ɪ/ · 3 min",
            kind: "phoneme_focus",
            icon: "Volume2",
            estMinutes: 3,
            exercises: [],
          },
        ]}
        getStepStatus={() => "pending"}
        onStartStep={vi.fn()}
      />
    );

    expect(screen.getByText("Buenas tardes, Karla")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tu sesión de hoy" })).toBeInTheDocument();
    expect(screen.getByText(/2 actividades · 5 min/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Empezar/i })).toBeInTheDocument();
  });
});
