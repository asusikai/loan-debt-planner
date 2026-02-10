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
});
