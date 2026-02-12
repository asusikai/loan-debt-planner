import type { Debt, MonthlyPlanItem } from "@/types/repayment";

export type InvariantViolation = {
  debtName: string;
  monthIndex: number;
  expectedRemainingBalance: number;
  actualRemainingBalance: number;
};

export type InvariantCheckResult = {
  valid: boolean;
  violation?: InvariantViolation;
};

function toFixedNumber(value: number, precision: number): number {
  return Number(value.toFixed(precision));
}

export function verifyRepaymentInvariant(
  debts: Debt[],
  monthlyPlans: MonthlyPlanItem[],
  precision = 10,
): InvariantCheckResult {
  const previousByDebt = new Map<string, number>(
    debts.map((debt) => [debt.name, toFixedNumber(debt.balance, precision)]),
  );

  for (const plan of monthlyPlans) {
    const previous = previousByDebt.get(plan.debtName);
    if (previous === undefined) {
      return {
        valid: false,
        violation: {
          debtName: plan.debtName,
          monthIndex: plan.monthIndex,
          expectedRemainingBalance: Number.NaN,
          actualRemainingBalance: plan.remainingBalance,
        },
      };
    }

    const expected = toFixedNumber(
      Math.max(0, previous - plan.principalAmount),
      precision,
    );
    const actual = toFixedNumber(plan.remainingBalance, precision);

    if (expected !== actual) {
      return {
        valid: false,
        violation: {
          debtName: plan.debtName,
          monthIndex: plan.monthIndex,
          expectedRemainingBalance: expected,
          actualRemainingBalance: actual,
        },
      };
    }

    previousByDebt.set(plan.debtName, actual);
  }

  return { valid: true };
}
