import type { Debt, StrategyType } from "@/types/repayment";

export type SortProviderOptions = {
  maturityUrgencyThresholdMonths?: number;
};

export class SortProvider {
  private readonly maturityUrgencyThresholdMonths: number;

  constructor(options: SortProviderOptions = {}) {
    this.maturityUrgencyThresholdMonths = options.maturityUrgencyThresholdMonths ?? 3;
  }

  rankDebtsByStrategy<T extends Debt>(debts: T[], strategy: StrategyType): T[] {
    if (strategy === "avalanche") {
      return [...debts].sort((a, b) => {
        if (b.annualRate !== a.annualRate) {
          return b.annualRate - a.annualRate;
        }

        return this.getPriorityBalance(b) - this.getPriorityBalance(a);
      });
    }

    return [...debts].sort((a, b) => {
      const aBalance = this.getPriorityBalance(a);
      const bBalance = this.getPriorityBalance(b);

      if (aBalance !== bBalance) {
        return aBalance - bBalance;
      }

      return b.annualRate - a.annualRate;
    });
  }

  getThresholdMonths(): number {
    return this.maturityUrgencyThresholdMonths;
  }

  private getPriorityBalance<T extends Debt>(debt: T): number {
    const maybeWithRemaining = debt as T & { remainingBalance?: number };
    if (typeof maybeWithRemaining.remainingBalance === "number") {
      return maybeWithRemaining.remainingBalance;
    }

    return debt.balance;
  }
}
