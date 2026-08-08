import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  fixedExecutionContext,
  seededRandomSource,
  systemExecutionContext,
} from "../execution-context";

describe("ExecutionContext", () => {
  it("fija el reloj y entrega IDs secuenciales para tests", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    const context = fixedExecutionContext(now, ["attempt-1", "event-1"]);

    expect(context.now).toBe(now);
    expect([context.newId(), context.newId(), context.newId()]).toEqual([
      "attempt-1",
      "event-1",
      "test-id-3",
    ]);
  });

  it("crea el contexto del sistema en el borde", () => {
    const context = systemExecutionContext();

    expect(context.now).toBeInstanceOf(Date);
    expect(context.newId()).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe("seededRandomSource", () => {
  it("reproduce la misma secuencia con la misma semilla", () => {
    const first = seededRandomSource(42);
    const second = seededRandomSource(42);

    expect(Array.from({ length: 20 }, () => first.next()))
      .toEqual(Array.from({ length: 20 }, () => second.next()));
  });

  it("produce valores en [0, 1) y separa semillas distintas", () => {
    const random = seededRandomSource(1);
    const values = Array.from({ length: 20 }, () => random.next());

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(seededRandomSource(1).next()).not.toBe(seededRandomSource(2).next());
  });
});

describe("módulos puros de Essential Words", () => {
  it("no consultan reloj, UUID ni aleatoriedad global", () => {
    const pureModules = ["skill-item.ts"];
    const forbidden = [/new Date\(\)/, /Date\.now\(\)/, /crypto\.randomUUID\(\)/, /Math\.random\(\)/];

    for (const sourceFile of pureModules) {
      const source = readFileSync(
        path.join(process.cwd(), "lib", "essential-words", sourceFile),
        "utf8",
      );
      for (const pattern of forbidden) {
        expect(source).not.toMatch(pattern);
      }
    }
  });
});
