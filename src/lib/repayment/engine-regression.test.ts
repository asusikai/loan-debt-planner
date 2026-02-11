import { describe, expect, it } from "vitest";

import { simulateStrategy } from "@/lib/repayment/engine";
import { verifyRepaymentInvariant } from "@/lib/repayment/invariant-check";
import { createScenarioFactory } from "@/lib/repayment/test-data-factory";
import type { StrategyType } from "@/types/repayment";

function finalBalancesByDebt(monthlyPlans: ReturnType<typeof simulateStrategy>["monthlyPlans"]): Map<string, number> {
  const finalByDebt = new Map<string, number>();

  for (const plan of monthlyPlans) {
    finalByDebt.set(plan.debtName, plan.remainingBalance);
  }

  return finalByDebt;
}

describe("repayment engine regression matrix", () => {
  const seeds = [11, 42, 99, 123, 2026];
  const strategies: StrategyType[] = ["avalanche", "snowball"];

  for (const seed of seeds) {
    for (const strategy of strategies) {
      it(`stays stable for seed=${seed}, strategy=${strategy}`, () => {
        const scenario = createScenarioFactory({
          seed,
          debtCount: 12,
          includeEdgeCases: true,
        });

        const result = simulateStrategy(
          {
            ...scenario,
            extraPayment: 50_000,
          },
          strategy,
        );
        const invariant = verifyRepaymentInvariant(scenario.debts, result.monthlyPlans);
        const finalByDebt = finalBalancesByDebt(result.monthlyPlans);

        expect(result.monthsToPayoff).toBeGreaterThan(0);
        expect(result.monthsToPayoff).toBeLessThanOrEqual(1200);
        expect(invariant.valid).toBe(true);
        expect([...finalByDebt.values()].every((balance) => balance === 0)).toBe(true);
      });
    }
  }
});
