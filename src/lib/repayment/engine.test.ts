import { describe, expect, it } from "vitest";

import { simulateStrategy } from "@/lib/repayment/engine";

describe("simulateStrategy", () => {
  it("single debt should be payable", () => {
    const result = simulateStrategy(
      {
        monthlyBudget: 300000,
        extraPayment: 0,
        debts: [
          {
            name: "single",
            balance: 1200000,
            annualRate: 0.12,
            minimumPayment: 100000,
          },
        ],
      },
      "avalanche",
    );

    expect(result.monthsToPayoff).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThanOrEqual(0);
    expect(result.totalFeesPaid).toBe(0);
  });

  it("throws when budget is below minimum", () => {
    expect(() =>
      simulateStrategy(
        {
          monthlyBudget: 100000,
          extraPayment: 0,
          debts: [
            {
              name: "single",
              balance: 1200000,
              annualRate: 0.12,
              minimumPayment: 200000,
            },
          ],
        },
        "snowball",
      ),
    ).toThrow("BUDGET_BELOW_MINIMUM");
  });

  it("avalanche and snowball produce different payoff order for mixed debts", () => {
    const input = {
      monthlyBudget: 550000,
      extraPayment: 0,
      debts: [
        {
          name: "high-rate",
          balance: 3000000,
          annualRate: 0.19,
          minimumPayment: 150000,
        },
        {
          name: "small-balance",
          balance: 1200000,
          annualRate: 0.08,
          minimumPayment: 120000,
        },
      ],
    };

    const avalanche = simulateStrategy(input, "avalanche");
    const snowball = simulateStrategy(input, "snowball");

    const avalancheFirstExtra = avalanche.monthlyPlans.find(
      (item) => item.monthIndex === 1 && item.interestAmount === 0 && item.paymentAmount > 0,
    );
    const snowballFirstExtra = snowball.monthlyPlans.find(
      (item) => item.monthIndex === 1 && item.interestAmount === 0 && item.paymentAmount > 0,
    );

    expect(avalancheFirstExtra?.debtName).toBe("high-rate");
    expect(snowballFirstExtra?.debtName).toBe("small-balance");
  });

  it("applies prepayment fee and reflects it in net savings", () => {
    const withFee = simulateStrategy(
      {
        monthlyBudget: 500000,
        extraPayment: 100000,
        debts: [
          {
            name: "fee-loan",
            balance: 4_000_000,
            annualRate: 0.12,
            minimumPayment: 200_000,
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 12,
          },
        ],
      },
      "avalanche",
    );

    const withoutFee = simulateStrategy(
      {
        monthlyBudget: 500000,
        extraPayment: 100000,
        debts: [
          {
            name: "fee-loan",
            balance: 4_000_000,
            annualRate: 0.12,
            minimumPayment: 200_000,
            prepaymentFeeRate: 0,
            feeExemptionMonths: 12,
          },
        ],
      },
      "avalanche",
    );

    expect(withFee.totalFeesPaid).toBeGreaterThan(0);
    expect(withFee.netSavings).toBeLessThan(withoutFee.netSavings);
  });
});
