import { rankDebtsByStrategy } from "@/lib/repayment/strategies";
import { calculateMonthlyInterest, preciseAdd, preciseSubtract, toKrw } from "@/utils/currency";
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
  const minimumRequired = input.debts.reduce(
    (sum, debt) => sum + debt.minimumPayment,
    0,
  );

  if (input.monthlyBudget < minimumRequired) {
    throw new Error("BUDGET_BELOW_MINIMUM");
  }

  const monthlyBudget = input.monthlyBudget + input.extraPayment;
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

      const interest = calculateMonthlyInterest(
        debt.remainingBalance,
        debt.annualRate,
      );
      const minimum = Math.min(
        debt.minimumPayment,
        debt.remainingBalance + interest,
      );
      const principal = Math.max(0, minimum - interest);

      debt.remainingBalance = toKrw(preciseSubtract(debt.remainingBalance, principal));
      if (debt.remainingBalance <= 1) {
        debt.remainingBalance = 0;
      }
      totalInterest = toKrw(preciseAdd(totalInterest, interest));
      budgetLeft = toKrw(preciseSubtract(budgetLeft, minimum));

      monthlyPlans.push({
        monthIndex,
        debtName: debt.name,
        paymentAmount: minimum,
        interestAmount: interest,
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

      const extra = Math.min(budgetLeft, debt.remainingBalance);
      const fee = calculatePrepaymentFee({
        amount: extra,
        rate: debt.prepaymentFeeRate ?? 0,
        elapsedMonths: monthIndex - 1,
        exemptionMonths: debt.feeExemptionMonths ?? 0,
      });

      debt.remainingBalance = toKrw(preciseSubtract(debt.remainingBalance, extra));
      if (debt.remainingBalance <= 1) {
        debt.remainingBalance = 0;
      }
      budgetLeft = toKrw(preciseSubtract(budgetLeft, extra));
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
