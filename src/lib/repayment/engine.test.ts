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

  it("applies fee right before exemption ends and removes it after exemption", () => {
    const beforeBoundary = simulateStrategy(
      {
        monthlyBudget: 400000,
        extraPayment: 100000,
        debts: [
          {
            name: "boundary-loan",
            balance: 2_000_000,
            annualRate: 0.1,
            minimumPayment: 150_000,
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 1,
          },
        ],
      },
      "avalanche",
    );

    const afterBoundary = simulateStrategy(
      {
        monthlyBudget: 400000,
        extraPayment: 100000,
        debts: [
          {
            name: "boundary-loan",
            balance: 2_000_000,
            annualRate: 0.1,
            minimumPayment: 150_000,
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 0,
          },
        ],
      },
      "avalanche",
    );

    expect(beforeBoundary.totalFeesPaid).toBeGreaterThan(0);
    expect(afterBoundary.totalFeesPaid).toBe(0);
  });

  it("can return negative net savings when fee outweighs interest savings", () => {
    const result = simulateStrategy(
      {
        monthlyBudget: 250000,
        extraPayment: 10_000,
        debts: [
          {
            name: "low-rate-high-fee",
            balance: 2_500_000,
            annualRate: 0.01,
            minimumPayment: 200_000,
            prepaymentFeeRate: 0.2,
            feeExemptionMonths: 12,
          },
        ],
      },
      "snowball",
    );

    expect(result.totalFeesPaid).toBeGreaterThan(0);
    expect(result.netSavings).toBeLessThan(0);
  });
});
