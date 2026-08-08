import { DEFAULT_MATURITY_POLICY, isMature } from "../../lib/essential-words/skill-item";
import {
  usageActivationShare,
} from "../../lib/essential-words/simulation/criteria";
import {
  PROFILES,
  type SimulationProfileId,
} from "../../lib/essential-words/simulation/profiles";
import {
  runSimulation,
  SIMULATION_COSTS,
  type SimulationHookContext,
} from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";
import type { UsageKind } from "../../lib/essential-words/verification/types";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const percentile = (values: number[], proportion: number): number | null => {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.ceil(ordered.length * proportion) - 1] ?? null;
};

const kindOf = (
  context: SimulationHookContext,
  itemId: string,
): UsageKind | undefined => {
  for (const word of context.world.words.values()) {
    const usage = word.usage.find(({ item }) => item.id === itemId);
    if (usage) return usage.item.payload?.usageKind;
  }
  return undefined;
};

function diagnose(profileId: SimulationProfileId) {
  const eligibleIds: Record<UsageKind, Set<string>> = {
    context_usage: new Set(),
    advanced_usage: new Set(),
  };
  const eligibleAppearances: Record<UsageKind, number> = {
    context_usage: 0,
    advanced_usage: 0,
  };
  const activatedIds: Record<UsageKind, Set<string>> = {
    context_usage: new Set(),
    advanced_usage: new Set(),
  };
  const activated: Record<UsageKind, number> = {
    context_usage: 0,
    advanced_usage: 0,
  };
  const firstMatureAt = new Map<string, number>();
  let mandatorySelected = 0;
  let mandatoryCompleted = 0;
  let usageSeconds = 0;
  let selectedMandatoryIds = new Set<string>();
  let selectedUsageKinds = new Map<string, UsageKind>();
  const completedActivationsByDate = new Map<string, Record<UsageKind, number>>();

  const observeMaturity = (context: SimulationHookContext) => {
    for (const word of context.world.words.values()) {
      if (!word.introducedAt) continue;
      for (const item of [word.meaning, word.production]) {
        if (
          !firstMatureAt.has(item.id)
          && isMature(item, context.world.srsEvents, DEFAULT_MATURITY_POLICY)
        ) {
          const introduced = new Date(word.introducedAt).getTime();
          const mature = context.now.getTime();
          firstMatureAt.set(item.id, (mature - introduced) / 86_400_000);
        }
      }
    }
  };

  const result = runSimulation(PROFILES[profileId], options, {
    mutateCandidates(candidates, context) {
      observeMaturity(context);
      for (const candidate of candidates.usageActivations) {
        const kind = kindOf(context, candidate.itemId);
        if (!kind) continue;
        eligibleIds[kind].add(candidate.itemId);
        eligibleAppearances[kind] += 1;
      }
      return candidates;
    },
    mutatePlan(plan, _mandatory, context) {
      selectedMandatoryIds = new Set(plan.mandatorySelected.map(({ itemId }) => itemId));
      selectedUsageKinds = new Map();
      mandatorySelected += selectedMandatoryIds.size;
      for (const candidate of plan.usageSelected) {
        const kind = kindOf(context, candidate.itemId);
        if (!kind) continue;
        selectedUsageKinds.set(candidate.itemId, kind);
      }
      return plan;
    },
    mutateCompletions(completions, context) {
      const date = context.now.toISOString();
      const completedToday = completedActivationsByDate.get(date) ?? {
        context_usage: 0,
        advanced_usage: 0,
      };
      for (const completion of completions) {
        if (selectedMandatoryIds.has(completion.item.itemId)) mandatoryCompleted += 1;
        if (completion.item.skill === "usage") {
          usageSeconds += completion.assessment.interactionDurationMs / 1_000;
        }
        const activatedKind = selectedUsageKinds.get(completion.item.itemId);
        if (activatedKind) {
          activatedIds[activatedKind].add(completion.item.itemId);
          activated[activatedKind] += 1;
          completedToday[activatedKind] += 1;
        }
      }
      completedActivationsByDate.set(date, completedToday);
      return completions;
    },
  });

  const activeDays = result.days.filter(({ active }) => active);
  const matureBySkill = (skill: "meaning" | "production") => {
    const introduced = [...result.world.words.values()].filter((word) => word.introducedAt);
    const mature = introduced.filter((word) => (
      isMature(word[skill], result.srsEvents, DEFAULT_MATURITY_POLICY)
    ));
    const times = introduced
      .map((word) => firstMatureAt.get(word[skill].id))
      .filter((value): value is number => value !== undefined);
    return {
      mature: mature.length,
      introduced: introduced.length,
      share: introduced.length === 0 ? null : mature.length / introduced.length,
      p50Days: percentile(times, 0.5),
      p95Days: percentile(times, 0.95),
    };
  };

  let worstWindow: Record<string, number> | null = null;
  for (let end = 7; end <= activeDays.length; end += 1) {
    const window = activeDays.slice(end - 7, end);
    const usage = window.reduce((sum, day) => sum + day.usageActivations, 0);
    const base = window.reduce((sum, day) => sum + day.baseSkillActivations, 0);
    const newWords = window.reduce((sum, day) => sum + day.newWordMeaningActivations, 0);
    const denominator = usage + base + newWords;
    if (denominator < 10) continue;
    const share = usage / denominator;
    if (!worstWindow || share > worstWindow.share) {
      const contextUsage = window.reduce((sum, day) => (
        sum + (completedActivationsByDate.get(day.date)?.context_usage ?? 0)
      ), 0);
      const advancedUsage = window.reduce((sum, day) => (
        sum + (completedActivationsByDate.get(day.date)?.advanced_usage ?? 0)
      ), 0);
      worstWindow = {
        start: end - 7,
        end: end - 1,
        contextUsage,
        advancedUsage,
        usage,
        base,
        newWords,
        denominator,
        share,
      };
    }
  }

  const inventory = [...result.world.words.values()].flatMap(({ usage }) => usage);
  return {
    profile: profileId,
    policy: DEFAULT_MATURITY_POLICY,
    inventory: {
      context_usage: inventory.filter(({ item }) => item.payload?.usageKind === "context_usage").length,
      advanced_usage: inventory.filter(({ item }) => item.payload?.usageKind === "advanced_usage").length,
    },
    eligibleUnique: {
      context_usage: eligibleIds.context_usage.size,
      advanced_usage: eligibleIds.advanced_usage.size,
    },
    eligibleAppearances,
    activatedUnique: {
      context_usage: activatedIds.context_usage.size,
      advanced_usage: activatedIds.advanced_usage.size,
    },
    activated,
    usageTotal: activated.context_usage + activated.advanced_usage,
    baseActivations: activeDays.reduce((sum, day) => sum + day.baseSkillActivations, 0),
    newWordActivations: activeDays.reduce((sum, day) => sum + day.newWordMeaningActivations, 0),
    mandatorySelected,
    mandatoryCompleted,
    sessionsWithUsage: activeDays.filter(({ usageActivations }) => usageActivations > 0).length,
    activeSessions: activeDays.length,
    usageSeconds,
    expectedUsageSeconds: (activated.context_usage + activated.advanced_usage)
      * SIMULATION_COSTS.production,
    maturity: {
      meaning: matureBySkill("meaning"),
      production: matureBySkill("production"),
    },
    c6: usageActivationShare(result.days, 7, 10, 0.3),
    worstWindow,
  };
}

for (const profileId of Object.keys(PROFILES) as SimulationProfileId[]) {
  console.log(JSON.stringify(diagnose(profileId)));
}
