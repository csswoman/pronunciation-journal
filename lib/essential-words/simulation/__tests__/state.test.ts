import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PROFILES } from "../profiles";
import {
  createInitialWorld,
  simulationContext,
  type SimulationOptions,
} from "../state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 100,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

describe("estado inicial de la simulación", () => {
  it("cada palabra contiene exactamente tres habilidades base", () => {
    const world = createInitialWorld(options, PROFILES.steady);
    const first = [...world.words.values()][0];

    expect([first.meaning.skill, first.listening.skill, first.production.skill])
      .toEqual(["meaning", "listening", "production"]);
    expect([first.meaning, first.listening, first.production])
      .toHaveLength(3);
  });

  it("el corpus existe sin contarse como introducido", () => {
    const world = createInitialWorld(options, PROFILES.steady);

    expect(world.introducedWords).toBe(0);
    expect([...world.words.values()].every((word) => word.introducedAt === undefined))
      .toBe(true);
  });

  it("dos simulaciones no comparten referencias mutables", () => {
    const firstWorld = createInitialWorld(options, PROFILES.steady);
    const secondWorld = createInitialWorld(options, PROFILES.steady);
    const first = [...firstWorld.words.values()][0];
    const second = [...secondWorld.words.values()][0];

    first.meaning.repetitions = 99;
    first.usage[0].item.repetitions = 99;

    expect(second.meaning.repetitions).toBe(0);
    expect(second.usage[0].item.repetitions).toBe(0);
  });

  it("advanced contiene inferencias sin programación", () => {
    const world = createInitialWorld(options, PROFILES.advanced);
    const inferred = [...world.words.values()]
      .map((word) => word.meaning)
      .filter((item) => item.placementInference);

    expect(inferred.length).toBeGreaterThan(0);
    expect(inferred.length).toBeLessThan(options.corpusSize);
    expect(inferred.every((item) => item.schedule.kind === "none")).toBe(true);
  });

  it("incluye usage listo pero no todo está disponible desde el día cero", () => {
    const world = createInitialWorld(options, PROFILES.advanced);
    const usage = [...world.words.values()].flatMap((word) => word.usage);

    expect(usage.length).toBeGreaterThan(0);
    expect(usage.every(({ item }) => (
      item.skill === "usage"
      && item.schedule.kind === "none"
      && item.payload?.generationStatus === "ready"
    ))).toBe(true);
    expect(usage.some(({ readyAt }) => readyAt > options.startAt)).toBe(true);
    expect(new Set(usage.map(({ item }) => item.payload?.usageKind)))
      .toEqual(new Set(["context_usage", "advanced_usage"]));
  });

  it("el contexto diario fija reloj e IDs reproducibles", () => {
    const date = new Date("2026-08-10T00:00:00.000Z");
    const first = simulationContext(date, 42, { value: 0 });
    const second = simulationContext(date, 42, { value: 0 });

    expect(first.now).toBe(date);
    expect([first.newId(), first.newId()]).toEqual(["sim:42:0", "sim:42:1"]);
    expect([second.newId(), second.newId()]).toEqual(["sim:42:0", "sim:42:1"]);
  });

  it("no consulta reloj, UUID ni aleatoriedad global", () => {
    const simulationDirectory = path.join(process.cwd(), "lib", "essential-words", "simulation");
    const pureModules = ["fixtures.ts", "profiles.ts", "state.ts"];
    const forbidden = [/new Date\(\)/, /Date\.now\(\)/, /crypto\.randomUUID\(\)/, /Math\.random\(\)/];

    for (const sourceFile of pureModules) {
      const source = readFileSync(path.join(simulationDirectory, sourceFile), "utf8");
      for (const pattern of forbidden) expect(source).not.toMatch(pattern);
    }
  });
});
