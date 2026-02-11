import type { Debt, ScenarioInput } from "@/types/repayment";

type CreateScenarioOptions = {
  seed?: number;
  debtCount?: number;
  includeEdgeCases?: boolean;
};

type InternalRng = () => number;

function createRng(seed: number): InternalRng {
  let value = seed >>> 0;

  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function randomInt(rng: InternalRng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomRate(rng: InternalRng): number {
  return Number((rng() * 0.25).toFixed(4));
}

function createRandomDebt(rng: InternalRng, index: number): Debt {
  const balance = randomInt(rng, 500_000, 10_000_000);
  const maturityMonths = randomInt(rng, 3, 72);

  return {
    name: `debt-${index + 1}`,
    balance,
    annualRate: randomRate(rng),
    minimumPayment: randomInt(rng, 50_000, 400_000),
    prepaymentFeeRate: Number((rng() * 0.03).toFixed(4)),
    feeExemptionMonths: randomInt(rng, 0, maturityMonths + 6),
    maturityMonths,
  };
}

export function createDebtFactory(options: CreateScenarioOptions = {}): Debt[] {
  const seed = options.seed ?? 20260212;
  const debtCount = options.debtCount ?? 4;
  const includeEdgeCases = options.includeEdgeCases ?? true;
  const rng = createRng(seed);

  const debts = Array.from({ length: debtCount }, (_, index) => createRandomDebt(rng, index));

  if (includeEdgeCases) {
    debts.push({
      name: "edge-zero-rate",
      balance: 2_000_000,
      annualRate: 0,
      minimumPayment: 120_000,
      prepaymentFeeRate: 0.01,
      feeExemptionMonths: 18,
      maturityMonths: 12,
    });

    debts.push({
      name: "edge-long-fee-window",
      balance: 1_200_000,
      annualRate: 0.089,
      minimumPayment: 100_000,
      prepaymentFeeRate: 0.02,
      feeExemptionMonths: 24,
      maturityMonths: 10,
    });
  }

  return debts;
}

export function createScenarioFactory(options: CreateScenarioOptions = {}): ScenarioInput {
  const debts = createDebtFactory(options);
  const minimumRequired = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  return {
    debts,
    monthlyBudget: minimumRequired + 300_000,
    extraPayment: 100_000,
  };
}
