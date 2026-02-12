import type { Debt, RepaymentType } from "@/types/repayment";

import { calculateMonthlyInterest, toKrw } from "@/utils/currency";

const DEFAULT_TERM_MONTHS = 12;

export type RequiredPayment = {
  interest: number;
  principal: number;
  payment: number;
};

type PaymentInput = Pick<Debt, "annualRate" | "maturityMonths" | "graceMonths" | "repaymentType"> & {
  remainingBalance: number;
};

function resolveRemainingMonths(maturityMonths: number | undefined, elapsedMonths: number): number {
  const baseTerm = Number.isInteger(maturityMonths) && maturityMonths !== undefined && maturityMonths > 0
    ? maturityMonths
    : DEFAULT_TERM_MONTHS;
  return Math.max(1, baseTerm - elapsedMonths);
}

function calculateEqualInstallmentPayment(balance: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) {
    return toKrw(balance / months);
  }

  const denominator = 1 - (1 + monthlyRate) ** -months;
  if (denominator <= 0) {
    return toKrw(balance);
  }

  return toKrw((balance * monthlyRate) / denominator);
}

function allocatePrincipal(
  repaymentType: RepaymentType,
  remainingBalance: number,
  monthlyInterest: number,
  annualRate: number,
  elapsedMonths: number,
  maturityMonths: number | undefined,
  graceMonths: number | undefined,
): number {
  const normalizedGraceMonths =
    Number.isInteger(graceMonths) && graceMonths !== undefined && graceMonths > 0
      ? graceMonths
      : 0;

  if (repaymentType !== "bullet" && elapsedMonths < normalizedGraceMonths) {
    return 0;
  }

  const monthsLeft = resolveRemainingMonths(maturityMonths, elapsedMonths);

  if (repaymentType === "bullet") {
    if (monthsLeft > 1) {
      return 0;
    }

    return toKrw(remainingBalance);
  }

  if (repaymentType === "equalPrincipal") {
    return toKrw(remainingBalance / monthsLeft);
  }

  const monthlyRate = annualRate / 12;
  const installment = calculateEqualInstallmentPayment(remainingBalance, monthlyRate, monthsLeft);
  return Math.max(0, toKrw(installment - monthlyInterest));
}

export function calculateRequiredPayment(input: PaymentInput, elapsedMonths: number): RequiredPayment {
  const balance = toKrw(input.remainingBalance);
  if (balance <= 0) {
    return {
      interest: 0,
      principal: 0,
      payment: 0,
    };
  }

  const interest = calculateMonthlyInterest(balance, input.annualRate);
  const principal = Math.min(
    balance,
    allocatePrincipal(
      input.repaymentType,
      balance,
      interest,
      input.annualRate,
      elapsedMonths,
      input.maturityMonths,
      input.graceMonths,
    ),
  );
  const payment = toKrw(interest + principal);

  return {
    interest,
    principal,
    payment,
  };
}

export function calculateMinimumRequiredMonthlyBudget(debts: Debt[]): number {
  return debts.reduce((sum, debt) => {
    const required = calculateRequiredPayment(
      {
        repaymentType: debt.repaymentType,
        annualRate: debt.annualRate,
        maturityMonths: debt.maturityMonths,
        graceMonths: debt.graceMonths,
        remainingBalance: debt.balance,
      },
      0,
    );

    return sum + required.payment;
  }, 0);
}
