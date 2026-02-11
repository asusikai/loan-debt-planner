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
        if (a.annualRate === 0 && b.annualRate !== 0) {
          return 1;
        }

        if (b.annualRate === 0 && a.annualRate !== 0) {
          return -1;
        }

        if (b.annualRate !== a.annualRate) {
          return b.annualRate - a.annualRate;
        }

        const maturityComparison = this.compareMaturity(a, b);
        if (maturityComparison !== 0) {
          return maturityComparison;
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

      const maturityComparison = this.compareMaturity(a, b);
      if (maturityComparison !== 0) {
        return maturityComparison;
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

  private compareMaturity<T extends Debt>(a: T, b: T): number {
    const aMaturity = this.normalizeMaturity(a.maturityMonths);
    const bMaturity = this.normalizeMaturity(b.maturityMonths);

    if (aMaturity === bMaturity) {
      return 0;
    }

    const aUrgent = aMaturity <= this.maturityUrgencyThresholdMonths;
    const bUrgent = bMaturity <= this.maturityUrgencyThresholdMonths;

    if (aUrgent !== bUrgent) {
      return aUrgent ? -1 : 1;
    }

    return aMaturity - bMaturity;
  }

  private normalizeMaturity(maturityMonths: number | undefined): number {
    if (!Number.isFinite(maturityMonths) || maturityMonths === undefined) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(0, maturityMonths);
  }
}
