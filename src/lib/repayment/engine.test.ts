import { describe, expect, it } from "vitest";

import { simulateStrategy } from "@/lib/repayment/engine";
import type { ScenarioInput } from "@/types/repayment";

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
        extraPayment: 0,
        debts: [
          {
            name: "single",
            balance: 1200000,
            annualRate: 0.12,
            repaymentType: "equalInstallment",
          },
        ],
      },
      "avalanche",
    );

    expect(result.monthsToPayoff).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThanOrEqual(0);
    expect(result.totalFeesPaid).toBe(0);
  });

  it("handles bullet repayment with maturity payoff", () => {
    const result = simulateStrategy(
      {
        extraPayment: 0,
        debts: [
          {
            name: "bullet-loan",
            balance: 1_000_000,
            annualRate: 0.12,
            repaymentType: "bullet",
            maturityMonths: 2,
          },
        ],
      },
      "avalanche",
    );

    expect(result.monthsToPayoff).toBe(2);
  });

  it("reflects principal-heavy reduction for equal principal", () => {
    const result = simulateStrategy(
      {
        extraPayment: 0,
        debts: [
          {
            name: "equal-principal",
            balance: 1_200_000,
            annualRate: 0.12,
            repaymentType: "equalPrincipal",
            maturityMonths: 3,
          },
        ],
      },
      "snowball",
    );

    const firstMonth = result.monthlyPlans.find((item) => item.monthIndex === 1 && item.interestAmount > 0);
    const secondMonth = result.monthlyPlans.find((item) => item.monthIndex === 2 && item.interestAmount > 0);

    expect(firstMonth?.principalAmount).toBeGreaterThan(0);
    expect(secondMonth?.interestAmount).toBeLessThan(firstMonth?.interestAmount ?? Number.POSITIVE_INFINITY);
  });

  it("applies interest-only payments during grace period", () => {
    const result = simulateStrategy(
      {
        extraPayment: 0,
        debts: [
          {
            name: "grace-loan",
            balance: 1_200_000,
            annualRate: 0.12,
            repaymentType: "equalInstallment",
            maturityMonths: 12,
            graceMonths: 2,
          },
        ],
      },
      "avalanche",
    );

    const month1 = result.monthlyPlans.find((item) => item.monthIndex === 1 && item.debtName === "grace-loan");
    const month2 = result.monthlyPlans.find((item) => item.monthIndex === 2 && item.debtName === "grace-loan");
    const month3 = result.monthlyPlans.find((item) => item.monthIndex === 3 && item.debtName === "grace-loan");

    expect(month1?.principalAmount).toBe(0);
    expect(month2?.principalAmount).toBe(0);
    expect((month3?.principalAmount ?? 0) > 0).toBe(true);
  });

  it("avalanche and snowball produce different payoff order for mixed debts", () => {
    const input: ScenarioInput = {
      extraPayment: 50_000,
      debts: [
        {
          name: "high-rate",
          balance: 3000000,
          annualRate: 0.19,
          repaymentType: "equalInstallment",
        },
        {
          name: "small-balance",
          balance: 1200000,
          annualRate: 0.08,
          repaymentType: "equalInstallment",
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
        extraPayment: 100000,
        debts: [
          {
            name: "fee-loan",
            balance: 4_000_000,
            annualRate: 0.12,
            repaymentType: "equalInstallment",
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 12,
          },
        ],
      },
      "avalanche",
    );

    const withoutFee = simulateStrategy(
      {
        extraPayment: 100000,
        debts: [
          {
            name: "fee-loan",
            balance: 4_000_000,
            annualRate: 0.12,
            repaymentType: "equalInstallment",
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
        extraPayment: 100000,
        debts: [
          {
            name: "boundary-loan",
            balance: 2_000_000,
            annualRate: 0.1,
            repaymentType: "equalInstallment",
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 1,
          },
        ],
      },
      "avalanche",
    );

    const afterBoundary = simulateStrategy(
      {
        extraPayment: 100000,
        debts: [
          {
            name: "boundary-loan",
            balance: 2_000_000,
            annualRate: 0.1,
            repaymentType: "equalInstallment",
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
        extraPayment: 10_000,
        debts: [
          {
            name: "low-rate-high-fee",
            balance: 2_500_000,
            annualRate: 0.01,
            repaymentType: "equalInstallment",
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

  it("reduces extra principal when fee is charged", () => {
    const withFee = simulateStrategy(
      {
        extraPayment: 150000,
        debts: [
          {
            name: "alpha",
            balance: 4_500_000,
            annualRate: 0.16,
            repaymentType: "equalInstallment",
            maturityMonths: 60,
            prepaymentFeeRate: 0.03,
            feeExemptionMonths: 6,
          },
          {
            name: "beta",
            balance: 3_000_000,
            annualRate: 0.09,
            repaymentType: "equalInstallment",
            maturityMonths: 60,
            prepaymentFeeRate: 0.02,
            feeExemptionMonths: 6,
          },
        ],
      },
      "avalanche",
    );

    const withoutFee = simulateStrategy(
      {
        extraPayment: 150000,
        debts: [
          {
            name: "alpha",
            balance: 4_500_000,
            annualRate: 0.16,
            repaymentType: "equalInstallment",
            maturityMonths: 60,
            prepaymentFeeRate: 0,
            feeExemptionMonths: 6,
          },
          {
            name: "beta",
            balance: 3_000_000,
            annualRate: 0.09,
            repaymentType: "equalInstallment",
            maturityMonths: 60,
            prepaymentFeeRate: 0,
            feeExemptionMonths: 6,
          },
        ],
      },
      "avalanche",
    );

    expect(withFee.totalFeesPaid).toBeGreaterThan(0);

    const withFeeTotals = monthEndRemainingTotals(withFee.monthlyPlans);
    const withoutFeeTotals = monthEndRemainingTotals(withoutFee.monthlyPlans);
    expect(withFeeTotals[0]).toBeGreaterThan(withoutFeeTotals[0] ?? 0);
    expect(withFee.monthsToPayoff).toBeGreaterThanOrEqual(withoutFee.monthsToPayoff);
  });

  it("ends on exact payoff month without trailing plan rows", () => {
    const result = simulateStrategy(
      {
        extraPayment: 0,
        debts: [
          {
            name: "tiny",
            balance: 90_000,
            annualRate: 0,
            repaymentType: "equalPrincipal",
            maturityMonths: 1,
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
