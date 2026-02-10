import type { Debt, StrategyType } from "@/types/repayment";

export function rankDebtsByStrategy<T extends Debt>(
  debts: T[],
  strategy: StrategyType,
): T[] {
  if (strategy === "avalanche") {
    return [...debts].sort((a, b) => {
      if (b.annualRate !== a.annualRate) {
        return b.annualRate - a.annualRate;
      }
      return b.balance - a.balance;
    });
  }

  return [...debts].sort((a, b) => {
    if (a.balance !== b.balance) {
      return a.balance - b.balance;
    }
    return b.annualRate - a.annualRate;
  });
}
