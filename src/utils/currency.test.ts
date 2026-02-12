import { describe, expect, it } from "vitest";

import {
  calculateMonthlyInterest,
  preciseAdd,
  preciseSubtract,
  toKrw,
} from "@/utils/currency";

describe("currency utilities", () => {
  it("handles floating-point addition safely", () => {
    expect(preciseAdd(0.1, 0.2)).toBe(0.3);
  });

  it("handles floating-point subtraction safely", () => {
    expect(preciseSubtract(0.3, 0.1)).toBe(0.2);
  });

  it("normalizes KRW to non-negative integers", () => {
    expect(toKrw(1000.8)).toBe(1001);
    expect(toKrw(-1)).toBe(0);
  });

  it("calculates monthly interest with deterministic integer result", () => {
    expect(calculateMonthlyInterest(1_000_000, 0.12)).toBe(10_000);
  });
});
