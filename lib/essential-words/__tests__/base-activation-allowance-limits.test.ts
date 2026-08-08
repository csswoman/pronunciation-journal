import { describe, expect, it } from "vitest";
import {
  BASE_ACTIVATION_POLICY_VERSION,
  DEFAULT_BASE_ACTIVATION_POLICY,
  computeDynamicBaseAllowance,
  selectPendingBaseWithDynamicAllowance,
  type BaseActivationPolicy,
} from "../base-activation-allowance";
import { toPendingBaseCandidate } from "../pending-base-fairness";
import type { ActivationCandidate } from "../planning-types";

/**
 * Split off from base-activation-allowance.test.ts to keep both files under
 * the repo's 250-line convention (CLAUDE.md). Covers safety-ceiling,
 * recovery, and determinism cases (G, H, I, J, K, L, M, P); time-budget and
 * fairness-ordering cases (A-F) live in base-activation-allowance.test.ts.
 */
const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

function pending(
  itemId: string,
  skill: "listening" | "production",
  waitSessions: number,
): ActivationCandidate {
  return toPendingBaseCandidate({
    itemId,
    wordId: itemId.split("#")[0]!,
    skill,
    modality: skill,
    waitSessions,
    deadlineSession: Math.max(1, 8 - waitSessions),
  });
}

describe("computeDynamicBaseAllowance / selectPendingBase — ceiling y determinismo", () => {
  it("G: safety ceiling impide runaway pero no limita caso steady normal", () => {
    expect(DEFAULT_BASE_ACTIVATION_POLICY.version).toBe(BASE_ACTIVATION_POLICY_VERSION);
    expect(DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling).toBeGreaterThan(12);
    const allowance = computeDynamicBaseAllowance({
      pendingBase: Array.from({ length: 80 }, (_, index) => (
        pending(`c1k:r${index}#listening`, "listening", 2)
      )),
      residualSecondsToday: 50_000,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
    });
    expect(allowance.maxActivationsToday)
      .toBe(DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling);
    expect(allowance.limitingFactor).toBe("safety-ceiling");

    const normal = selectPendingBaseWithDynamicAllowance({
      pendingBase: Array.from({ length: 12 }, (_, index) => (
        pending(
          index % 2 === 0 ? `c1k:n${index}#listening` : `c1k:n${index}#production`,
          index % 2 === 0 ? "listening" : "production",
          5,
        )
      )),
      residualSecondsToday: 900,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(normal.selected.length).toBeGreaterThanOrEqual(12);
    expect(normal.allowance.limitingFactor).not.toBe("safety-ceiling");
  });

  it("K: mandatory residual alto -> allowance pequeño o cero", () => {
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: [pending("c1k:x#listening", "listening", 7)],
      residualSecondsToday: 5,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected).toHaveLength(0);
    expect(selection.allowance.maxActivationsToday).toBe(0);
  });

  it("L: capacidad abundante permite throughput >= demanda C8/C9", () => {
    const candidates = [
      ...Array.from({ length: 6 }, (_, index) => pending(`c1k:L${index}#listening`, "listening", 4)),
      ...Array.from({ length: 6 }, (_, index) => pending(`c1k:P${index}#production`, "production", 4)),
    ];
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 900,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected.length).toBeGreaterThanOrEqual(12);
  });

  it("M: pending preexistente gana a placement recién marcado", () => {
    const existing = pending("c1k:old#listening", "listening", 6);
    const placementLike = {
      ...pending("c1k:place#listening", "listening", 0),
      source: "placement" as const,
    };
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: [placementLike, existing],
      residualSecondsToday: 30,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected[0]?.itemId).toBe("c1k:old#listening");
  });

  it("H: allowance >4 no queda bloqueado por el antiguo maxBase=4", () => {
    const candidates = [
      ...Array.from({ length: 6 }, (_, index) => pending(`c1k:hL${index}#listening`, "listening", 7)),
      ...Array.from({ length: 6 }, (_, index) => pending(`c1k:hP${index}#production`, "production", 7)),
    ];
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 900,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected.length).toBeGreaterThan(4);
    expect(selection.allowance.maxActivationsToday).toBeGreaterThan(4);
    expect(selection.allowance.limitingFactor).not.toBe("safety-ceiling");
  });

  it("I: mas tiempo residual reabre slots base", () => {
    const candidates = Array.from({ length: 8 }, (_, index) => (
      pending(`c1k:i${index}#listening`, "listening", 5)
    ));
    const blocked = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 30,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    const reopened = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 900,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(blocked.selected.length).toBeLessThan(reopened.selected.length);
    expect(reopened.selected.length).toBeGreaterThan(4);
  });

  it("J: recovery prioriza near-C9 y no borra pending menos urgente del diagnóstico", () => {
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: [
        pending("c1k:urgent#listening", "listening", 7),
        pending("c1k:fresh#production", "production", 1),
      ],
      residualSecondsToday: 30,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: true,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected.map((item) => item.itemId)).toEqual(["c1k:urgent#listening"]);
    expect(selection.deferred.some((item) => item.itemId === "c1k:fresh#production")).toBe(true);
  });

  it("P: misma config produce mismo resultado", () => {
    const candidates = [
      pending("c1k:a#listening", "listening", 3),
      pending("c1k:b#production", "production", 5),
      pending("c1k:c#listening", "listening", 5),
    ];
    const input = {
      pendingBase: candidates,
      residualSecondsToday: 120,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY as BaseActivationPolicy,
      selectedItemIds: new Set<string>(),
      maxPerItemPerSession: 1,
    };
    const first = selectPendingBaseWithDynamicAllowance(input);
    const second = selectPendingBaseWithDynamicAllowance({
      ...input,
      selectedItemIds: new Set(),
    });
    expect(second.selected).toEqual(first.selected);
    expect(second.allowance).toEqual(first.allowance);
  });
});
