import { describe, expect, it } from "vitest";
import {
  DEFAULT_BASE_ACTIVATION_POLICY,
  selectPendingBaseWithDynamicAllowance,
} from "../base-activation-allowance";
import { toPendingBaseCandidate } from "../pending-base-fairness";
import type { ActivationCandidate } from "../planning-types";

/**
 * Covers time-budget and fairness-ordering cases (A-F). Safety-ceiling,
 * recovery, and determinism cases (G-P) live in
 * base-activation-allowance-limits.test.ts (split for the repo's 250-line
 * file-size convention, CLAUDE.md).
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

describe("computeDynamicBaseAllowance / selectPendingBase", () => {
  it("A: con 12 pending y segundos suficientes selecciona >4", () => {
    const candidates = [
      ...Array.from({ length: 6 }, (_, index) => pending(`c1k:l${index}#listening`, "listening", 6)),
      ...Array.from({ length: 6 }, (_, index) => pending(`c1k:p${index}#production`, "production", 6)),
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
    expect(selection.allowance.limitingFactor).not.toBe("safety-ceiling");
  });

  it("B: con segundos solo para 3, selecciona 3 aunque ceiling alto", () => {
    const candidates = Array.from({ length: 12 }, (_, index) => (
      pending(`c1k:x${index}#listening`, "listening", 3)
    ));
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 70, // after 10% reserve ~63 -> 3 x listening(20)
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected).toHaveLength(3);
    expect(selection.allowance.limitingFactor).toBe("time-budget");
  });

  it("C: mandatory reduce allowance antes que pending base", () => {
    const candidates = Array.from({ length: 10 }, (_, index) => (
      pending(`c1k:m${index}#listening`, "listening", 4)
    ));
    const withMandatory = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 100, // already after mandatory
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    const generous = selectPendingBaseWithDynamicAllowance({
      pendingBase: candidates,
      residualSecondsToday: 900,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(withMandatory.selected.length).toBeLessThan(generous.selected.length);
  });

  it("E: wait=7 gana sobre wait=1", () => {
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: [
        pending("c1k:new#listening", "listening", 1),
        pending("c1k:old#listening", "listening", 7),
      ],
      residualSecondsToday: 30,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    expect(selection.selected.map((item) => item.itemId)).toEqual(["c1k:old#listening"]);
  });

  it("F: listening y production urgentes sin starvation", () => {
    const selection = selectPendingBaseWithDynamicAllowance({
      pendingBase: [
        pending("c1k:l1#listening", "listening", 7),
        pending("c1k:l2#listening", "listening", 7),
        pending("c1k:l3#listening", "listening", 7),
        pending("c1k:p1#production", "production", 7),
        pending("c1k:p2#production", "production", 7),
        pending("c1k:p3#production", "production", 7),
      ],
      residualSecondsToday: 900,
      modalityCosts: costs,
      mandatoryDueBaseCount: 0,
      recoveryMode: false,
      policy: DEFAULT_BASE_ACTIVATION_POLICY,
      selectedItemIds: new Set(),
      maxPerItemPerSession: 1,
    });
    const listening = selection.selected.filter((item) => item.skill === "listening").length;
    const production = selection.selected.filter((item) => item.skill === "production").length;
    expect(listening).toBeGreaterThan(0);
    expect(production).toBeGreaterThan(0);
  });

});
