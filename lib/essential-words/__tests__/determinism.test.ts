import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fixedExecutionContext, seededRandomSource } from "../execution-context";

const NONDETERMINISTIC_APIS = {
  newDate: /new Date\(\)/g,
  dateNow: /Date\.now\(\)/g,
  randomUuid: /crypto\.randomUUID\(\)/g,
  mathRandom: /Math\.random\(\)/g,
};

const phaseOnePureModules = [
  "skill-item.ts",
  "verification/types.ts",
];

function sourceFor(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), "lib", "essential-words", relativePath), "utf8");
}

function occurrences(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

describe("auditoría de determinismo de la Fase 1", () => {
  it("clasifica cada acceso global: ninguno en módulos puros y dos en el borde", () => {
    for (const relativePath of phaseOnePureModules) {
      const source = sourceFor(relativePath);
      for (const pattern of Object.values(NONDETERMINISTIC_APIS)) {
        expect(occurrences(source, pattern)).toBe(0);
      }
    }

    const boundary = sourceFor("execution-context.ts");
    expect(occurrences(boundary, NONDETERMINISTIC_APIS.newDate)).toBe(1);
    expect(occurrences(boundary, NONDETERMINISTIC_APIS.randomUuid)).toBe(1);
    expect(occurrences(boundary, NONDETERMINISTIC_APIS.dateNow)).toBe(0);
    expect(occurrences(boundary, NONDETERMINISTIC_APIS.mathRandom)).toBe(0);
  });

  it("reproduce reloj, IDs y aleatoriedad con el mismo contexto", () => {
    const run = () => {
      const context = fixedExecutionContext(
        new Date("2026-08-06T10:00:00.000Z"),
        ["attempt-1", "event-1"],
      );
      const random = seededRandomSource(42);
      return {
        now: context.now.toISOString(),
        ids: [context.newId(), context.newId()],
        values: Array.from({ length: 5 }, () => random.next()),
      };
    };

    expect(run()).toEqual(run());
  });
});
