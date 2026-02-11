import { describe, expect, it } from "vitest";

import { debtSchema, scenarioSchema } from "@/lib/validation/repayment-schema";

describe("repayment validation schema", () => {
  it("accepts valid debt payload", () => {
    const parsed = debtSchema.parse({
      name: "loan-a",
      balance: 5_000_000,
      annualRate: 0.12,
      minimumPayment: 200_000,
      maturityMonths: 24,
      prepaymentFeeRate: 0.01,
    });

    expect(parsed.name).toBe("loan-a");
    expect(parsed.minimumPayment).toBe(200_000);
  });

  it("accepts valid scenario payload", () => {
    const parsed = scenarioSchema.parse({
      monthlyBudget: 700_000,
      extraPayment: 100_000,
      debts: [
        {
          name: "loan-a",
          balance: 5_000_000,
          annualRate: 0.12,
          minimumPayment: 200_000,
        },
      ],
    });

    expect(parsed.monthlyBudget).toBe(700_000);
    expect(parsed.debts).toHaveLength(1);
  });

  it("rejects invalid debt boundary values", () => {
    expect(() =>
      debtSchema.parse({
        name: "loan-a",
        balance: -1,
        annualRate: 1.2,
        minimumPayment: -10,
      }),
    ).toThrow();
  });

  it("rejects scenario when budget is below total minimum payment", () => {
    expect(() =>
      scenarioSchema.parse({
        monthlyBudget: 100_000,
        extraPayment: 0,
        debts: [
          {
            name: "loan-a",
            balance: 5_000_000,
            annualRate: 0.12,
            minimumPayment: 200_000,
          },
        ],
      }),
    ).toThrow();
  });
});
