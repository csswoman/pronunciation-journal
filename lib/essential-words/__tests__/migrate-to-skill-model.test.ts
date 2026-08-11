import { describe, expect, it } from "vitest";
import { planSkillModelMigration } from "../migrate-to-skill-model";
import { srsFsrs, srsLegacySm2, srsMigrationSet } from "./fixtures/srs-fixtures";

const NOW = new Date("2026-08-06T10:00:00.000Z");

describe("planSkillModelMigration", () => {
  it("crea tres habilidades base por palabra", () => {
    const items = planSkillModelMigration([srsFsrs("not")], [], NOW);
    const skills = items.filter((item) => item.wordId === "c1k:not")
      .map((item) => item.skill).sort();
    expect(skills).toEqual(["listening", "meaning", "production"]);
  });

  it("meaning hereda el estado FSRS tal cual: no reinicia intervalos", () => {
    const source = srsFsrs("not");
    const meaning = planSkillModelMigration([source], [], NOW)
      .find((item) => item.skill === "meaning")!;
    expect(meaning.schedule).toEqual({
      kind: "fsrs",
      dueAt: source.nextReview,
      stability: source.stability,
      difficulty: source.difficulty,
      state: source.state,
    });
    expect(meaning.repetitions).toBe(source.repetitions);
  });

  it("listening y production nacen sin programar", () => {
    const items = planSkillModelMigration([srsFsrs("not")], [], NOW);
    for (const skill of ["listening", "production"] as const) {
      expect(items.find((item) => item.skill === skill)!.schedule).toEqual({ kind: "none" });
    }
  });

  it("siembra listening con la misma estimación provisional legacy", () => {
    const source = { ...srsFsrs("not"), repetitions: 14, stability: 120, state: "Review" as const };
    const listening = planSkillModelMigration([source], [], NOW).find((item) => item.skill === "listening")!;
    expect(listening.initialListeningLevel).toMatchObject({ level: 5, provisional: true });
  });

  it("deriva estado FSRS para filas SM-2 sin stability", () => {
    const meaning = planSkillModelMigration([srsLegacySm2("the")], [], NOW)
      .find((item) => item.skill === "meaning")!;
    expect(meaning.schedule.kind).toBe("fsrs");
    if (meaning.schedule.kind === "fsrs") {
      expect(meaning.schedule.stability).toBeGreaterThan(0);
      expect(meaning.schedule.state).toBe("Review");
    }
  });

  it("una fila sin repasos queda en state New", () => {
    const meaning = planSkillModelMigration(
      [{ ...srsLegacySm2("x"), repetitions: 0 }], [], NOW,
    ).find((item) => item.skill === "meaning")!;
    expect(meaning.schedule.kind === "fsrs" && meaning.schedule.state).toBe("New");
  });

  it("es idempotente: no duplica lo ya migrado", () => {
    const source = srsMigrationSet();
    const first = planSkillModelMigration(source, [], NOW);
    expect(planSkillModelMigration(source, first, NOW)).toHaveLength(0);
  });

  it("es idempotente parcialmente: solo crea lo que falta", () => {
    const source = srsMigrationSet();
    const first = planSkillModelMigration(source, [], NOW);
    const partial = first.filter((item) => item.skill !== "listening");
    const second = planSkillModelMigration(source, partial, NOW);
    expect(second.every((item) => item.skill === "listening")).toBe(true);
    expect(second).toHaveLength(source.length);
  });

  it("ignora SRSData que no sean de Essential Words", () => {
    const foreign = { ...srsFsrs("not"), wordId: "frag:123" };
    expect(planSkillModelMigration([foreign], [], NOW)).toHaveLength(0);
  });

  it("nunca persiste mature ni status", () => {
    const items = planSkillModelMigration(srsMigrationSet(), [], NOW);
    for (const item of items) {
      expect(item).not.toHaveProperty("mature");
      expect(item).not.toHaveProperty("status");
    }
  });
});
