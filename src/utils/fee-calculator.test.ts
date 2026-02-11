import { describe, expect, it } from "vitest";

import { calculatePrepaymentFee } from "@/utils/fee-calculator";

describe("calculatePrepaymentFee", () => {
  it("calculates sliding fee within exemption period", () => {
    const fee = calculatePrepaymentFee({
      amount: 1_000_000,
      rate: 0.02,
      elapsedMonths: 3,
      exemptionMonths: 12,
    });

    expect(fee).toBe(15_000);
  });

  it("returns zero at exemption boundary and outside period", () => {
    const boundaryFee = calculatePrepaymentFee({
      amount: 1_000_000,
      rate: 0.02,
      elapsedMonths: 12,
      exemptionMonths: 12,
    });
    const outsideFee = calculatePrepaymentFee({
      amount: 1_000_000,
      rate: 0.02,
      elapsedMonths: 15,
      exemptionMonths: 12,
    });

    expect(boundaryFee).toBe(0);
    expect(outsideFee).toBe(0);
  });

  it("supports fixed fee mode during exemption period", () => {
    const fee = calculatePrepaymentFee({
      amount: 1_000_000,
      rate: 0.02,
      elapsedMonths: 3,
      exemptionMonths: 12,
      mode: "fixed",
    });

    expect(fee).toBe(20_000);
  });

  it("safely handles invalid or negative inputs", () => {
    const fee = calculatePrepaymentFee({
      amount: -1,
      rate: Number.NaN,
      elapsedMonths: -5,
      exemptionMonths: 12,
    });

    expect(fee).toBe(0);
  });
});
