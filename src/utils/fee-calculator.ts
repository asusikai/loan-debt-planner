export type PrepaymentFeeMode = "sliding" | "fixed";

type FeeInput = {
  amount: number;
  rate: number;
  elapsedMonths: number;
  exemptionMonths: number;
  mode?: PrepaymentFeeMode;
};

function normalizeNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export function calculatePrepaymentFee({
  amount,
  rate,
  elapsedMonths,
  exemptionMonths,
  mode = "sliding",
}: FeeInput): number {
  const normalizedAmount = normalizeNonNegative(amount);
  const normalizedRate = normalizeNonNegative(rate);
  const normalizedElapsed = normalizeNonNegative(elapsedMonths);
  const normalizedExemption = normalizeNonNegative(exemptionMonths);

  if (
    normalizedAmount === 0 ||
    normalizedRate === 0 ||
    normalizedExemption === 0 ||
    normalizedElapsed >= normalizedExemption
  ) {
    return 0;
  }

  const baseFee = normalizedAmount * normalizedRate;

  if (mode === "fixed") {
    return Math.floor(baseFee);
  }

  const remainingRatio = (normalizedExemption - normalizedElapsed) / normalizedExemption;
  return Math.floor(baseFee * remainingRatio);
}
