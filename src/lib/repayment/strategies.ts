import type { Debt, StrategyType } from "@/types/repayment";

function getPriorityBalance<T extends Debt>(debt: T): number {
  const maybeWithRemaining = debt as T & { remainingBalance?: number };
  if (typeof maybeWithRemaining.remainingBalance === "number") {
    return maybeWithRemaining.remainingBalance;
  }

  return debt.balance;
}

export function rankDebtsByStrategy<T extends Debt>(
  debts: T[],
  strategy: StrategyType,
): T[] {
  if (strategy === "avalanche") {
    return [...debts].sort((a, b) => {
      if (b.annualRate !== a.annualRate) {
        return b.annualRate - a.annualRate;
      }
      return getPriorityBalance(b) - getPriorityBalance(a);
    });
  }

  return [...debts].sort((a, b) => {
    const aBalance = getPriorityBalance(a);
    const bBalance = getPriorityBalance(b);
    if (aBalance !== bBalance) {
      return aBalance - bBalance;
    }
    return b.annualRate - a.annualRate;
  });
}
