const DEFAULT_PRECISION = 10;

export function preciseAdd(a: number, b: number, precision = DEFAULT_PRECISION): number {
  return Number((a + b).toFixed(precision));
}

export function preciseSubtract(a: number, b: number, precision = DEFAULT_PRECISION): number {
  return Number((a - b).toFixed(precision));
}

export function toKrw(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  return Math.floor((toKrw(balance) * annualRate) / 12);
}
