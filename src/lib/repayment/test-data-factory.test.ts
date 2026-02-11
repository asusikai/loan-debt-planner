import { describe, expect, it } from "vitest";

import { scenarioSchema } from "@/lib/validation/repayment-schema";
import { createDebtFactory, createScenarioFactory } from "@/lib/repayment/test-data-factory";

describe("test data factory", () => {
  it("creates deterministic debt sets with same seed", () => {
    const left = createDebtFactory({ seed: 1234, debtCount: 3, includeEdgeCases: false });
    const right = createDebtFactory({ seed: 1234, debtCount: 3, includeEdgeCases: false });

    expect(left).toEqual(right);
  });

  it("includes requested edge cases", () => {
    const debts = createDebtFactory({ seed: 9, debtCount: 2, includeEdgeCases: true });

    expect(debts.some((debt) => debt.annualRate === 0)).toBe(true);
    expect(
      debts.some(
        (debt) =>
          debt.maturityMonths !== undefined &&
          debt.feeExemptionMonths !== undefined &&
          debt.feeExemptionMonths > debt.maturityMonths,
      ),
    ).toBe(true);
  });

  it("creates scenario payload that passes repayment zod schema", () => {
    const scenario = createScenarioFactory({ seed: 42, debtCount: 4, includeEdgeCases: true });
    const parsed = scenarioSchema.safeParse(scenario);

    expect(parsed.success).toBe(true);
  });
});
