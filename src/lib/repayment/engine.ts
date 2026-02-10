import { rankDebtsByStrategy } from "@/lib/repayment/strategies";
import type {
  Debt,
  MonthlyPlanItem,
  ScenarioInput,
  StrategyResult,
  StrategyType,
} from "@/types/repayment";

type WorkingDebt = Debt & { remainingBalance: number };

const MAX_MONTHS = 1200;

function calculatePayoffDate(monthsToPayoff: number): string {
  const today = new Date();
  const payoff = new Date(today.getFullYear(), today.getMonth() + monthsToPayoff, 1);
  return `${payoff.getFullYear()}-${String(payoff.getMonth() + 1).padStart(2, "0")}`;
}

function calculateMonthlyInterest(balance: number, annualRate: number): number {
  return Math.floor((balance * annualRate) / 12);
}

function hasPositiveBalance(debts: WorkingDebt[]): boolean {
  return debts.some((debt) => debt.remainingBalance > 0);
}

export function simulateStrategy(
  input: ScenarioInput,
  strategy: StrategyType,
): StrategyResult {
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

      debt.remainingBalance = Math.max(0, debt.remainingBalance - principal);
      totalInterest += interest;
      budgetLeft -= minimum;

      monthlyPlans.push({
        monthIndex,
        debtName: debt.name,
        paymentAmount: minimum,
        interestAmount: interest,
        principalAmount: principal,
        remainingBalance: debt.remainingBalance,
      });
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
      debt.remainingBalance -= extra;
      budgetLeft -= extra;

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
    strategy,
    totalInterest,
    monthsToPayoff: monthIndex,
    payoffDate: calculatePayoffDate(monthIndex),
    monthlyPlans,
  };
}
