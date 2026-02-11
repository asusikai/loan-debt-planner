import { describe, expect, it } from "vitest";

import { simulateStrategy } from "@/lib/repayment/engine";
import { verifyRepaymentInvariant } from "@/lib/repayment/invariant-check";

describe("verifyRepaymentInvariant", () => {
  it("passes for valid engine output", () => {
    const input = {
      monthlyBudget: 650_000,
      extraPayment: 120_000,
      debts: [
        {
          name: "alpha",
          balance: 4_000_000,
          annualRate: 0.12,
          minimumPayment: 200_000,
          prepaymentFeeRate: 0.02,
          feeExemptionMonths: 12,
        },
        {
          name: "beta",
          balance: 3_100_000,
          annualRate: 0.08,
          minimumPayment: 180_000,
          prepaymentFeeRate: 0.01,
          feeExemptionMonths: 6,
        },
      ],
    };

    const result = simulateStrategy(input, "avalanche");
    const invariant = verifyRepaymentInvariant(input.debts, result.monthlyPlans, 10);

    expect(invariant.valid).toBe(true);
  });

  it("detects tampered monthly plan data", () => {
    const input = {
      monthlyBudget: 300_000,
      extraPayment: 0,
      debts: [
        {
          name: "single",
          balance: 1_000_000,
          annualRate: 0.12,
          minimumPayment: 120_000,
        },
      ],
    };

    const result = simulateStrategy(input, "snowball");
    const tampered = result.monthlyPlans.map((item, index) =>
      index === 0 ? { ...item, remainingBalance: item.remainingBalance + 10_000 } : item,
    );

    const invariant = verifyRepaymentInvariant(input.debts, tampered, 10);

    expect(invariant.valid).toBe(false);
    expect(invariant.violation).toBeDefined();
  });
});
