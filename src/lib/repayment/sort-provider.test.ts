import { describe, expect, it } from "vitest";

import { SortProvider } from "@/lib/repayment/sort-provider";
import type { Debt } from "@/types/repayment";

const sortProvider = new SortProvider({ maturityUrgencyThresholdMonths: 3 });

function names(debts: Debt[]): string[] {
  return debts.map((debt) => debt.name);
}

describe("SortProvider", () => {
  it("uses maturity as tie-breaker when avalanche rates are equal", () => {
    const input: Debt[] = [
      { name: "late", balance: 2_000_000, annualRate: 0.1, repaymentType: "equalInstallment", maturityMonths: 10 },
      { name: "soon", balance: 2_000_000, annualRate: 0.1, repaymentType: "equalInstallment", maturityMonths: 2 },
      { name: "middle", balance: 2_000_000, annualRate: 0.1, repaymentType: "equalInstallment", maturityMonths: 6 },
    ];

    const sorted = sortProvider.rankDebtsByStrategy(input, "avalanche");

    expect(names(sorted)).toEqual(["soon", "middle", "late"]);
  });

  it("moves zero-rate debts to the end for avalanche", () => {
    const input: Debt[] = [
      { name: "zero", balance: 1_000_000, annualRate: 0, repaymentType: "equalInstallment", maturityMonths: 1 },
      { name: "high", balance: 1_000_000, annualRate: 0.2, repaymentType: "equalInstallment", maturityMonths: 12 },
      { name: "mid", balance: 1_000_000, annualRate: 0.08, repaymentType: "equalInstallment", maturityMonths: 12 },
    ];

    const sorted = sortProvider.rankDebtsByStrategy(input, "avalanche");

    expect(names(sorted)).toEqual(["high", "mid", "zero"]);
  });

  it("keeps snowball primary ordering by balance", () => {
    const input: Debt[] = [
      { name: "large", balance: 3_000_000, annualRate: 0.2, repaymentType: "equalInstallment", maturityMonths: 2 },
      { name: "small", balance: 1_000_000, annualRate: 0.02, repaymentType: "equalInstallment", maturityMonths: 12 },
      { name: "medium", balance: 2_000_000, annualRate: 0.05, repaymentType: "equalInstallment", maturityMonths: 8 },
    ];

    const sorted = sortProvider.rankDebtsByStrategy(input, "snowball");

    expect(names(sorted)).toEqual(["small", "medium", "large"]);
  });

  it("handles all zero-rate debts with maturity ordering", () => {
    const input: Debt[] = [
      { name: "z3", balance: 900_000, annualRate: 0, repaymentType: "equalInstallment", maturityMonths: 8 },
      { name: "z1", balance: 900_000, annualRate: 0, repaymentType: "equalInstallment", maturityMonths: 1 },
      { name: "z2", balance: 900_000, annualRate: 0, repaymentType: "equalInstallment", maturityMonths: 4 },
    ];

    const sorted = sortProvider.rankDebtsByStrategy(input, "avalanche");

    expect(names(sorted)).toEqual(["z1", "z2", "z3"]);
  });
});
