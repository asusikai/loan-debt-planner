import { describe, expect, it } from "vitest";

import { simulateStrategy } from "@/lib/repayment/engine";

function monthEndRemainingTotals(
  plans: Array<{ monthIndex: number; debtName: string; remainingBalance: number }>,
): number[] {
  const monthDebtBalance = new Map<number, Map<string, number>>();

  for (const plan of plans) {
    const debtMap = monthDebtBalance.get(plan.monthIndex) ?? new Map<string, number>();
    debtMap.set(plan.debtName, plan.remainingBalance);
    monthDebtBalance.set(plan.monthIndex, debtMap);
  }

  const sortedMonths = [...monthDebtBalance.keys()].sort((a, b) => a - b);
  return sortedMonths.map((month) => {
    const debtMap = monthDebtBalance.get(month);
    if (!debtMap) {
      return 0;
    }

    return [...debtMap.values()].reduce((sum, value) => sum + value, 0);
  });
}

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

  it("keeps monthly remaining balance identical regardless of fee amount", () => {
    const withFee = simulateStrategy(
      {
        monthlyBudget: 650000,
        extraPayment: 150000,
        debts: [
          {
            name: "alpha",
            balance: 4_500_000,
            annualRate: 0.16,
            minimumPayment: 200_000,
            prepaymentFeeRate: 0.03,
            feeExemptionMonths: 6,
          },
          {
            name: "beta",
            balance: 3_000_000,
            annualRate: 0.09,
            minimumPayment: 180_000,
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 6,
          },
        ],
      },
      "avalanche",
    );

    const withoutFee = simulateStrategy(
      {
        monthlyBudget: 650000,
        extraPayment: 150000,
        debts: [
          {
            name: "alpha",
            balance: 4_500_000,
            annualRate: 0.16,
            minimumPayment: 200_000,
            prepaymentFeeRate: 0,
            feeExemptionMonths: 6,
          },
          {
            name: "beta",
            balance: 3_000_000,
            annualRate: 0.09,
            minimumPayment: 180_000,
            prepaymentFeeRate: 0,
            feeExemptionMonths: 6,
          },
        ],
      },
      "avalanche",
    );

    expect(withFee.totalFeesPaid).toBeGreaterThan(0);
    expect(monthEndRemainingTotals(withFee.monthlyPlans)).toEqual(
      monthEndRemainingTotals(withoutFee.monthlyPlans),
    );
  });

  it("ends on exact payoff month without trailing plan rows", () => {
    const result = simulateStrategy(
      {
        monthlyBudget: 300_000,
        extraPayment: 0,
        debts: [
          {
            name: "tiny",
            balance: 90_000,
            annualRate: 0,
            minimumPayment: 300_000,
          },
        ],
      },
      "snowball",
    );

    const maxMonth = result.monthlyPlans.reduce(
      (latest, plan) => Math.max(latest, plan.monthIndex),
      0,
    );
    const finalRemaining = result.monthlyPlans[result.monthlyPlans.length - 1]?.remainingBalance ?? -1;

    expect(result.monthsToPayoff).toBe(1);
    expect(maxMonth).toBe(result.monthsToPayoff);
    expect(finalRemaining).toBe(0);
  });

});
