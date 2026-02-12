import { rankDebtsByStrategy } from "@/lib/repayment/strategies";
import {
  calculateMinimumRequiredMonthlyBudget,
  calculateRequiredPayment,
} from "@/lib/repayment/required-payment";
import { preciseAdd, preciseSubtract, toKrw } from "@/utils/currency";
import { calculatePrepaymentFee } from "@/utils/fee-calculator";
import type {
  Debt,
  MonthlyPlanItem,
  ScenarioInput,
  StrategyResult,
  StrategyType,
} from "@/types/repayment";

type WorkingDebt = Debt & { remainingBalance: number };

type SimulationCoreResult = {
  totalInterest: number;
  totalFeesPaid: number;
  monthsToPayoff: number;
  payoffDate: string;
  monthlyPlans: MonthlyPlanItem[];
};

const MAX_MONTHS = 1200;

function resolveExtraPrincipalWithinBudget(
  budgetLeft: number,
  maxPrincipal: number,
  rate: number,
  elapsedMonths: number,
  exemptionMonths: number,
): { principal: number; fee: number } {
  const maxCandidate = Math.floor(Math.min(Math.max(0, budgetLeft), Math.max(0, maxPrincipal)));
  if (maxCandidate <= 0) {
    return { principal: 0, fee: 0 };
  }

  let low = 0;
  let high = maxCandidate;
  let bestPrincipal = 0;
  let bestFee = 0;

  while (low <= high) {
    const principal = Math.floor((low + high) / 2);
    const fee = calculatePrepaymentFee({
      amount: principal,
      rate,
      elapsedMonths,
      exemptionMonths,
    });
    const totalSpend = principal + fee;

    if (totalSpend <= budgetLeft) {
      bestPrincipal = principal;
      bestFee = fee;
      low = principal + 1;
    } else {
      high = principal - 1;
    }
  }

  return { principal: bestPrincipal, fee: bestFee };
}

function calculatePayoffDate(monthsToPayoff: number): string {
  const today = new Date();
  const payoff = new Date(today.getFullYear(), today.getMonth() + monthsToPayoff, 1);
  return `${payoff.getFullYear()}-${String(payoff.getMonth() + 1).padStart(2, "0")}`;
}

function hasPositiveBalance(debts: WorkingDebt[]): boolean {
  return debts.some((debt) => debt.remainingBalance > 0);
}

export function simulateStrategy(
  input: ScenarioInput,
  strategy: StrategyType,
): StrategyResult {
  const result = simulateStrategyCore(input, strategy);
  const baseline =
    input.extraPayment > 0
      ? simulateStrategyCore({ ...input, extraPayment: 0 }, strategy)
      : result;
  const grossSavings = Math.max(0, baseline.totalInterest - result.totalInterest);

  return {
    strategy,
    totalInterest: result.totalInterest,
    totalFeesPaid: result.totalFeesPaid,
    netSavings: grossSavings - result.totalFeesPaid,
    monthsToPayoff: result.monthsToPayoff,
    payoffDate: result.payoffDate,
    monthlyPlans: result.monthlyPlans,
  };
}

function simulateStrategyCore(
  input: ScenarioInput,
  strategy: StrategyType,
): SimulationCoreResult {
  const minimumRequired = calculateMinimumRequiredMonthlyBudget(input.debts);
  const monthlyBudget = minimumRequired + input.extraPayment;
  const workingDebts: WorkingDebt[] = input.debts.map((debt) => ({
    ...debt,
    remainingBalance: debt.balance,
  }));

  const monthlyPlans: MonthlyPlanItem[] = [];
  let totalInterest = 0;
  let totalFeesPaid = 0;
  let monthIndex = 0;

  while (hasPositiveBalance(workingDebts) && monthIndex < MAX_MONTHS) {
    monthIndex += 1;
    let budgetLeft = monthlyBudget;

    for (const debt of workingDebts) {
      if (debt.remainingBalance <= 0) {
        continue;
      }

      const required = calculateRequiredPayment(
        {
          remainingBalance: debt.remainingBalance,
          annualRate: debt.annualRate,
          repaymentType: debt.repaymentType,
          maturityMonths: debt.maturityMonths,
          graceMonths: debt.graceMonths,
        },
        monthIndex - 1,
      );
      const payment = Math.min(required.payment, debt.remainingBalance + required.interest);
      const principal = Math.max(0, payment - required.interest);

      debt.remainingBalance = toKrw(preciseSubtract(debt.remainingBalance, principal));
      if (debt.remainingBalance <= 1) {
        debt.remainingBalance = 0;
      }
      totalInterest = toKrw(preciseAdd(totalInterest, required.interest));
      budgetLeft = toKrw(preciseSubtract(budgetLeft, payment));

      monthlyPlans.push({
        monthIndex,
        debtName: debt.name,
        paymentAmount: payment,
        interestAmount: required.interest,
        principalAmount: principal,
        remainingBalance: debt.remainingBalance,
      });
    }

    if (!hasPositiveBalance(workingDebts)) {
      break;
    }

    const rankedDebts = rankDebtsByStrategy(
      workingDebts.filter((debt) => debt.remainingBalance > 0),
      strategy,
    );

    for (const debt of rankedDebts) {
      if (budgetLeft <= 0) {
        break;
      }

      const { principal: extra, fee } = resolveExtraPrincipalWithinBudget(
        budgetLeft,
        debt.remainingBalance,
        debt.prepaymentFeeRate ?? 0,
        monthIndex - 1,
        debt.feeExemptionMonths ?? 0,
      );

      if (extra <= 0) {
        continue;
      }

      debt.remainingBalance = toKrw(preciseSubtract(debt.remainingBalance, extra));
      if (debt.remainingBalance <= 1) {
        debt.remainingBalance = 0;
      }
      budgetLeft = toKrw(preciseSubtract(budgetLeft, extra + fee));
      totalFeesPaid = toKrw(preciseAdd(totalFeesPaid, fee));

      monthlyPlans.push({
        monthIndex,
        debtName: debt.name,
        paymentAmount: extra,
        interestAmount: 0,
        principalAmount: extra,
        remainingBalance: debt.remainingBalance,
      });
    }
  }

  if (hasPositiveBalance(workingDebts)) {
    throw new Error("UNPAYOFFABLE_SCENARIO");
  }

  return {
    totalInterest,
    totalFeesPaid,
    monthsToPayoff: monthIndex,
    payoffDate: calculatePayoffDate(monthIndex),
    monthlyPlans,
  };
}
